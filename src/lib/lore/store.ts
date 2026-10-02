import 'server-only';
import { MongoServerError, ObjectId, type Collection, type Db } from 'mongodb';
import { LoreMarkdownError, parseLoreMarkdown } from '@/content/lore/markdown';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type LoreDraftDocument,
  type LoreMetaDocument,
  type LorePlanetDocument,
  type LorePublishedDocument
} from '@/lib/db/collections';
import { isPresetId, presetById, type PlanetSpec } from '@/lib/planets/engine';
import {
  LORE_LIMITS,
  chapterInputSchema,
  orderSchema,
  planetInputSchema,
  publishSchema,
  saveChapterSchema,
  savePlanetSchema,
  slugify,
  type ChapterForHaven,
  type LoreSnapshot,
  type PlanetForHaven
} from './model';

// The lore's reads and writes for Candy Haven's LORE editor. Two people
// write it, each in their own copy of Haven, so:
//
//   - every draft and planet carries a revision that goes up on each save,
//     and a save that started from an older one is refused with the newer
//     version, unless the writer says to overwrite it;
//   - publishing copies a chapter (and its planet) into its own document,
//     so the site never shows a half-saved draft, and a planet edited in
//     the library changes no published chapter until it's published again;
//   - a planet a chapter uses can't be deleted.
//
// Every write answers with the whole lore again, so both Havens stay in
// step with whatever the other did in the meantime. Whether the site
// changed is said too: the route then refreshes the lore pages.

export type LoreOutcome =
  | { ok: true; snapshot: LoreSnapshot; siteChanged: boolean }
  | { ok: false; status: 400 | 404 | 409; body: Record<string, unknown> };

const DUPLICATE_KEY = 11000;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

const fail = (
  status: 400 | 404 | 409,
  body: Record<string, unknown>
): LoreOutcome => ({ ok: false, status, body });
const invalid = (message: string) => fail(400, { error: 'invalid', message });
const notFound = () => fail(404, { error: 'not_found' });

/** The first problem zod found, in words Haven can show as they are. */
function firstIssue(error: {
  issues: Array<{ message: string; path: PropertyKey[] }>;
}) {
  const issue = error.issues[0];
  return issue ? issue.message : 'That could not be read.';
}

const isDuplicate = (error: unknown) =>
  error instanceof MongoServerError && error.code === DUPLICATE_KEY;

function objectId(id: string): ObjectId | null {
  return OBJECT_ID.test(id) ? new ObjectId(id) : null;
}

interface Collections {
  drafts: Collection<LoreDraftDocument>;
  planets: Collection<LorePlanetDocument>;
  published: Collection<LorePublishedDocument>;
  meta: Collection<LoreMetaDocument>;
}

async function open(): Promise<{ db: Db } & Collections> {
  const db = await getDb();
  return {
    db,
    drafts: db.collection<LoreDraftDocument>(COLLECTIONS.loreDrafts),
    planets: db.collection<LorePlanetDocument>(COLLECTIONS.lorePlanets),
    published: db.collection<LorePublishedDocument>(COLLECTIONS.lorePublished),
    meta: db.collection<LoreMetaDocument>(COLLECTIONS.loreMeta)
  };
}

// ------------------------------------------------------------ the snapshot

function chapterForHaven(
  draft: LoreDraftDocument,
  published: LorePublishedDocument | undefined
): ChapterForHaven {
  return {
    id: draft._id.toHexString(),
    slug: draft.slug,
    title: draft.title,
    line: draft.line,
    planetId: draft.planetId,
    body: draft.body,
    order: draft.order,
    revision: draft.revision,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    updatedBy: draft.updatedBy,
    published: published
      ? {
          revision: published.revision,
          planetRevision: published.planetRevision,
          order: published.order,
          publishedAt: published.publishedAt.toISOString(),
          publishedBy: published.publishedBy
        }
      : null
  };
}

function planetForHaven(planet: LorePlanetDocument): PlanetForHaven {
  return {
    id: planet._id.toHexString(),
    name: planet.name,
    spec: planet.spec,
    revision: planet.revision,
    createdAt: planet.createdAt.toISOString(),
    updatedAt: planet.updatedAt.toISOString(),
    updatedBy: planet.updatedBy
  };
}

async function snapshotOf(c: Collections): Promise<LoreSnapshot> {
  const [drafts, planets, published, meta] = await Promise.all([
    c.drafts.find().sort({ order: 1, createdAt: 1 }).toArray(),
    c.planets.find().sort({ name: 1, createdAt: 1 }).toArray(),
    c.published.find().toArray(),
    c.meta.findOne({ _id: 'lore' })
  ]);
  const byId = new Map(published.map((doc) => [doc._id.toHexString(), doc]));
  return {
    live: Boolean(meta?.live),
    chapters: drafts.map((draft) =>
      chapterForHaven(draft, byId.get(draft._id.toHexString()))
    ),
    planets: planets.map(planetForHaven)
  };
}

