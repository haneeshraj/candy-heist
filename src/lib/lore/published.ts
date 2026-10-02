import 'server-only';
import { unstable_cache } from 'next/cache';
import { DatabaseUnavailableError, getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type LoreMetaDocument,
  type LorePublishedDocument
} from '@/lib/db/collections';
import type { PlanetSpec } from '@/lib/planets/engine';

// The lore as published from Candy Haven, read for the pages.
//
// Cached until the next publish, not read per visit: the routes that
// publish refresh the `lore` tag (revalidate.ts), so a visit after a
// publish sees it, and every other visit is served from the cache.
//
// Null means the site shows its own files: Haven hasn't published yet, or
// this server has no database (local development without .env.local, the
// tests). A database that's set up but failing throws instead, so a
// refresh that can't reach it keeps the last good pages rather than
// falling back to the old files.

export const LORE_TAG = 'lore';

export interface PublishedChapter {
  slug: string;
  title: string;
  line: string;
  body: string;
  planet: PlanetSpec;
}

export interface PublishedLore {
  chapters: PublishedChapter[];
}

async function read(): Promise<PublishedLore | null> {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return null;
    throw error;
  }
  const meta = await db
    .collection<LoreMetaDocument>(COLLECTIONS.loreMeta)
    .findOne({ _id: 'lore' });
  if (!meta?.live) return null;

  const docs = await db
    .collection<LorePublishedDocument>(COLLECTIONS.lorePublished)
    .find()
    .sort({ order: 1, publishedAt: 1 })
    .toArray();
  return {
    chapters: docs.map(({ slug, title, line, body, planet }) => ({
      slug,
      title,
      line,
      body,
      planet
    }))
  };
}

export const readPublishedLore = unstable_cache(read, ['lore-published'], {
  tags: [LORE_TAG]
});
