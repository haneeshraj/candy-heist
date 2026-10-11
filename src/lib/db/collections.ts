import type { Db, ObjectId } from 'mongodb';
import type { BookingDetails, FlowKind } from '@/lib/booking/bookingState';
import type { Chain, Note } from '@/lib/consult/engine';
import type { ContactMessage } from '@/lib/contact/message';
import type { DjEnquiry } from '@/lib/enquiry/enquiry';
import type { PlanetSpec } from '@/lib/planets/engine';
import type {
  HavenKind,
  ReleaseFields,
  ReleaseStatus
} from '@/lib/releases/model';
import type { PublishedHours, ServiceItemInput } from '@/lib/services/model';

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
  loreMeta: 'lore_meta',
  /**
   * What the discography shows: each release as Candy Haven's RELEASES last
   * sent it, shown or not. The rest of DISCOGRAPHY stays in Haven.
   */
  releasesPublished: 'releases_published',
  /** Whether Haven's releases have replaced the site's own, and the shelf: one document, `releases`. */
  releasesMeta: 'releases_meta',
  /**
   * What "Book me as a music producer" offers, and when sessions can be
   * booked, as Candy Haven last published them: one document, `services`.
   */
  services: 'services_published',
  /**
   * "Book me as a music producer": each booking, its payment and what was
   * done once it was paid (the calendar event, the emails). Unlike the
   * inbox, these change as they go: held, paid, followed up.
   */
  bookings: 'bookings',
  /** The other half of each commission, paid on /services/pay. */
  invoices: 'invoices',
  /** Candy's Google sign-in, sealed: one document, `candy`. */
  googleAccount: 'google_account',
  /**
   * Each track Candy shared from Haven for feedback, kept after its link
   * closes as the record that it was: its title and dates, never the
   * feedback, which goes with the link.
   */
  consultations: 'consultations',
  /**
   * How a consultation's page is reached, while it's open: its link's
   * token, where the track plays from and its waveform. Deleted when the
   * link closes (TTL on expireAt).
   */
  consultationAccess: 'consultation_access',
  /** What producers sent on a consultation's page, until the link closes (TTL). */
  consultationFeedback: 'consultation_feedback'
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

/**
 * A release as sent from Candy Haven, keyed by the id the site gave it on
 * its first send: each copy of Haven has its own ids for the same release,
 * and recognises it here by the UPC, the Spotify album or the title.
 */
export interface ReleasePublishedDocument extends Omit<
  ReleaseFields,
  'subtitle' | 'label'
> {
  _id: ObjectId;
  /** Its page's address, made from the title on its first send, and kept. */
  slug: string;
  subtitle?: string;
  label?: string;
  kind: HavenKind;
  status: ReleaseStatus;
  /** How the other copy of Haven finds it (see model.ts). */
  spotifyId: string;
  titleKey: string;
  /** False when hidden by hand in RELEASES; true or null leave it to its status and date. */
  shown: boolean | null;
  /** Its cover art in storage; left out, it shows the placeholder. */
  cover?: ReleaseCoverDocument;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: Uid;
}

/** A release's cover, as the site made it from the image Haven sent (lib/storage/covers.ts). */
export interface ReleaseCoverDocument {
  /** Where it is in the bucket: <release id>/<hash>.webp. */
  path: string;
  /** Its public address, which the pages load. */
  url: string;
  width: number;
  height: number;
  bytes: number;
  updatedAt: Date;
  /** The shelf's tape, made from this cover; missing if it couldn't be made. */
  tape?: { path: string; url: string; bytes: number };
}

export interface ReleasesMetaDocument {
  _id: 'releases';
  /** Set by "Publish everything", never unset: from then on, only Haven's releases show. */
  live: boolean;
  liveSince?: Date;
  /** The home page shelf, in order. */
  shelf: ObjectId[];
}

/**
 * The services and the hours, whole, as Haven last published them. Haven
 * keeps its drafts on the machine they're written on and sends the full
 * list each time, so this is always one list that was meant together.
 */
export interface ServicesDocument {
  _id: 'services';
  /** Set by the first publish, never unset: from then on, only Haven's services show. */
  live: true;
  liveSince: Date;
  /** Goes up by one on every publish, so two copies of Haven notice each other. */
  revision: number;
  /** In their order on the site. */
  items: ServiceItemInput[];
  hours: PublishedHours;
  publishedAt: Date;
  publishedBy: Uid;
}

/**
 * Awaiting payment while the card is being taken; paid for good; a paid
 * session Candy cancelled from Haven, its time open again.
 */
export type BookingStatus = 'awaiting-payment' | 'paid' | 'cancelled';

/** A session moved to another time from Haven. */
export interface BookingMove {
  from: Date;
  to: Date;
  at: Date;
  by: Uid;
}

/** Amounts in cents. */
export interface BookingAmounts {
  totalCents: number;
  /** Paid at booking: a session's whole price, half a commission's. */
  nowCents: number;
  /** A commission's other half, invoiced; 0 for a session. */
  laterCents: number;
  currency: 'cad';
}

/** What was done once it was paid, each recorded so it's done only once. */
export interface BookingEffects {
  calendarEventId?: string;
  meetLink?: string | null;
  invoiceRef?: string;
  clientEmailAt?: Date;
  candyEmailAt?: Date;
}

