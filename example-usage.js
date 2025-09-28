// Example usage of the multi-client Google Docs MCP Server
// This is a demonstration script showing how to use the new functionality

const { createNewClient, listClientCredentials, loadClient } = require('./dist/auth.js');

async function demonstrateMultiClient() {
  try {
    console.log('=== Multi-Client Google Docs MCP Server Demo ===\n');

    // 1. List existing clients
    console.log('1. Listing existing clients...');
    const existingClients = await listClientCredentials();
    console.log('Existing clients:', existingClients);
    console.log('');

    // 2. Create a new client (this would normally require user interaction for OAuth)
    console.log('2. Creating a new client...');
    try {
      const { client, credentialsFileName } = await createNewClient('demo-client');
      console.log(`Created client: ${credentialsFileName}`);
      console.log('Note: In a real scenario, you would need to complete OAuth flow');
    } catch (error) {
      console.log('Error creating client (expected if no default credentials.json exists):', error.message);
    }
    console.log('');

    // 3. List clients again
    console.log('3. Listing clients after creation...');
    const updatedClients = await listClientCredentials();
    console.log('Updated clients:', updatedClients);
    console.log('');

    console.log('=== Demo Complete ===');
    console.log('To use this in practice:');
    console.log('1. Ensure you have a credentials.json file in the project root');
    console.log('2. Run the MCP server and use the tools via MCP client');
    console.log('3. Use createNewGoogleClient tool to create additional clients');
    console.log('4. Use setWorkflowCredentials to set default credentials');
    console.log('5. Use credentialsFileName parameter in other tools as needed');

  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateMultiClient();
}

module.exports = { demonstrateMultiClient };
