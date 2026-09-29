import { z } from 'zod';
import { PHONE_PATTERN } from '@/lib/forms/patterns';
import type { BookingDetails } from './bookingState';

export interface DetailsMessages {
  name: string;
  email: string;
  emailInvalid: string;
  phone: string;
  note: string;
}

export type DetailsErrors = Partial<Record<keyof BookingDetails, string>>;

export const NOTE_MAX_LENGTH = 1000;

export function detailsSchema(messages: DetailsMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.name).max(120, messages.name),
    email: z
      .string()
      .trim()
      .min(1, messages.email)
      .pipe(z.email(messages.emailInvalid)),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || PHONE_PATTERN.test(value),
        messages.phone
      ),
    note: z.string().max(NOTE_MAX_LENGTH, messages.note)
  });
}

/** The first problem with each field; an empty object means it's valid. */
export function validateDetails(
  details: BookingDetails,
  messages: DetailsMessages
): DetailsErrors {
  const result = detailsSchema(messages).safeParse(details);
  if (result.success) return {};
  const errors: DetailsErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof BookingDetails;
    errors[key] ??= issue.message;
  }
  return errors;
}
