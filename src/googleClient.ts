// src/googleClient.ts
import { google } from "googleapis";

export async function getGoogleClient(oauthTokens: {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // ha kell
  );

  oauth2Client.setCredentials(oauthTokens);

  const googleDocs = google.docs({ version: "v1", auth: oauth2Client });
  const googleDrive = google.drive({ version: "v3", auth: oauth2Client });

  return { oauth2Client, googleDocs, googleDrive };
}
