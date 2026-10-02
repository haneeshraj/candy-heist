'use server';

import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { looksAutomated } from '@/lib/forms/spam';
import { cleanMessage } from '@/lib/inbox/documents';
import { fileMessage } from '@/lib/inbox/store';
import { REQUIRED_FIELDS } from './message';
import { validateMessage, type MessageErrorCopy } from './validation';

// Where a contact message goes: checked again here, since this runs on the
// server for anyone who calls it, then filed in the database for Candy
// Haven to pick up. Nobody is emailed; the page saying it's sent is all
// the visitor gets.

export interface SentMessage {
  name: string;
  email: string;
}

export type SendMessageResult =
  | { ok: true; sent: SentMessage }
  | { ok: false; reason: 'invalid' | 'limited' | 'unavailable' };

/** Messages one visitor can send in an hour. */
const HOURLY_LIMIT = 5;

// The server only needs to know whether there's a problem, not to word it.
const PLAIN: MessageErrorCopy = {
  name: 'name',
  email: 'email',
  emailInvalid: 'email',
  subject: 'subject',
  message: 'message',
  phone: 'phone',
  tooLong: 'too long'
};

export async function sendMessage(
  raw: unknown,
  check: unknown
): Promise<SendMessageResult> {
  const message = cleanMessage(raw);
  const sent = { name: message.name, email: message.email };

  // A bot is told it went through, and nothing is kept.
  if (looksAutomated(check)) return { ok: true, sent };

  const incomplete = REQUIRED_FIELDS.some((field) => message[field] === '');
  if (incomplete || Object.keys(validateMessage(message, PLAIN)).length > 0)
    return { ok: false, reason: 'invalid' };

  try {
    if (!(await withinHourlyLimit('contact', HOURLY_LIMIT)))
      return { ok: false, reason: 'limited' };
    await fileMessage(message);
    return { ok: true, sent };
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError))
      console.error('A contact message could not be filed.', error);
    return { ok: false, reason: 'unavailable' };
  }
}
