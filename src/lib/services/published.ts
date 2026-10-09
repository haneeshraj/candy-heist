import 'server-only';
import { unstable_cache } from 'next/cache';
import { DatabaseUnavailableError, getDb } from '@/lib/db/client';
import { COLLECTIONS, type ServicesDocument } from '@/lib/db/collections';
import type { PublishedHours, ServiceItemInput } from './model';

// The services and hours as published from Candy Haven, read for the pages
// and the booking.
//
// Cached until the next publish, not read per visit: the route that
// publishes refreshes the `services` tag (revalidate.ts), so a visit after
// a publish sees it, and every other visit is served from the cache.
//
// Null means the site uses its own files: Haven hasn't published yet, or
// this server has no database (local development without .env.local, the
// tests). A database that's set up but failing throws instead, so a
// refresh that can't reach it keeps the last good pages rather than
// falling back to the old files.

export const SERVICES_TAG = 'services';

export interface PublishedServices {
  items: ServiceItemInput[];
  hours: PublishedHours;
}

async function read(): Promise<PublishedServices | null> {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return null;
    throw error;
  }
  const published = await db
    .collection<ServicesDocument>(COLLECTIONS.services)
    .findOne({ _id: 'services' });
  if (!published?.live) return null;
  return { items: published.items, hours: published.hours };
}

export const readPublishedServices = unstable_cache(
  read,
  ['services-published'],
  { tags: [SERVICES_TAG] }
);
