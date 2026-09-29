import { REQUIRED_FIELDS, type ContactMessage } from './message';

// Where a contact message goes. For now it only checks that the message is
// complete and hands back who it's from: delivering it to Candy Heist and
// keeping a copy arrive with the Server Actions and the database. The form
// already awaits it, so swapping it in changes nothing else.

export class IncompleteMessageError extends Error {
  constructor() {
    super('The message is missing its name, email, subject or message.');
    this.name = 'IncompleteMessageError';
  }
}

export interface SentMessage {
  name: string;
  email: string;
}

export async function sendMessage(
  message: ContactMessage
): Promise<SentMessage> {
  if (REQUIRED_FIELDS.some((field) => message[field].trim() === ''))
    throw new IncompleteMessageError();

  return { name: message.name.trim(), email: message.email.trim() };
}
