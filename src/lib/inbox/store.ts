import 'server-only';
import { MongoServerError, ObjectId, type Collection } from 'mongodb';
import type { ContactMessage } from '@/lib/contact/message';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  DELETION_MEMORY_DAYS,
  type DeletedKind,
  type DeletionDocument,
  type EnquiryDocument,
  type MessageDocument
} from '@/lib/db/collections';
import type { DjEnquiry } from '@/lib/enquiry/enquiry';
import {
  enquiryDocument,
  enquiryForHaven,
  messageDocument,
  messageForHaven,
  type EnquiryForHaven,
  type MessageForHaven
} from './documents';
import { newRef, type RefPrefix } from './ref';

// The site's reads and writes of messages and enquiries. The forms file
// them; everything else here is for Candy Haven, through its API.

const DAY = 24 * 60 * 60 * 1000;

/** How many of each a single check-in hands over before asking for the rest. */
export const PAGE_SIZE = 200;

const DUPLICATE_KEY = 11000;

/** Files a document under a fresh ref, drawing again on the rare repeat. */
async function fileWithRef<T extends { ref: string }>(
  collection: Collection<T>,
  prefix: RefPrefix,
  build: (ref: string) => T
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const ref = newRef(prefix);
    try {
      // The driver's insert type wants an _id it adds itself.
      await collection.insertOne(
        build(ref) as Parameters<Collection<T>['insertOne']>[0]
      );
      return ref;
    } catch (error) {
      const repeat =
        error instanceof MongoServerError && error.code === DUPLICATE_KEY;
      if (!repeat || attempt >= 4) throw error;
    }
  }
}

export async function fileMessage(message: ContactMessage): Promise<string> {
  const db = await getDb();
  const now = new Date();
  return fileWithRef(
    db.collection<Omit<MessageDocument, '_id'>>(COLLECTIONS.messages),
    'MSG',
    (ref) => messageDocument(message, ref, now)
  );
}

export async function fileEnquiry(enquiry: DjEnquiry): Promise<string> {
  const db = await getDb();
  const now = new Date();
  return fileWithRef(
    db.collection<Omit<EnquiryDocument, '_id'>>(COLLECTIONS.enquiries),
    'DJ',
    (ref) => enquiryDocument(enquiry, ref, now)
  );
}

export interface Changes {
  messages: MessageForHaven[];
  enquiries: EnquiryForHaven[];
  deletions: Array<{ kind: DeletedKind; id: string; deletedAt: string }>;
  /** Pass back as `since` next time. */
  cursor: string;
  /** More changed than one page holds: ask again with the cursor. */
  more: boolean;
}

/**
 * Everything filed or deleted at or after `since`, oldest first. Nothing
 * filed is ever edited, so what was sent and what was deleted is all there
 * is to hand over.
 *
 * At or after, not after: two writes can share a millisecond, and one that
 * lands just behind the cursor would otherwise never be seen. Haven files
 * by id, so seeing one twice changes nothing.
 */
export async function changesSince(since: Date): Promise<Changes> {
  const db = await getDb();
  const changed = { createdAt: { $gte: since } };
  const [messages, enquiries, deletions] = await Promise.all([
    db
      .collection<MessageDocument>(COLLECTIONS.messages)
      .find(changed)
      .sort({ createdAt: 1 })
      .limit(PAGE_SIZE)
      .toArray(),
    db
      .collection<EnquiryDocument>(COLLECTIONS.enquiries)
      .find(changed)
      .sort({ createdAt: 1 })
      .limit(PAGE_SIZE)
      .toArray(),
    db
      .collection<DeletionDocument>(COLLECTIONS.deletions)
      .find({ deletedAt: { $gte: since } })
      .sort({ deletedAt: 1 })
      .limit(PAGE_SIZE)
      .toArray()
  ]);

  const more = [messages, enquiries, deletions].some(
    (page) => page.length === PAGE_SIZE
  );
  // A full page ends somewhere inside the changes: the cursor stops at the
  // earliest page end, so nothing past it is skipped on the next ask.
  const ends = [
    ...[messages, enquiries]
      .filter((page) => page.length === PAGE_SIZE)
      .map((page) => page[page.length - 1].createdAt),
    ...(deletions.length === PAGE_SIZE
      ? [deletions[deletions.length - 1].deletedAt]
      : [])
  ];
  const latest = [
    ...messages.map((doc) => doc.createdAt),
    ...enquiries.map((doc) => doc.createdAt),
    ...deletions.map((doc) => doc.deletedAt)
  ];
  const cursor = more
    ? new Date(Math.min(...ends.map((date) => date.getTime())))
    : latest.length
      ? new Date(Math.max(...latest.map((date) => date.getTime())))
      : since;

  return {
    messages: messages.map(messageForHaven),
    enquiries: enquiries.map(enquiryForHaven),
    deletions: deletions.map((doc) => ({
      kind: doc.kind,
      id: doc.id,
      deletedAt: doc.deletedAt.toISOString()
    })),
    cursor: cursor.toISOString(),
    more
  };
}

const KIND_COLLECTION = {
  message: COLLECTIONS.messages,
  enquiry: COLLECTIONS.enquiries
} as const;

/** An id as Haven sends it, or null when it couldn't be one of ours. */
export function parseId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id)
    ? new ObjectId(id)
    : null;
}

/**
 * Deletes one for good, and remembers that it was deleted (its id, never
 * its contents) so another copy of Haven drops its own copy too.
 * Deleting what's already gone is not an error: the other Haven may have
 * got there first.
 */
export async function deleteFiled(
  kind: DeletedKind,
  id: ObjectId
): Promise<void> {
  const db = await getDb();
  const now = new Date();
  await db.collection(KIND_COLLECTION[kind]).deleteOne({ _id: id });
  await db.collection<DeletionDocument>(COLLECTIONS.deletions).insertOne({
    kind,
    id: id.toHexString(),
    deletedAt: now,
    expireAt: new Date(now.getTime() + DELETION_MEMORY_DAYS * DAY)
  });
}