export interface BookingDocument {
  _id: ObjectId;
  /** The reference people see: CH-7KQ2FD. */
  ref: string;
  kind: FlowKind;
  itemId: string;
  itemName: string;
  /** A session's time; a commission has none. */
  start?: Date;
  end?: Date;
  /** Where the visitor booked from, so their email reads in their time. */
  visitorTimeZone: string;
  details: BookingDetails;
  amounts: BookingAmounts;
  status: BookingStatus;
  paymentIntentId: string;
  /** A session's time is held for whoever is paying, until then. */
  holdUntil?: Date;
  createdAt: Date;
  paidAt?: Date;
  /**
   * Whenever anything Haven shows changes (paid, followed up, moved,
   * cancelled, its invoice paid): how Haven finds what's new since it
   * last looked.
   */
  updatedAt: Date;
  /** Set until it's paid: an abandoned booking is deleted after it. */
  expireAt?: Date;
  /** Whoever is following it up holds this, so two never do it at once. */
  lease?: Date;
  effects: BookingEffects;
  /** Each time it was moved from Haven, oldest first. */
  moves?: BookingMove[];
  cancelledAt?: Date;
  cancelledBy?: Uid;
  /** What Candy told the client on cancelling it, if anything. */
  cancelNote?: string;
}

export interface InvoiceDocument {
  _id: ObjectId;
  /** The invoice ID people type in: the booking's reference, then -2. */
  ref: string;
  bookingRef: string;
  itemName: string;
  name: string;
  email: string;
  totalCents: number;
  /** Paid upfront, at booking. */
  paidCents: number;
  /** What this invoice is for. */
  dueCents: number;
  currency: 'cad';
  status: 'open' | 'paid';
  paymentIntentId?: string;
  createdAt: Date;
  paidAt?: Date;
  updatedAt: Date;
  lease?: Date;
  effects: { clientEmailAt?: Date; candyEmailAt?: Date };
}

export interface GoogleAccountDocument {
  _id: 'candy';
  email: string;
  /** Sealed with GOOGLE_TOKEN_KEY (lib/google/tokens.ts). */
  refreshToken: string;
  scope: string;
  connectedAt: Date;
}

export interface ConsultationDocument {
  _id: ObjectId;
  title: string;
  /** What Candy asked the producers, shown on the page. */
  message: string;
  durationMs: number;
  bpm: number | null;
  /** Where the track is in storage, for Haven to delete it and count it. */
  audio: { path: string; bytes: number; contentType: string };
  createdAt: Date;
  createdBy: Uid;
  /** When the link closes: moved from Haven, never past a week from createdAt. */
  expiresAt: Date;
  /** Set when Haven closed it early. */
  endedAt: Date | null;
  /** Set once Haven deleted the track from storage. */
  audioDeletedAt: Date | null;
}

/** Shares the consultation's _id: one each, while the link is open. */
export interface ConsultationAccessDocument {
  _id: ObjectId;
  /** The link's secret: 32 random bytes, base64url. */
  token: string;
  /** Where the page plays the track from (a Firebase download address). */
  audioUrl: string;
  waveform: string;
  /** The link's close, which deletes this. */
  expireAt: Date;
}

export interface ConsultationFeedbackDocument {
  _id: ObjectId;
  consultationId: ObjectId;
  name: string;
  notes: Note[];
  chain: Chain | null;
  submittedAt: Date;
  /** The link's close, which deletes this. */
  expireAt: Date;
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
    db.collection(COLLECTIONS.lorePublished).createIndex({ order: 1 }),
    db
      .collection(COLLECTIONS.releasesPublished)
      .createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLLECTIONS.releasesPublished).createIndex({ upc: 1 }),
    db.collection(COLLECTIONS.releasesPublished).createIndex({ spotifyId: 1 }),
    db.collection(COLLECTIONS.releasesPublished).createIndex({ titleKey: 1 }),
    db
      .collection(COLLECTIONS.bookings)
      .createIndex({ ref: 1 }, { unique: true }),
    db.collection(COLLECTIONS.bookings).createIndex({ paymentIntentId: 1 }),
    db
      .collection(COLLECTIONS.bookings)
      .createIndex({ kind: 1, status: 1, start: 1 }),
    db
      .collection(COLLECTIONS.bookings)
      .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection(COLLECTIONS.bookings)
      .createIndex({ status: 1, updatedAt: 1 }),
    db
      .collection(COLLECTIONS.invoices)
      .createIndex({ ref: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.invoices)
      .createIndex({ bookingRef: 1 }, { unique: true }),
    db.collection(COLLECTIONS.consultations).createIndex({ createdAt: -1 }),
    db
      .collection(COLLECTIONS.consultationAccess)
      .createIndex({ token: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.consultationAccess)
      .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection(COLLECTIONS.consultationFeedback)
      .createIndex({ consultationId: 1, submittedAt: 1 }),
    db
      .collection(COLLECTIONS.consultationFeedback)
      .createIndex({ submittedAt: 1 }),
    db
      .collection(COLLECTIONS.consultationFeedback)
      .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
  ]).then(() => undefined);
  indexed.catch(() => {
    indexed = null;
  });
  return indexed;
}
