import { z } from 'zod';
import { PHONE_PATTERN } from '@/lib/forms/patterns';
import { fill } from '@/lib/text/fill';
import { MAX_LENGTH, type DjEnquiry, type EnquiryField } from './enquiry';

export interface EnquiryErrorCopy {
  name: string;
  email: string;
  emailInvalid: string;
  phone: string;
  budget: string;
  about: string;
  /** For any field over its length; `{max}` is replaced by the limit. */
  tooLong: string;
}

export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

function enquirySchema(copy: EnquiryErrorCopy) {
  const tooLong = (field: EnquiryField) =>
    fill(copy.tooLong, { max: MAX_LENGTH[field] });
  const required = (field: EnquiryField, missing: string) =>
    z.string().trim().min(1, missing).max(MAX_LENGTH[field], tooLong(field));
  const optional = (field: EnquiryField) =>
    z.string().trim().max(MAX_LENGTH[field], tooLong(field));

  return z.object({
    name: required('name', copy.name),
    title: optional('title'),
    email: z
      .string()
      .trim()
      .min(1, copy.email)
      .max(MAX_LENGTH.email, tooLong('email'))
      .pipe(z.email(copy.emailInvalid)),
    phone: optional('phone').refine(
      (value) => value === '' || PHONE_PATTERN.test(value),
      copy.phone
    ),
    eventName: optional('eventName'),
    eventVenue: optional('eventVenue'),
    budget: required('budget', copy.budget),
    about: required('about', copy.about)
  });
}

/** The first problem with each field; an empty object means it can go. */
export function validateEnquiry(
  enquiry: DjEnquiry,
  copy: EnquiryErrorCopy
): EnquiryErrors {
  const result = enquirySchema(copy).safeParse(enquiry);
  if (result.success) return {};
  const errors: EnquiryErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as EnquiryField;
    errors[field] ??= issue.message;
  }
  return errors;
}
