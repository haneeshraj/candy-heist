import 'server-only';
import { buildMime, toRaw, type Address } from '@/lib/email/mime';
import { googleAccess, googleFetch, GoogleRequestError } from './oauth';

// Email from Candy's own Gmail: clients get their receipts from him, and a
// reply goes straight back to him. Gmail keeps a copy in his Sent mail.

export const SENDER_NAME = 'Candy Heist';

export interface OutgoingEmail {
  to: Address;
  replyTo?: Address;
  subject: string;
  text: string;
  html: string;
}

/** The address emails go out from: Candy's connected account. */
export async function senderAddress(): Promise<string> {
  return (await googleAccess()).email;
}

export async function sendEmail(email: OutgoingEmail): Promise<void> {
  const address = await senderAddress();
  const raw = toRaw(
    buildMime({ ...email, from: { name: SENDER_NAME, address } })
  );
  const response = await googleFetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { method: 'POST', body: JSON.stringify({ raw }) }
  );
  if (!response.ok)
    throw new GoogleRequestError(response.status, await response.text());
}
