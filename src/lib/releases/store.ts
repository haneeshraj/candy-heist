import 'server-only';
import { MongoServerError, ObjectId, type Collection } from 'mongodb';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type ReleasePublishedDocument,
  type ReleasesMetaDocument
} from '@/lib/db/collections';
import { uniqueSlug } from '@/lib/text/slug';
import {
  batchSchema,
  isReleaseId,
  isVisible,
  releaseEntrySchema,
  releasePatchSchema,
  releaseSchema,
  shelfSchema,
  spotifyAlbumId,
  titleKey,
  visibilitySchema,
  type BatchResult,
  type PublishedReleaseForHaven,
  type ReleaseFields,
  type ReleasesSnapshot
} from './model';

// What Candy Haven's RELEASES sends, kept for the discography pages.
//
// Haven keeps the whole catalogue in DISCOGRAPHY on the machine it runs on.
// "Publish everything" sends all of it once and switches the site from its
// own releases to Haven's; after that a release goes again whenever it's
// finished being edited, with only the fields that changed. Two copies of
// Haven can send, each with its own ids for the same release, so:
//
//   - the site gives each release its id on its first send, and a release
//     sent from the other copy is recognised by its UPC, then its Spotify
//     album, then its title and kind, rather than added twice;
//   - a change carries only its own fields, so the latest change to each
//     field is what shows;
//   - a release keeps its address once it has one, so links keep working.
//
// Every write answers with what's here again, so both copies stay in step.
// Whether the site changed is said too: the route then refreshes the pages.

export type ReleasesOutcome<T extends ReleasesSnapshot = ReleasesSnapshot> =
  | { ok: true; snapshot: T; siteChanged: boolean }
  | { ok: false; status: 400 | 404 | 409; body: Record<string, unknown> };

const DUPLICATE_KEY = 11000;

const fail = (
  status: 400 | 404 | 409,
  body: Record<string, unknown>
): { ok: false; status: 400 | 404 | 409; body: Record<string, unknown> } => ({
  ok: false,
  status,
  body
});
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

interface Collections {
  releases: Collection<ReleasePublishedDocument>;
  meta: Collection<ReleasesMetaDocument>;
}

async function open(): Promise<Collections> {
  const db = await getDb();
  return {
    releases: db.collection<ReleasePublishedDocument>(
      COLLECTIONS.releasesPublished
    ),
    meta: db.collection<ReleasesMetaDocument>(COLLECTIONS.releasesMeta)
  };
}

// ------------------------------------------------------------ the snapshot

function releaseForHaven(
  doc: ReleasePublishedDocument
): PublishedReleaseForHaven {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    kind: doc.kind,
    status: doc.status,
    date: doc.date,
    upc: doc.upc,
    spotifyId: doc.spotifyId,
    titleKey: doc.titleKey,
    shown: doc.shown,
    visible: isVisible(doc),
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy
  };
}

async function snapshotOf(c: Collections): Promise<ReleasesSnapshot> {
  const [docs, meta] = await Promise.all([
    c.releases.find().sort({ date: -1, title: 1 }).toArray(),
    c.meta.findOne({ _id: 'releases' })
  ]);
  return {
    live: Boolean(meta?.live),
    releases: docs.map(releaseForHaven),
    shelf: (meta?.shelf ?? []).map((id) => id.toHexString())
  };
}

const done = async (
  c: Collections,
  siteChanged: boolean
): Promise<ReleasesOutcome> => ({
  ok: true,
  snapshot: await snapshotOf(c),
  siteChanged
});

export async function releasesSnapshot(): Promise<ReleasesSnapshot> {
  return snapshotOf(await open());
}

// ---------------------------------------------------------------- matching

/**
 * The fields as stored: Haven's, with how the other copy finds them. A
 * subtitle or label it doesn't have is left out (and unset on an update),
 * not stored empty.
 */
function stored(fields: ReleaseFields) {
  const { subtitle, label, ...rest } = fields;
  return {
    ...rest,
    ...(subtitle ? { subtitle } : {}),
    ...(label ? { label } : {}),
    spotifyId: spotifyAlbumId(fields.distribution),
    titleKey: titleKey(fields.title, fields.kind)
  };
}

/** What an update drops: the optional fields the release no longer has. */
const dropped = (fields: ReleaseFields) => ({
  ...(fields.subtitle ? {} : { subtitle: '' as const }),
  ...(fields.label ? {} : { label: '' as const })
});

/** A release already here that this one is: by UPC, Spotify album, then title and kind. */
async function findMatch(c: Collections, fields: ReleaseFields) {
  const spotifyId = spotifyAlbumId(fields.distribution);
  if (fields.upc) {
    const byUpc = await c.releases.findOne({ upc: fields.upc });
    if (byUpc) return byUpc;
  }
  if (spotifyId) {
    const bySpotify = await c.releases.findOne({ spotifyId });
    if (bySpotify) return bySpotify;
  }
  return c.releases.findOne({ titleKey: titleKey(fields.title, fields.kind) });
}

/**
 * Puts a whole release here: over the one it's recognised as, or new, at
 * an address made from its title. Keeps its address, whether it's shown
 * and its place on the shelf.
 */
