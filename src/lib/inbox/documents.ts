import {
  FIELD_ORDER as MESSAGE_FIELDS,
  type ContactMessage
} from '@/lib/contact/message';
import {
  FIELD_ORDER as ENQUIRY_FIELDS,
  type DjEnquiry
} from '@/lib/enquiry/enquiry';
import type { EnquiryDocument, MessageDocument } from '@/lib/db/collections';
import type { EnquiryStatus, MessageStatus } from './status';

// Between what a visitor sends, what's filed, and what Candy Haven reads.

/**
 * What arrived, as the form's fields and nothing else, each a trimmed
 * string. A Server Action is a public endpoint: what reaches it may not
 * have come from the form at all, so it's rebuilt field by field rather
 * than trusted whole.
 */
function pick<Field extends string>(
  fields: readonly Field[],
  raw: unknown
): Record<Field, string> {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  return Object.fromEntries(
    fields.map((field) => {
      const value = source[field];
      return [field, typeof value === 'string' ? value.trim() : ''];
    })
  ) as Record<Field, string>;
}

export const cleanMessage = (raw: unknown): ContactMessage =>
  pick(MESSAGE_FIELDS, raw);

export const cleanEnquiry = (raw: unknown): DjEnquiry =>
  pick(ENQUIRY_FIELDS, raw);

export function messageDocument(
  message: ContactMessage,
  ref: string,
  now: Date
): Omit<MessageDocument, '_id'> {
  return { ref, ...message, status: 'new', createdAt: now, updatedAt: now };
}

export function enquiryDocument(
  enquiry: DjEnquiry,
  ref: string,
  now: Date
): Omit<EnquiryDocument, '_id'> {
  return { ref, ...enquiry, status: 'new', createdAt: now, updatedAt: now };
}

// What Candy Haven is handed: the same fields, with the id as a string and
// the dates as ISO text, which is what crosses JSON intact.

export type MessageForHaven = ContactMessage & {
  id: string;
  ref: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryForHaven = DjEnquiry & {
  id: string;
  ref: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export function messageForHaven(doc: MessageDocument): MessageForHaven {
  return {
    ...pick(MESSAGE_FIELDS, doc),
    id: doc._id.toHexString(),
    ref: doc.ref,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export function enquiryForHaven(doc: EnquiryDocument): EnquiryForHaven {
  return {
    ...pick(ENQUIRY_FIELDS, doc),
    id: doc._id.toHexString(),
    ref: doc.ref,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}
