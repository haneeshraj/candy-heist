import { z } from 'zod';
import { PHONE_PATTERN } from '@/lib/forms/patterns';
import type { BookingDetails } from './bookingState';

export interface DetailsMessages {
  name: string;
  email: string;
  emailInvalid: string;
  instagram: string;
  discord: string;
  /** When Discord is picked to meet on, the username has to be there. */
  discordRequired: string;
  phone: string;
  note: string;
}

type TextField = Exclude<keyof BookingDetails, 'meetOn'>;
export type DetailsErrors = Partial<Record<TextField, string>>;

export const NOTE_MAX_LENGTH = 1000;

// Handles are forgiving about a leading @ and capitals. Discord usernames
// are 2 to 32 letters, digits, dots and underscores; an older name keeps
// its #1234. Instagram's are up to 30 of the same.
const DISCORD = /^@?[a-z0-9_.]{2,32}(?:#\d{4})?$/i;
const INSTAGRAM = /^@?[a-z0-9_.]{1,30}$/i;

const optional = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || pattern.test(value), message);

export function detailsSchema(messages: DetailsMessages) {
  return z
    .object({
      name: z.string().trim().min(1, messages.name).max(120, messages.name),
      email: z
        .string()
        .trim()
        .min(1, messages.email)
        .pipe(z.email(messages.emailInvalid)),
      meetOn: z.enum(['meet', 'discord']),
      instagram: optional(INSTAGRAM, messages.instagram),
      discord: optional(DISCORD, messages.discord),
      phone: optional(PHONE_PATTERN, messages.phone),
      note: z.string().max(NOTE_MAX_LENGTH, messages.note)
    })
    .superRefine((details, context) => {
      if (details.meetOn === 'discord' && details.discord.trim() === '')
        context.addIssue({
          code: 'custom',
          path: ['discord'],
          message: messages.discordRequired
        });
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
    const key = issue.path[0] as TextField;
    errors[key] ??= issue.message;
  }
  return errors;
}
