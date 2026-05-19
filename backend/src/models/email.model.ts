export interface Email {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  body: string;
  receivedAt: Date;
}