const done = async (
  c: Collections,
  siteChanged = false
): Promise<LoreOutcome> => ({
  ok: true,
  snapshot: await snapshotOf(c),
  siteChanged
});

export async function loreSnapshot(): Promise<LoreSnapshot> {
  return snapshotOf(await open());
}

// ---------------------------------------------------------------- planets

/** A planet by its id, preset or saved, with what publishing copies. */
async function resolvePlanet(
  c: Collections,
  id: string
): Promise<{ spec: PlanetSpec; revision: number } | null> {
  if (isPresetId(id)) {
    const preset = presetById(id);
    return preset ? { spec: preset.spec, revision: 0 } : null;
  }
  const _id = objectId(id);
  const planet = _id ? await c.planets.findOne({ _id }) : null;
  return planet ? { spec: planet.spec, revision: planet.revision } : null;
}

export async function createPlanet(
  raw: unknown,
  uid: string
): Promise<LoreOutcome> {
  const parsed = planetInputSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const c = await open();
  const now = new Date();
  await c.planets.insertOne({
    _id: new ObjectId(),
    name: parsed.data.name,
    spec: parsed.data.spec,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: uid
  });
  return done(c);
}

export async function savePlanet(
  id: string,
  raw: unknown,
  uid: string
): Promise<LoreOutcome> {
  const _id = objectId(id);
  if (!_id) return notFound();
  const parsed = savePlanetSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const c = await open();
  const planet = await c.planets.findOne({ _id });
  if (!planet) return notFound();
  const { name, spec, baseRevision, force } = parsed.data;
  if (!force && planet.revision !== baseRevision)
    return fail(409, { error: 'conflict', current: planetForHaven(planet) });

  const saved = await c.planets.updateOne(
    { _id, revision: planet.revision },
    {
      $set: { name, spec, updatedAt: new Date(), updatedBy: uid },
      $inc: { revision: 1 }
    }
  );
  if (!saved.matchedCount) {
    const current = await c.planets.findOne({ _id });
    return current
      ? fail(409, { error: 'conflict', current: planetForHaven(current) })
      : notFound();
  }
  return done(c);
}

export async function deletePlanet(id: string): Promise<LoreOutcome> {
  const _id = objectId(id);
  if (!_id) return notFound();
  const c = await open();
  const users = await c.drafts
    .find({ planetId: id }, { projection: { title: 1 } })
    .toArray();
  if (users.length)
    return fail(409, {
      error: 'in_use',
      chapters: users.map((draft) => draft.title)
    });
  await c.planets.deleteOne({ _id });
  return done(c);
}

// --------------------------------------------------------------- chapters

export async function createChapter(
  raw: unknown,
  uid: string
): Promise<LoreOutcome> {
  const parsed = chapterInputSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const input = parsed.data;
  const c = await open();
  if (!(await resolvePlanet(c, input.planetId)))
    return invalid('That planet is not in the library any more.');

  const last = await c.drafts.find().sort({ order: -1 }).limit(1).next();
  const order = (last?.order ?? -1) + 1;
  const base = input.slug ?? slugify(input.title);
  const now = new Date();

  // A slug made from the title takes a number when the title's taken; one
  // the writer chose is theirs to change.
  for (let n = 1; n <= 50; n++) {
    const slug = n === 1 ? base : `${base.slice(0, LORE_LIMITS.slug - 4)}-${n}`;
    try {
      await c.drafts.insertOne({
        _id: new ObjectId(),
        slug,
        title: input.title,
        line: input.line,
        planetId: input.planetId,
        body: input.body,
        order,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        updatedBy: uid
      });
      return done(c);
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      if (input.slug)
        return fail(409, {
          error: 'slug_taken',
          message: `Another chapter already lives at /lore/${slug}.`
        });
    }
  }
  return fail(409, {
    error: 'slug_taken',
    message: 'Pick a different title or address.'
  });
}

export async function saveChapter(
  id: string,
  raw: unknown,
  uid: string
): Promise<LoreOutcome> {
  const _id = objectId(id);
  if (!_id) return notFound();
  const parsed = saveChapterSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const { baseRevision, force, ...input } = parsed.data;

  const c = await open();
  const [draft, published] = await Promise.all([
    c.drafts.findOne({ _id }),
    c.published.findOne({ _id })
  ]);
  if (!draft) return notFound();
  if (!force && draft.revision !== baseRevision)
    return fail(409, {
      error: 'conflict',
      current: chapterForHaven(draft, published ?? undefined)
    });

  const slug = input.slug ?? draft.slug;
  if (slug !== draft.slug && published)
    return invalid(
      'A published chapter keeps its address, so links to it keep working. Unpublish it to change the address.'
    );
  if (!(await resolvePlanet(c, input.planetId)))
    return invalid('That planet is not in the library any more.');

  try {
    const saved = await c.drafts.updateOne(
      { _id, revision: draft.revision },
      {
        $set: {
          slug,
          title: input.title,
          line: input.line,
          planetId: input.planetId,
          body: input.body,
          updatedAt: new Date(),
          updatedBy: uid
        },
        $inc: { revision: 1 }
      }
    );
    if (!saved.matchedCount) {
      const current = await c.drafts.findOne({ _id });
      return current
        ? fail(409, {
            error: 'conflict',
            current: chapterForHaven(current, published ?? undefined)
          })
        : notFound();
    }
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    return fail(409, {
      error: 'slug_taken',
      message: `Another chapter already lives at /lore/${slug}.`
    });
  }
  return done(c);
}

