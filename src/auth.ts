// src/auth.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// --- Calculate paths relative to this script file (ESM way) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.resolve(__dirname, '..');

// --- Configurable credentials directory ---
const CREDENTIALS_DIR = process.env.GOOGLE_CREDENTIALS_DIR || path.join(projectRootDir, 'credentials');
const DEFAULT_CREDENTIALS_PATH = path.join(projectRootDir, 'credentials.json');
// --- End of path calculation ---

const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive' // Full Drive access for listing, searching, and document discovery
];

async function loadSavedCredentialsIfExist(credentialsFileName?: string): Promise<OAuth2Client | null> {
  try {
    const tokenPath = credentialsFileName 
      ? path.join(CREDENTIALS_DIR, `${credentialsFileName}.token.json`)
      : path.join(projectRootDir, 'token.json');
    
    const content = await fs.readFile(tokenPath);
    const credentials = JSON.parse(content.toString());
    const { client_secret, client_id, redirect_uris } = await loadClientSecrets(credentialsFileName);
    const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
    client.setCredentials(credentials);
    return client;
  } catch (err) {
    return null;
  }
}

async function loadClientSecrets(credentialsFileName?: string) {
  const credentialsPath = credentialsFileName 
    ? path.join(CREDENTIALS_DIR, `${credentialsFileName}.credentials.json`)
    : DEFAULT_CREDENTIALS_PATH;
    
  const content = await fs.readFile(credentialsPath);
  const keys = JSON.parse(content.toString());
  const key = keys.installed || keys.web;
   if (!key) throw new Error(`Could not find client secrets in ${credentialsPath}.`);
  return {
      client_id: key.client_id,
      client_secret: key.client_secret,
      redirect_uris: key.redirect_uris || ['http://localhost:3000/'], // Default for web clients
      client_type: keys.web ? 'web' : 'installed'
  };
}

async function saveCredentials(client: OAuth2Client, credentialsFileName?: string): Promise<void> {
  const { client_secret, client_id } = await loadClientSecrets(credentialsFileName);
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: client_id,
    client_secret: client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  
  const tokenPath = credentialsFileName 
    ? path.join(CREDENTIALS_DIR, `${credentialsFileName}.token.json`)
    : path.join(projectRootDir, 'token.json');
    
  await fs.writeFile(tokenPath, payload);
  console.error('Token stored to', tokenPath);
}

async function authenticate(credentialsFileName?: string): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris, client_type } = await loadClientSecrets(credentialsFileName);
  // For web clients, use the configured redirect URI; for desktop clients, use 'urn:ietf:wg:oauth:2.0:oob'
  const redirectUri = client_type === 'web' ? redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob';
  console.error(`DEBUG: Using redirect URI: ${redirectUri}`);
  console.error(`DEBUG: Client type: ${client_type}`);
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES.join(' '),
  });

  console.error('DEBUG: Generated auth URL:', authorizeUrl);
  console.error('Authorize this app by visiting this url:', authorizeUrl);
  const code = await rl.question('Enter the code from that page here: ');
  rl.close();

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    if (tokens.refresh_token) { // Save only if we got a refresh token
         await saveCredentials(oAuth2Client, credentialsFileName);
    } else {
         console.error("Did not receive refresh token. Token might expire.");
    }
    console.error('Authentication successful!');
    return oAuth2Client;
  } catch (err) {
    console.error('Error retrieving access token', err);
    throw new Error('Authentication failed');
  }
}

export async function authorize(credentialsFileName?: string): Promise<OAuth2Client> {
  let client = await loadSavedCredentialsIfExist(credentialsFileName);
  if (client) {
    // Optional: Add token refresh logic here if needed, though library often handles it.
    console.error('Using saved credentials.');
    return client;
  }
  console.error('Starting authentication flow...');
  client = await authenticate(credentialsFileName);
  return client;
}

// New function to create a new client with unique credentials
export async function createNewClient(clientName?: string): Promise<{ client: OAuth2Client; credentialsFileName: string }> {
  // Ensure credentials directory exists
  try {
    await fs.mkdir(CREDENTIALS_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist, that's fine
  }

  // Generate unique filename if not provided
  const credentialsFileName = clientName || `client_${uuidv4()}`;
  
  console.error(`Creating new client with credentials file: ${credentialsFileName}`);
  
  // Check if credentials file already exists
  const credentialsPath = path.join(CREDENTIALS_DIR, `${credentialsFileName}.credentials.json`);
  try {
    await fs.access(credentialsPath);
    throw new Error(`Credentials file ${credentialsFileName} already exists. Please choose a different name.`);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err; // Re-throw if it's not a "file not found" error
    }
  }

  // Copy default credentials to new file
  try {
    const defaultCredentials = await fs.readFile(DEFAULT_CREDENTIALS_PATH);
    await fs.writeFile(credentialsPath, defaultCredentials);
    console.error(`Copied default credentials to ${credentialsPath}`);
  } catch (err) {
    throw new Error(`Could not copy default credentials. Make sure ${DEFAULT_CREDENTIALS_PATH} exists.`);
  }

  // Authenticate with the new credentials file
  const client = await authenticate(credentialsFileName);
  
  return { client, credentialsFileName };
}

// Function to list all available client credentials
export async function listClientCredentials(): Promise<string[]> {
  try {
    await fs.mkdir(CREDENTIALS_DIR, { recursive: true });
    const files = await fs.readdir(CREDENTIALS_DIR);
    return files
      .filter(file => file.endsWith('.credentials.json'))
      .map(file => file.replace('.credentials.json', ''));
  } catch (err) {
    return [];
  }
}

// Function to load a specific client by credentials filename
export async function loadClient(credentialsFileName: string): Promise<OAuth2Client> {
  return await authorize(credentialsFileName);
}
