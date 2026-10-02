'use server';

import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { looksAutomated } from '@/lib/forms/spam';
import { cleanEnquiry } from '@/lib/inbox/documents';
import { fileEnquiry } from '@/lib/inbox/store';
import { REQUIRED_FIELDS, type DjEnquiry } from './enquiry';
import { validateEnquiry, type EnquiryErrorCopy } from './validation';

// Where a DJ enquiry goes: checked again here, since this runs on the
// server for anyone who calls it, then filed in the database for Candy
// Haven to pick up. Nobody is emailed; the page saying it's sent is all
// the visitor gets.

/** What was sent, for the slip on the page that says so. */
export type SentEnquiry = DjEnquiry;

export type SendEnquiryResult =
  | { ok: true; sent: SentEnquiry }
  | { ok: false; reason: 'invalid' | 'limited' | 'unavailable' };

/** Enquiries one visitor can send in an hour. */
const HOURLY_LIMIT = 5;

// The server only needs to know whether there's a problem, not to word it.
const PLAIN: EnquiryErrorCopy = {
  name: 'name',
  email: 'email',
  emailInvalid: 'email',
  phone: 'phone',
  budget: 'budget',
  about: 'about',
  tooLong: 'too long'
};

export async function sendEnquiry(
  raw: unknown,
  check: unknown
): Promise<SendEnquiryResult> {
  const enquiry = cleanEnquiry(raw);

  // A bot is told it went through, and nothing is kept.
  if (looksAutomated(check)) return { ok: true, sent: enquiry };

  const incomplete = REQUIRED_FIELDS.some((field) => enquiry[field] === '');
  if (incomplete || Object.keys(validateEnquiry(enquiry, PLAIN)).length > 0)
    return { ok: false, reason: 'invalid' };

  try {
    if (!(await withinHourlyLimit('dj-enquiry', HOURLY_LIMIT)))
      return { ok: false, reason: 'limited' };
    await fileEnquiry(enquiry);
    return { ok: true, sent: enquiry };
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError))
      console.error('A DJ enquiry could not be filed.', error);
    return { ok: false, reason: 'unavailable' };
  }
}
