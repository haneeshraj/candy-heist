import type { Db, ObjectId } from 'mongodb';
import type { ContactMessage } from '@/lib/contact/message';
import type { DjEnquiry } from '@/lib/enquiry/enquiry';
import type { PlanetSpec } from '@/lib/planets/engine';

// The collections the site writes, and what each document holds.
//
// The site keeps what the visitor typed: written once, as sent, and never
// edited. Where each one stands, and any notes, are Candy Haven's, kept on
// the machine it runs on and never written here.

export const COLLECTIONS = {
  messages: 'contact_messages',
  enquiries: 'dj_enquiries',
  /** What Candy Haven deleted, so a second copy of Haven drops it too. */
  deletions: 'deletions',
  /** Recent sends per visitor, for the hourly limit. */
  rateLimits: 'rate_limits',
  /**
   * What the lore pages show: each chapter as Candy Haven last published
   * it. Drafts and the planet library stay in Haven, on its own machine.
   */
  lorePublished: 'lore_published',
  /** Whether Haven's lore has replaced the files: one document, `lore`. */
  loreMeta: 'lore_meta'
} as const;

interface Filed {
  _id: ObjectId;
  /** A short code for people: MSG-7KQ2FD, DJ-H3XN8P. */
  ref: string;
  createdAt: Date;
}

export type MessageDocument = Filed & ContactMessage;

export type EnquiryDocument = Filed & DjEnquiry;

export type DeletedKind = 'message' | 'enquiry';

export interface DeletionDocument {
  kind: DeletedKind;
  /** The deleted document's id. Nothing the visitor wrote is kept. */
  id: string;
  deletedAt: Date;
  expireAt: Date;
}

/** Who last wrote something: a Firebase account id from Candy Haven. */
type Uid = string;

/**
 * A chapter as published, keyed by the id Haven gave it. Self-contained: the
 * planet is copied in, so changing it in Haven changes nothing on the site
 * until the chapter is published again.
 */
export interface LorePublishedDocument {
  _id: ObjectId;
  slug: string;
  title: string;
  line: string;
  /** The text, in the lore's markdown. */
  body: string;
  planet: PlanetSpec;
  /** The planet's id in Haven (`preset:<look>` or one of its library's). */
  planetId: string;
  planetName: string;
  order: number;
  /** Goes up by one on every publish, so two writers notice each other. */
  revision: number;
  publishedAt: Date;
  publishedBy: Uid;
}

export interface LoreMetaDocument {
  _id: 'lore';
  /** Set by the first publish, never unset: from then on, only Haven's lore shows. */
  live: true;
  liveSince: Date;
}

export interface RateLimitDocument {
  /** A hash of the visitor's address and what they used it for. */
  key: string;
  at: Date;
  expireAt: Date;
}

/**
 * How long a deletion is remembered. A copy of Haven away for longer than
 * this keeps what was deleted elsewhere, which is a fair price for not
 * keeping a list forever.
 */
export const DELETION_MEMORY_DAYS = 365;

let indexed: Promise<void> | null = null;

/**
 * The indexes the queries rely on. Creating one that exists does nothing,
 * so this runs once per server start rather than being tracked anywhere.
 */
export function ensureIndexes(db: Db): Promise<void> {
  indexed ??= Promise.all([
    db
      .collection(COLLECTIONS.messages)
      .createIndex({ ref: 1 }, { unique: true }),
    db.collection(COLLECTIONS.messages).createIndex({ createdAt: 1 }),
    db
      .collection(COLLECTIONS.enquiries)
      .createIndex({ ref: 1 }, { unique: true }),
    db.collection(COLLECTIONS.enquiries).createIndex({ createdAt: 1 }),
    db.collection(COLLECTIONS.deletions).createIndex({ deletedAt: 1 }),
    db
      .collection(COLLECTIONS.deletions)
      .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection(COLLECTIONS.rateLimits).createIndex({ key: 1, at: 1 }),
    db
      .collection(COLLECTIONS.rateLimits)
      .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection(COLLECTIONS.lorePublished)
      .createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLLECTIONS.lorePublished).createIndex({ order: 1 })
  ]).then(() => undefined);
  indexed.catch(() => {
    indexed = null;
  });
  return indexed;
}
