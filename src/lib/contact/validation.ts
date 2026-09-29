import { z } from 'zod';
import { PHONE_PATTERN } from '@/lib/forms/patterns';
import { MAX_LENGTH, type ContactField, type ContactMessage } from './message';

export interface MessageErrorCopy {
  name: string;
  email: string;
  emailInvalid: string;
  subject: string;
  message: string;
  phone: string;
  /** For any field over its length; `{max}` is replaced by the limit. */
  tooLong: string;
}

export type MessageErrors = Partial<Record<ContactField, string>>;

function messageSchema(copy: MessageErrorCopy) {
  const tooLong = (field: ContactField) =>
    copy.tooLong.replace('{max}', String(MAX_LENGTH[field]));
  const required = (field: ContactField, missing: string) =>
    z.string().trim().min(1, missing).max(MAX_LENGTH[field], tooLong(field));
  const optional = (field: ContactField) =>
    z.string().trim().max(MAX_LENGTH[field], tooLong(field));

  return z.object({
    name: required('name', copy.name),
    email: z
      .string()
      .trim()
      .min(1, copy.email)
      .max(MAX_LENGTH.email, tooLong('email'))
      .pipe(z.email(copy.emailInvalid)),
    subject: required('subject', copy.subject),
    message: required('message', copy.message),
    phone: optional('phone').refine(
      (value) => value === '' || PHONE_PATTERN.test(value),
      copy.phone
    ),
    organisation: optional('organisation'),
    date: optional('date'),
    location: optional('location'),
    budget: optional('budget'),
    links: optional('links')
  });
}

/** The first problem with each field; an empty object means it can go. */
export function validateMessage(
  message: ContactMessage,
  copy: MessageErrorCopy
): MessageErrors {
  const result = messageSchema(copy).safeParse(message);
  if (result.success) return {};
  const errors: MessageErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField;
    errors[field] ??= issue.message;
  }
  return errors;
}
