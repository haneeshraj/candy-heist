import { REQUIRED_FIELDS, type DjEnquiry } from './enquiry';

// Where an enquiry goes. For now it only checks that the enquiry is
// complete and hands it back, tidied: delivering it to Candy Heist and
// keeping a copy arrive with the Server Actions and the database. The form
// already awaits it, so swapping it in changes nothing else.

export class IncompleteEnquiryError extends Error {
  constructor() {
    super('The enquiry is missing its name, email, budget or event.');
    this.name = 'IncompleteEnquiryError';
  }
}

/** What was sent, for the slip on the page that says so. */
export type SentEnquiry = DjEnquiry;

export async function sendEnquiry(enquiry: DjEnquiry): Promise<SentEnquiry> {
  if (REQUIRED_FIELDS.some((field) => enquiry[field].trim() === ''))
    throw new IncompleteEnquiryError();

  return Object.fromEntries(
    Object.entries(enquiry).map(([field, value]) => [field, value.trim()])
  ) as SentEnquiry;
}
