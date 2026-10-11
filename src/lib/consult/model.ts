import { z } from 'zod';
import type { Chain, Note } from './engine';

// A consultation: a track Candy shares from Candy Haven for other
// producers to give feedback on, through a link on this site that stays
// open for a week at most. What Haven sends to open one, what it's handed
// back, and the limits both sides keep.
//
// The track lives in this site's Vercel Blob store, in a folder of its
// own. Haven uploads it there with a pass the site gives it for that one
// file (blob.ts), then opens the link with its address; the page plays it
// from there. When the link closes, the site deletes the track, the page's
// way in and every piece of feedback, and only the record that there was
// one stays, for Haven to show as expired.

export const DAY = 24 * 60 * 60 * 1000;

/** The longest a link stays open, from when it's shared. */
export const MAX_DAYS = 7;

export const MAX_TITLE = 120;
export const MAX_MESSAGE = 1000;

/** The largest track a link plays. Haven refuses bigger before uploading. */
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/**
 * What the shared tracks may take in all: the Blob storage Vercel's free
 * Hobby plan includes, 1 GB. Vercel counts it as a month's average; held
 * to here at every moment, so no month can go over it.
 */
export const STORE_LIMIT_BYTES = 1024 * 1024 * 1024;

/** Feedback one visitor can send in an hour. */
export const FEEDBACK_PER_HOUR = 10;

/** The audio formats Haven shares, as it names them. */
export const AUDIO_EXTENSIONS = [
  'wav',
  'mp3',
  'flac',
  'ogg',
  'opus',
  'm4a',
  'aac',
  'webm'
] as const;

/** Every public Blob store's addresses are on a host ending in this. */
export const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

/**
 * The folder this copy of the site keeps its tracks in: the live site its
 * own, every other copy (this machine, a preview) another, so a test never
 * touches, or is cleared away as, a live track. As the covers' buckets are
 * kept apart, but by the deployment rather than a setting.
 */
export const trackFolder = (
  env: Record<string, string | undefined> = process.env
) => (env.VERCEL_ENV === 'production' ? 'consultation/' : 'consultation-dev/');

/** A track's name in this copy's folder, and nothing that could leave it. */
export const isOwnTrackPath = (path: string) =>
  path.startsWith(trackFolder()) &&
  !path.includes('..') &&
  /^[\w./-]+$/.test(path);

/** Whether `url` is the public address of the track at `path`, in a Blob store. */
export function isTrackUrl(url: string, path: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.hostname.endsWith(BLOB_HOST_SUFFIX) &&
    parsed.hostname.length > BLOB_HOST_SUFFIX.length &&
    parsed.search === '' &&
    parsed.pathname === `/${path}`
  );
}

const date = z.iso.datetime({ offset: true });

const contentType = z.string().regex(/^audio\/[\w.+-]+$/);

/** What Haven asks for before it uploads a track: the pass for one file. */
export const UploadRequestSchema = z.object({
  extension: z.enum(AUDIO_EXTENSIONS),
  contentType,
  bytes: z.number().int().positive().max(MAX_AUDIO_BYTES)
});

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
  audio: z
    .object({
      path: z.string().max(300).refine(isOwnTrackPath, 'Not a track of ours.'),
      url: z.url().max(2000),
      bytes: z.number().int().positive().max(MAX_AUDIO_BYTES),
      contentType
    })
    .refine((audio) => isTrackUrl(audio.url, audio.path), {
      message: 'Only this site’s Blob store plays here.',
      path: ['url']
    }),
  /** The compact waveform (engine/peaks.ts), as base64. */
  waveform: z.string().min(1).max(20000)
});
export type OpenConsultation = z.infer<typeof OpenConsultationSchema>;

/** What Haven may change about a link once it's open: when it closes. */
export const ChangeConsultationSchema = z.object({ expiresAt: date });

/** An upload whose link never opened, for the site to delete. */
export const DiscardUploadSchema = z.object({
  pathname: z.string().max(300).refine(isOwnTrackPath, 'Not a track of ours.')
});

/** A link as Haven reads it: open, or the record that it was. */
export interface ConsultationForHaven {
  id: string;
  title: string;
  message: string;
  durationMs: number;
  bpm: number | null;
  /** The track in the Blob store; `url` stops answering once it's deleted. */
  audio: { path: string; url: string; bytes: number; contentType: string };
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  /** Set when it was closed early, from Haven. */
  endedAt: string | null;
  /** Set once the site deleted the track. */
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

/** How full the Blob store is, by the records of the tracks still in it. */
export interface StoreUsage {
  /** Whether this copy of the site has a Blob store to keep tracks in. */
  configured: boolean;
  usedBytes: number;
  limitBytes: number;
}

/** Every consultation, and the room left for another. */
export interface ConsultationList {
  consultations: ConsultationForHaven[];
  storage: StoreUsage;
}

/** The pass for one upload: where it goes, and the token that lets it. */
export interface UploadPass {
  pathname: string;
  token: string;
  validUntil: string;
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
