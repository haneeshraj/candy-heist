import 'server-only';
import { MongoServerError, ObjectId, type Collection } from 'mongodb';
import { LoreMarkdownError, parseLoreMarkdown } from '@/content/lore/markdown';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type LoreMetaDocument,
  type LorePublishedDocument
} from '@/lib/db/collections';
import {
  isChapterId,
  orderSchema,
  publishInputSchema,
  type LoreSnapshot,
  type PublishedChapterForHaven
} from './model';

// What Candy Haven's LORE editor publishes, kept for the lore pages.
//
// Haven writes the lore on the machine it runs on and sends a chapter here
// only when it's published: whole, with a copy of its planet. The site
// keeps nothing unpublished. Two people publish, each from their own copy
// of Haven, so:
//
//   - every published chapter carries a revision that goes up on each
//     publish, and Haven says which one its draft started from; a publish
//     over a newer one is refused with that version, unless the writer
//     says to publish over it;
//   - a published chapter keeps its address, so links to it keep working.
//
// Every write answers with what's published again, so both copies of Haven
// stay in step with whatever the other did in the meantime. Whether the
// site changed is said too: the route then refreshes the lore pages.

export type LoreOutcome =
  | { ok: true; snapshot: LoreSnapshot; siteChanged: boolean }
  | { ok: false; status: 400 | 404 | 409; body: Record<string, unknown> };

const DUPLICATE_KEY = 11000;

const fail = (
  status: 400 | 404 | 409,
  body: Record<string, unknown>
): LoreOutcome => ({ ok: false, status, body });
const invalid = (message: string) => fail(400, { error: 'invalid', message });
const notFound = () => fail(404, { error: 'not_found' });

/** Someone else published first: their version, or null when they took it down. */
const conflict = (current: LorePublishedDocument | null) =>
  fail(409, {
    error: 'conflict',
    current: current ? chapterForHaven(current) : null
  });

/** The first problem zod found, in words Haven can show as they are. */
function firstIssue(error: {
  issues: Array<{ message: string; path: PropertyKey[] }>;
}) {
  const issue = error.issues[0];
  return issue ? issue.message : 'That could not be read.';
}

const isDuplicate = (error: unknown) =>
  error instanceof MongoServerError && error.code === DUPLICATE_KEY;

interface Collections {
  published: Collection<LorePublishedDocument>;
  meta: Collection<LoreMetaDocument>;
}

async function open(): Promise<Collections> {
  const db = await getDb();
  return {
    published: db.collection<LorePublishedDocument>(COLLECTIONS.lorePublished),
    meta: db.collection<LoreMetaDocument>(COLLECTIONS.loreMeta)
  };
}

// ------------------------------------------------------------ the snapshot

function chapterForHaven(doc: LorePublishedDocument): PublishedChapterForHaven {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    line: doc.line,
    body: doc.body,
    planetId: doc.planetId,
    planetName: doc.planetName,
    planet: doc.planet,
    order: doc.order,
    revision: doc.revision,
    publishedAt: doc.publishedAt.toISOString(),
    publishedBy: doc.publishedBy
  };
}

async function snapshotOf(c: Collections): Promise<LoreSnapshot> {
  const [docs, meta] = await Promise.all([
    c.published.find().sort({ order: 1, publishedAt: 1 }).toArray(),
    c.meta.findOne({ _id: 'lore' })
  ]);
  return { live: Boolean(meta?.live), chapters: docs.map(chapterForHaven) };
}

const done = async (
  c: Collections,
  siteChanged: boolean
): Promise<LoreOutcome> => ({
  ok: true,
  snapshot: await snapshotOf(c),
  siteChanged
});

export async function loreSnapshot(): Promise<LoreSnapshot> {
  return snapshotOf(await open());
}

// --------------------------------------------------------------- chapters

/**
 * Puts a chapter on the site as Haven sends it, new or again. Refused when
 * the text isn't one the lore pages can show, or someone else published
 * this chapter since the draft started from it. A new chapter goes last;
 * the first chapter published switches the site from its files to Haven's
 * lore for good.
 */
export async function publishChapter(
  id: string,
  raw: unknown,
  uid: string
): Promise<LoreOutcome> {
  if (!isChapterId(id)) return notFound();
  const parsed = publishInputSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const { baseRevision, force, planet, ...chapter } = parsed.data;

  try {
    if (!parseLoreMarkdown(chapter.body).length)
      return invalid('The chapter has no text to publish yet.');
  } catch (error) {
    if (error instanceof LoreMarkdownError) return invalid(error.message);
    throw error;
  }

  const c = await open();
  const _id = new ObjectId(id);
  const now = new Date();
  const fields = {
    ...chapter,
    planet: planet.spec,
    planetId: planet.id,
    planetName: planet.name,
    publishedAt: now,
    publishedBy: uid
  };

  const current = await c.published.findOne({ _id });
  try {
    if (current) {
      if (!force && current.revision !== baseRevision) return conflict(current);
      if (current.slug !== chapter.slug)
        return invalid(
          'A published chapter keeps its address, so links to it keep working. Unpublish it to change the address.'
        );
      const saved = await c.published.updateOne(
        { _id, revision: current.revision },
        { $set: fields, $inc: { revision: 1 } }
      );
      // Published again, or taken down, between the read and the write.
      if (!saved.matchedCount)
        return conflict(await c.published.findOne({ _id }));
    } else {
      // A draft that started from a published version finds it taken down
      // since: said, rather than quietly put back.
      if (!force && baseRevision > 0) return conflict(null);
      const last = await c.published.find().sort({ order: -1 }).limit(1).next();
      await c.published.insertOne({
        _id,
        ...fields,
        order: (last?.order ?? -1) + 1,
        revision: 1
      });
    }
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    // Two keys are unique: the id (the other writer published this very
    // chapter a moment ago) and the address (another chapter has it).
    const raced = current ? null : await c.published.findOne({ _id });
    if (raced) return conflict(raced);
    return fail(409, {
      error: 'slug_taken',
      message: `Another published chapter already lives at /lore/${chapter.slug}.`
    });
  }

  await c.meta.updateOne(
    { _id: 'lore' },
    { $set: { live: true }, $setOnInsert: { liveSince: now } },
    { upsert: true }
  );
  return done(c, true);
}

/** Takes a chapter off the site. Haven keeps its draft. */
export async function unpublishChapter(id: string): Promise<LoreOutcome> {
  if (!isChapterId(id)) return notFound();
  const c = await open();
  const removed = await c.published.deleteOne({ _id: new ObjectId(id) });
  return done(c, removed.deletedCount > 0);
}

/**
 * Puts the published chapters in the order given. The list must be the
 * published chapters as they are: anything else means one was published or
 * taken down elsewhere since Haven last looked.
 */
export async function publishOrder(raw: unknown): Promise<LoreOutcome> {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const ids = parsed.data.ids.map((id) => id.toLowerCase());
  const c = await open();
  const docs = await c.published.find({}, { projection: { _id: 1 } }).toArray();
  const known = new Set(docs.map((doc) => doc._id.toHexString()));
  if (
    ids.length !== known.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !known.has(id))
  )
    return fail(409, { error: 'out_of_date' });
  if (ids.length)
    await c.published.bulkWrite(
      ids.map((id, order) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { order } }
        }
      }))
    );
  return done(c, ids.length > 0);
}
