import { z } from 'zod';
import type { Chain, Note } from './engine';

// A consultation: a track Candy shares from Candy Haven for other
// producers to give feedback on, through a link on this site that stays
// open for a week at most. What Haven sends to open one, what it's handed
// back, and the limits both sides keep.
//
// The track itself is never here. Haven uploads it to Firebase Storage and
// sends its address; the page plays it from there. When the link closes,
// the address and every piece of feedback go (the TTL indexes in
// collections.ts), and only the record that there was one stays, for
// Haven to show as expired.

export const DAY = 24 * 60 * 60 * 1000;

/** The longest a link stays open, from when it's shared. */
export const MAX_DAYS = 7;

export const MAX_TITLE = 120;
export const MAX_MESSAGE = 1000;

/** The largest track a link plays. Haven refuses bigger before uploading. */
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/** Where every track lives: Firebase Storage, under its own folder. */
export const STORAGE_ORIGIN = 'https://firebasestorage.googleapis.com';
export const STORAGE_FOLDER = 'consultation/';

/** Feedback one visitor can send in an hour. */
export const FEEDBACK_PER_HOUR = 10;

const date = z.iso.datetime({ offset: true });

/** What Haven sends to open a link. */
export const OpenConsultationSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE),
  message: z.string().trim().max(MAX_MESSAGE).default(''),
  durationMs: z
    .number()
    .int()
    .positive()
    .max(4 * 60 * 60 * 1000),
  bpm: z.number().min(60).max(200).nullable().default(null),
  days: z.number().int().min(1).max(MAX_DAYS),
  audio: z.object({
    path: z
      .string()
      .startsWith(STORAGE_FOLDER)
      .max(300)
      .refine((path) => !path.includes('..'), 'Not a path of ours.'),
    url: z
      .url()
      .max(2000)
      .refine(
        (url) => url.startsWith(`${STORAGE_ORIGIN}/`),
        'Only Firebase Storage plays here.'
      ),
    bytes: z.number().int().positive().max(MAX_AUDIO_BYTES),
    contentType: z.string().regex(/^audio\/[\w.+-]+$/)
  }),
  /** The compact waveform (engine/peaks.ts), as base64. */
  waveform: z.string().min(1).max(20000)
});
export type OpenConsultation = z.infer<typeof OpenConsultationSchema>;

/** What Haven may change about a link once it's open. */
export const ChangeConsultationSchema = z
  .object({
    expiresAt: date.optional(),
    /** Haven deleted the track from storage at this moment. */
    audioDeletedAt: date.optional()
  })
  .refine(
    (body) => body.expiresAt !== undefined || body.audioDeletedAt !== undefined,
    'Nothing to change.'
  );

/** A link as Haven reads it: open, or the record that it was. */
export interface ConsultationForHaven {
  id: string;
  title: string;
  message: string;
  durationMs: number;
  bpm: number | null;
  audio: { path: string; bytes: number; contentType: string };
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  /** Set when it was closed early, from Haven. */
  endedAt: string | null;
  /** Set once Haven deleted the track from storage. */
  audioDeletedAt: string | null;
  /** The page's address while it's open; null once it isn't. */
  link: string | null;
  /**
   * The compact waveform while it's open, for Haven to draw the feedback
   * on, from either copy of it; null once it isn't.
   */
  waveform: string | null;
  /** How much feedback it holds now: none, once it's closed. */
  feedbackCount: number;
}

/** One producer's feedback, as Haven reads it. */
export interface FeedbackForHaven {
  id: string;
  consultationId: string;
  name: string;
  notes: Note[];
  chain: Chain | null;
  submittedAt: string;
}

/** What a link's page is given to draw, and nothing more. */
export interface Room {
  token: string;
  title: string;
  message: string;
  durationMs: number;
  bpm: number | null;
  /** Where the page plays the track from. */
  audioUrl: string;
  /** The compact waveform, as base64. */
  waveform: string;
  expiresAt: string;
}

/** Whether a link is open at `now`. */
export const isOpen = (
  doc: { expiresAt: Date; endedAt: Date | null },
  now: Date
) => doc.endedAt === null && doc.expiresAt.getTime() > now.getTime();