/** Deletes a chapter everywhere: its draft, and the site's copy if it has one. */
export async function deleteChapter(id: string): Promise<LoreOutcome> {
  const _id = objectId(id);
  if (!_id) return notFound();
  const c = await open();
  const [, published] = await Promise.all([
    c.drafts.deleteOne({ _id }),
    c.published.deleteOne({ _id })
  ]);
  return done(c, published.deletedCount > 0);
}

/**
 * Puts a chapter on the site as its draft stands. Refused when the text
 * isn't one the lore pages can show, or isn't the version the writer saw.
 * The first chapter published switches the site from its files to Haven's
 * lore for good.
 */
export async function publishChapter(
  id: string,
  raw: unknown,
  uid: string
): Promise<LoreOutcome> {
  const _id = objectId(id);
  if (!_id) return notFound();
  const parsed = publishSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));

  const c = await open();
  const draft = await c.drafts.findOne({ _id });
  if (!draft) return notFound();
  if (draft.revision !== parsed.data.revision) {
    const published = await c.published.findOne({ _id });
    return fail(409, {
      error: 'conflict',
      current: chapterForHaven(draft, published ?? undefined)
    });
  }

  if (!draft.line.trim())
    return invalid('Give the chapter its one line before publishing it.');
  try {
    if (!parseLoreMarkdown(draft.body).length)
      return invalid('The chapter has no text to publish yet.');
  } catch (error) {
    if (error instanceof LoreMarkdownError) return invalid(error.message);
    throw error;
  }
  const planet = await resolvePlanet(c, draft.planetId);
  if (!planet)
    return invalid('Its planet is not in the library any more. Pick another.');

  const now = new Date();
  try {
    // Keyed by the draft's id: the filter carries it into a new document.
    await c.published.replaceOne(
      { _id },
      {
        slug: draft.slug,
        title: draft.title,
        line: draft.line,
        body: draft.body,
        planet: planet.spec,
        planetId: draft.planetId,
        planetRevision: planet.revision,
        order: draft.order,
        revision: draft.revision,
        publishedAt: now,
        publishedBy: uid
      },
      { upsert: true }
    );
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    return fail(409, {
      error: 'slug_taken',
      message: `Another published chapter already lives at /lore/${draft.slug}.`
    });
  }
  await c.meta.updateOne(
    { _id: 'lore' },
    { $set: { live: true }, $setOnInsert: { liveSince: now } },
    { upsert: true }
  );
  return done(c, true);
}

/** Takes a chapter off the site. Its draft stays. */
export async function unpublishChapter(id: string): Promise<LoreOutcome> {
  const _id = objectId(id);
  if (!_id) return notFound();
  const c = await open();
  const removed = await c.published.deleteOne({ _id });
  return done(c, removed.deletedCount > 0);
}

/** Sets the drafts' order. Changes nothing on the site until the order is published. */
export async function reorderChapters(raw: unknown): Promise<LoreOutcome> {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const { ids } = parsed.data;
  const c = await open();
  const drafts = await c.drafts.find({}, { projection: { _id: 1 } }).toArray();
  const known = new Set(drafts.map((draft) => draft._id.toHexString()));
  // The list must be the chapters as they are: anything else means one was
  // added or deleted elsewhere since Haven last looked.
  if (
    ids.length !== known.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !known.has(id))
  )
    return fail(409, { error: 'out_of_date' });
  if (ids.length)
    await c.drafts.bulkWrite(
      ids.map((id, order) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { order } }
        }
      }))
    );
  return done(c);
}

/** Puts the published chapters in the drafts' order. */
export async function publishOrder(): Promise<LoreOutcome> {
  const c = await open();
  const [drafts, published] = await Promise.all([
    c.drafts.find({}, { projection: { _id: 1, order: 1 } }).toArray(),
    c.published.find({}, { projection: { _id: 1 } }).toArray()
  ]);
  const order = new Map(
    drafts.map((draft) => [draft._id.toHexString(), draft.order])
  );
  const writes = published
    .filter((doc) => order.has(doc._id.toHexString()))
    .map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { order: order.get(doc._id.toHexString()) as number } }
      }
    }));
  if (writes.length) await c.published.bulkWrite(writes);
  return done(c, writes.length > 0);
}
