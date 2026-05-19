import { gmailService } from './gmail.service';
import { Email } from '../../models/email.model';
import { EmailParser } from '../../utils/emailParser';

export class EmailListenerService {
  /**
   * Fetches and normalizes a list of emails based on a query.
   */
  async fetchEmails(query: string = 'is:unread'): Promise<Email[]> {
    try {
      const messages = await gmailService.listMessages(query);
      const emailPromises = messages.map(async (msg) => {
        if (!msg.id) return null;
        
        const fullMsg = await gmailService.getMessage(msg.id);
        if (!fullMsg.payload) return null;

        const headers = fullMsg.payload.headers || [];
        
        return {
          id: fullMsg.id!,
          threadId: fullMsg.threadId!,
          subject: EmailParser.getHeader(headers, 'Subject'),
          sender: EmailParser.getHeader(headers, 'From'),
          body: EmailParser.parseBody(fullMsg.payload),
          receivedAt: new Date(parseInt(fullMsg.internalDate || Date.now().toString())),
        };
      });

      const results = await Promise.all(emailPromises);
      return results.filter((email): email is Email => email !== null);
    } catch (error) {
      console.error('Error fetching and parsing emails:', error);
      throw error;
    }
  }
}

export const emailListenerService = new EmailListenerService();