async function upsert(
  c: Collections,
  fields: ReleaseFields,
  uid: string
): Promise<ObjectId> {
  const now = new Date();
  const match = await findMatch(c, fields);
  if (match) {
    await c.releases.updateOne(
      { _id: match._id },
      {
        $set: { ...stored(fields), updatedAt: now, updatedBy: uid },
        $unset: dropped(fields)
      }
    );
    return match._id;
  }

  // Another send can take the same address between the read and the write:
  // the unique index says so, and the next number is tried.
  for (let attempt = 0; attempt < 5; attempt++) {
    const taken = new Set(
      (await c.releases.find({}, { projection: { slug: 1 } }).toArray()).map(
        (doc) => doc.slug
      )
    );
    const _id = new ObjectId();
    try {
      await c.releases.insertOne({
        _id,
        ...stored(fields),
        slug: uniqueSlug(fields.title, taken, 'release'),
        shown: null,
        createdAt: now,
        updatedAt: now,
        updatedBy: uid
      });
      return _id;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  throw new Error('Could not give the release an address.');
}

// ---------------------------------------------------------------- releases

/**
 * "Publish everything": every release Haven has, sent at once, and the site
 * switched from its own releases to Haven's. Answers with the site's id for
 * each of Haven's, so Haven can send changes to them from then on.
 */
export async function publishEverything(
  raw: unknown,
  uid: string
): Promise<ReleasesOutcome<BatchResult>> {
  const parsed = batchSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));

  const c = await open();
  const ids: Record<string, string> = {};
  for (const { ref, fields } of parsed.data.releases) {
    ids[ref] = (await upsert(c, fields, uid)).toHexString();
  }
  await c.meta.updateOne(
    { _id: 'releases' },
    {
      $set: { live: true },
      $setOnInsert: { liveSince: new Date(), shelf: [] }
    },
    { upsert: true }
  );
  return {
    ok: true,
    snapshot: { ...(await snapshotOf(c)), ids },
    siteChanged: true
  };
}

/**
 * A release sent for the first time from this copy of Haven: new here, or
 * one it recognises. Answers with the site's id for Haven's.
 */
export async function publishRelease(
  raw: unknown,
  uid: string
): Promise<ReleasesOutcome<BatchResult>> {
  const parsed = releaseEntrySchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const { ref, fields } = parsed.data;
  const c = await open();
  const meta = await c.meta.findOne({ _id: 'releases' });
  if (!meta?.live)
    return fail(409, {
      error: 'not_live',
      message:
        'Publish everything first: until then the site shows its own releases.'
    });
  const id = (await upsert(c, fields, uid)).toHexString();
  return {
    ok: true,
    snapshot: { ...(await snapshotOf(c)), ids: { [ref]: id } },
    siteChanged: true
  };
}

/** The fields of a release that changed since this copy of Haven last sent them. */
export async function updateRelease(
  id: string,
  raw: unknown,
  uid: string
): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const parsed = releasePatchSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));

  const c = await open();
  const _id = new ObjectId(id);
  const current = await c.releases.findOne({ _id });
  if (!current) return notFound();

  const merged = releaseSchema.safeParse({
    ...fieldsOf(current),
    ...parsed.data
  });
  if (!merged.success) return invalid(firstIssue(merged.error));

  await c.releases.updateOne(
    { _id },
    {
      $set: { ...stored(merged.data), updatedAt: new Date(), updatedBy: uid },
      $unset: dropped(merged.data)
    }
  );
  return done(c, true);
}

/** Takes a release off the site and off the shelf: it left DISCOGRAPHY. */
export async function removeRelease(id: string): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const c = await open();
  const _id = new ObjectId(id);
  const removed = await c.releases.deleteOne({ _id });
  await c.meta.updateOne({ _id: 'releases' }, { $pull: { shelf: _id } });
  return done(c, removed.deletedCount > 0);
}

/** Shown, hidden, or as its status says. */
export async function setVisibility(
  id: string,
  raw: unknown,
  uid: string
): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const parsed = visibilitySchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const c = await open();
  const saved = await c.releases.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        shown: parsed.data.shown,
        updatedAt: new Date(),
        updatedBy: uid
      }
    }
  );
  if (!saved.matchedCount) return notFound();
  return done(c, true);
}

/** The home page shelf: up to eight releases here, in order. */
export async function setShelf(raw: unknown): Promise<ReleasesOutcome> {
  const parsed = shelfSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const ids = parsed.data.ids.map((id) => new ObjectId(id));
  const c = await open();
  const found = await c.releases.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) return fail(409, { error: 'out_of_date' });
  await c.meta.updateOne(
    { _id: 'releases' },
    { $set: { shelf: ids }, $setOnInsert: { live: false } },
    { upsert: true }
  );
  return done(c, true);
}

/** A stored release's fields, as Haven would send them. */
function fieldsOf(doc: ReleasePublishedDocument): ReleaseFields {
  return {
    title: doc.title,
    subtitle: doc.subtitle,
    kind: doc.kind,
    status: doc.status,
    artist: doc.artist,
    date: doc.date,
    label: doc.label,
    credits: doc.credits,
    tracks: doc.tracks,
    distribution: doc.distribution,
    upc: doc.upc
  };
}
