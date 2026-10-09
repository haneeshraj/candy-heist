import 'server-only';
import { MongoServerError, type Collection } from 'mongodb';
import { fileServices } from '@/content/services/catalogue';
import { fileHours } from '@/content/services/hours';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS, type ServicesDocument } from '@/lib/db/collections';
import { MarkdownBlocksError } from '@/lib/markdown/blocks';
import { isServicePhotoAddress } from '@/lib/storage/servicePhotos';
import {
  publishedHoursOf,
  publishServicesSchema,
  readServiceItem,
  type ServicesSnapshot
} from './model';

// What Candy Haven's SERVICES publishes: every service on the site, in
// order, and the hours sessions can be booked in, as one document.
//
// Haven keeps its list on the machine it's edited on and sends all of it
// on each publish, so the site never shows half of one edit and half of
// another. Two people publish, each from their own copy of Haven, so the
// list carries a revision that goes up on each publish, and Haven says
// which one it started from: a publish over a newer one is refused with
// that version, unless the writer says to publish over it. Every answer
// hands back what the site offers now, so both copies stay in step.

export type ServicesOutcome<T = ServicesSnapshot> =
  | { ok: true; body: T; siteChanged: boolean }
  | { ok: false; status: 400 | 409; body: Record<string, unknown> };

const fail = (
  status: 400 | 409,
  body: Record<string, unknown>
): ServicesOutcome => ({ ok: false, status, body });
const invalid = (message: string) => fail(400, { error: 'invalid', message });

/** The first problem zod found, in words Haven can show as they are. */
function firstIssue(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? 'That could not be read.';
}

async function services(): Promise<Collection<ServicesDocument>> {
  return (await getDb()).collection<ServicesDocument>(COLLECTIONS.services);
}

const read = async (c: Collection<ServicesDocument>) =>
  c.findOne({ _id: 'services' });

/** What the site offers: Haven's last publish, or its own files before the first. */
function snapshotOf(published: ServicesDocument | null): ServicesSnapshot {
  if (!published)
    return {
      live: false,
      revision: 0,
      publishedAt: null,
      publishedBy: null,
      items: fileServices,
      hours: publishedHoursOf(fileHours)
    };
  return {
    live: true,
    revision: published.revision,
    publishedAt: published.publishedAt.toISOString(),
    publishedBy: published.publishedBy,
    items: published.items,
    hours: published.hours
  };
}

/** Someone else published first: what's on the site now. */
const conflict = (current: ServicesDocument | null) =>
  fail(409, { error: 'conflict', current: snapshotOf(current) });

export async function servicesSnapshot(): Promise<ServicesSnapshot> {
  return snapshotOf(await read(await services()));
}

/**
 * Puts Haven's list and hours on the site, whole. Refused when a service
 * isn't one the pages can show (its write-up, a photo the site doesn't
 * have), or someone else published since Haven's list started from the
 * site. The first publish switches the site from its files to Haven's
 * services for good.
 */
export async function publishServices(
  raw: unknown,
  uid: string
): Promise<ServicesOutcome> {
  const parsed = publishServicesSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const { items, hours, baseRevision, force } = parsed.data;

  for (const item of items) {
    try {
      readServiceItem(item);
    } catch (error) {
      if (error instanceof MarkdownBlocksError) return invalid(error.message);
      throw error;
    }
    if (
      !isServicePhotoAddress(item.photos.card) ||
      !isServicePhotoAddress(item.photos.wide)
    )
      return invalid(
        `The photo for ${item.name} isn’t one the website has. Send it again from Haven.`
      );
  }

  const c = await services();
  const current = await read(c);
  const revision = current?.revision ?? 0;
  if (!force && revision !== baseRevision) return conflict(current);

  const now = new Date();
  const fields = {
    live: true as const,
    items,
    hours,
    publishedAt: now,
    publishedBy: uid
  };
  try {
    if (current) {
      const saved = await c.updateOne(
        { _id: 'services', revision },
        { $set: fields, $inc: { revision: 1 } }
      );
      // Published again elsewhere between the read and the write.
      if (!saved.matchedCount) return conflict(await read(c));
    } else {
      await c.insertOne({
        _id: 'services',
        ...fields,
        liveSince: now,
        revision: 1
      });
    }
  } catch (error) {
    // The other copy of Haven made the first publish a moment ago.
    if (error instanceof MongoServerError && error.code === 11000)
      return conflict(await read(c));
    throw error;
  }
  return { ok: true, body: snapshotOf(await read(c)), siteChanged: true };
}
