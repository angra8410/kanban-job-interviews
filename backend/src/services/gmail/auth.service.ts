import fs from 'fs/promises';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import { config } from '../../config';
import { OAuth2Client } from 'google-auth-library';

export class GmailAuthService {
  private client: OAuth2Client | null = null;

  /**
   * Reads previously authorized credentials from the save file.
   */
  async loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
    try {
      const content = await fs.readFile(config.gmail.tokenPath, 'utf8');
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials) as OAuth2Client;
    } catch (err) {
      return null;
    }
  }

  /**
   * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
   */
  async saveCredentials(client: OAuth2Client): Promise<void> {
    const content = await fs.readFile(config.gmail.credentialsPath, 'utf8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(config.gmail.tokenPath, payload);
  }

  /**
   * Load or request or authorization to proceed with gmail calls.
   */
  async authorize(): Promise<OAuth2Client> {
    let client = await this.loadSavedCredentialsIfExist();
    if (client) {
      this.client = client;
      return client;
    }

    console.log('Requesting Gmail scopes:', config.gmail.scopes);
    const authClient = await authenticate({
      scopes: config.gmail.scopes,
      keyfilePath: config.gmail.credentialsPath,
    });

    if (authClient.credentials) {
      await this.saveCredentials(authClient as unknown as OAuth2Client);
    }
    
    this.client = authClient as unknown as OAuth2Client;
    return this.client;
  }

  /**
   * Returns the authenticated client or throws if not authorized.
   */
  getAuthorizedClient(): OAuth2Client {
    if (!this.client) {
      throw new Error('Gmail client not authorized. Please run authorization flow.');
    }
    return this.client;
  }
}

export const gmailAuthService = new GmailAuthService();
