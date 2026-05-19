import { gmail_v1 } from 'googleapis';

export class EmailParser {
  /**
   * Extracts clean plain text from a Gmail message payload.
   */
  static parseBody(payload: gmail_v1.Schema$MessagePart): string {
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf8');
    } else if (payload.parts) {
      // Recursively look for the plain text part
      const textPart = this.findPart(payload.parts, 'text/plain');
      const htmlPart = this.findPart(payload.parts, 'text/html');
      
      const partToUse = textPart || htmlPart;
      if (partToUse?.body?.data) {
        body = Buffer.from(partToUse.body.data, 'base64').toString('utf8');
      }
    }

    return this.cleanText(body);
  }

  /**
   * Helper to find a specific mimeType in multipart message.
   */
  private static findPart(parts: gmail_v1.Schema$MessagePart[], mimeType: string): gmail_v1.Schema$MessagePart | undefined {
    for (const part of parts) {
      if (part.mimeType === mimeType) return part;
      if (part.parts) {
        const found = this.findPart(part.parts, mimeType);
        if (found) return found;
      }
    }
    return undefined;
  }

  /**
   * Basic text cleaning (removing excessive HTML tags if any).
   */
  private static cleanText(text: string): string {
    return text
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/\s\s+/g, ' ')     // Collapse multiple spaces
      .trim();
  }

  /**
   * Extracts specific header value by name.
   */
  static getHeader(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string {
    const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  }
}
