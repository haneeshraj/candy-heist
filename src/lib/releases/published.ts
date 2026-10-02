import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Release } from '@/content/discography/releases';
import { DatabaseUnavailableError, getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type ReleasePublishedDocument,
  type ReleasesMetaDocument
} from '@/lib/db/collections';
import { isVisible } from './model';
import { toSiteReleases } from './toSite';

// The releases as Candy Haven's RELEASES sent them, read for the pages.
//
// Cached until the next send, not read per visit: the routes that write
// refresh the `releases` tag (revalidate.ts), so a visit after a change
// sees it, and every other visit is served from the cache. Read again each
// hour as well, so a release shows on the day it's out.
//
// Null means the site shows its own releases: Haven hasn't published
// everything yet, or this server has no database (local development
// without .env.local, the tests). A database that's set up but failing
// throws instead, so a refresh that can't reach it keeps the last good
// pages rather than falling back to the placeholders.

export const RELEASES_TAG = 'releases';

export interface PublishedReleases {
  /** The releases visitors see. */
  releases: Release[];
  /** The home page shelf as picked in RELEASES, in order: slugs. */
  shelf: string[];
}

async function read(): Promise<PublishedReleases | null> {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return null;
    throw error;
  }
  const meta = await db
    .collection<ReleasesMetaDocument>(COLLECTIONS.releasesMeta)
    .findOne({ _id: 'releases' });
  if (!meta?.live) return null;

  const docs = await db
    .collection<ReleasePublishedDocument>(COLLECTIONS.releasesPublished)
    .find()
    .sort({ date: -1, title: 1 })
    .toArray();
  const visible = docs.filter((doc) => isVisible(doc));
  const slugById = new Map(
    visible.map((doc) => [doc._id.toHexString(), doc.slug])
  );
  return {
    releases: toSiteReleases(visible),
    shelf: meta.shelf.flatMap((id) => {
      const slug = slugById.get(id.toHexString());
      return slug ? [slug] : [];
    })
  };
}

export const readPublishedReleases = unstable_cache(
  read,
  ['releases-published'],
  { tags: [RELEASES_TAG], revalidate: 3600 }
);
