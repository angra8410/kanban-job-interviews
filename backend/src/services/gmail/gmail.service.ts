import { google } from 'googleapis';
import { gmailAuthService } from './auth.service';

export class GmailService {
  /**
   * Returns a Gmail API instance using the authorized client
   */
  private async getGmailInstance() {
    const auth = await gmailAuthService.authorize();
    return google.gmail({ version: 'v1', auth });
  }

  /**
   * List messages from the user's inbox
   * @param query Gmail search query (e.g., 'subject:"Job Application"')
   */
  async listMessages(query: string = '') {
    try {
      const gmail = await this.getGmailInstance();
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
      });

      return response.data.messages || [];
    } catch (error) {
      console.error('Error listing Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get a specific message by ID
   * @param messageId ID of the message to retrieve
   */
  async getMessage(messageId: string) {
    try {
      const gmail = await this.getGmailInstance();
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting Gmail message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Future: Watch for new messages using Gmail webhooks (Push Notifications)
   */
  async setupWatch(topicName: string) {
    try {
      const gmail = await this.getGmailInstance();
      const response = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds: ['INBOX'],
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error setting up Gmail watch:', error);
      throw error;
    }
  }
}

export const gmailService = new GmailService();
