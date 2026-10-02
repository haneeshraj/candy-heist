import 'server-only';
import {
  MongoServerError,
  ObjectId,
  type AnyBulkWriteOperation,
  type Collection
} from 'mongodb';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type ReleaseCoverDocument,
  type ReleasePublishedDocument,
  type ReleasesMetaDocument
} from '@/lib/db/collections';
import {
  encodeCover,
  InvalidCoverError,
  removeCover,
  uploadCover,
  uploadTape,
  type EncodedCover
} from '@/lib/storage/covers';
import { tapeFromCover } from '@/lib/shelf/tapeFromCover';
import { uniqueSlug } from '@/lib/text/slug';
import {
  batchSchema,
  changesSchema,
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
// Several changes can go in one request too, checked together before any
// is written, so they land together or not at all.
//
// A cover comes on its own, as an image: it's kept in storage
// (lib/storage/covers.ts), and only where it is is written here.
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
const notLive = () =>
  fail(409, {
    error: 'not_live',
    message:
      'Publish everything first: until then the site shows its own releases.'
  });
const hiddenOnShelf = () =>
  fail(409, {
    error: 'hidden',
    message: 'A hidden release can’t go on the shelf.'
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
    cover: doc.cover?.url ?? null,
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy
  };
}

async function snapshotOf(c: Collections): Promise<ReleasesSnapshot> {
  const [docs, meta] = await Promise.all([
    c.releases.find().sort({ date: -1, title: 1 }).toArray(),
    c.meta.findOne({ _id: 'releases' })
  ]);
  // The shelf holds only what visitors see; one hidden before hiding took
  // releases off it is left out here too.
  const seen = new Set(
    docs.filter((doc) => isVisible(doc)).map((doc) => doc._id.toHexString())
  );
  return {
    live: Boolean(meta?.live),
    releases: docs.map(releaseForHaven),
    shelf: (meta?.shelf ?? [])
      .map((id) => id.toHexString())
      .filter((id) => seen.has(id))
  };
}

/** A release visitors no longer see comes off the shelf. */
async function offShelfIfHidden(
  c: Collections,
  _id: ObjectId,
  release: Parameters<typeof isVisible>[0]
) {
  if (isVisible(release)) return;
  await c.meta.updateOne({ _id: 'releases' }, { $pull: { shelf: _id } });
}

/** Of these releases, any visitors no longer see comes off the shelf. */
async function offShelfWhereHidden(c: Collections, ids: ObjectId[]) {
  if (!ids.length) return;
  const hidden = (
    await c.releases
      .find(
        { _id: { $in: ids } },
        { projection: { shown: 1, status: 1, date: 1 } }
      )
      .toArray()
  )
    .filter((doc) => !isVisible(doc))
    .map((doc) => doc._id);
  if (!hidden.length) return;
  await c.meta.updateOne({ _id: 'releases' }, { $pullAll: { shelf: hidden } });
}

const done = async (
  c: Collections,
  siteChanged: boolean
): Promise<ReleasesOutcome> => ({
  ok: true,
  snapshot: await snapshotOf(c),
  siteChanged
});

/** Like done, with the site's id for each release Haven sent for the first time. */
const doneWithIds = async (
  c: Collections,
  ids: Record<string, string>
): Promise<ReleasesOutcome<BatchResult>> => ({
  ok: true,
  snapshot: { ...(await snapshotOf(c)), ids },
  siteChanged: true
});

async function isLive(c: Collections) {
  const meta = await c.meta.findOne({ _id: 'releases' });
  return Boolean(meta?.live);
}

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
 * A whole release over the one here it's recognised as. It keeps its
 * address, whether it's shown and its place on the shelf.
 */
async function overwrite(
  c: Collections,
  _id: ObjectId,
  fields: ReleaseFields,
  uid: string
) {
  await c.releases.updateOne(
    { _id },
    {
      $set: { ...stored(fields), updatedAt: new Date(), updatedBy: uid },
      $unset: dropped(fields)
    }
  );
}

/** A release new here, at an address made from its title. */
async function insert(
  c: Collections,
  fields: ReleaseFields,
  uid: string
): Promise<ObjectId> {
  const now = new Date();
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

/** Puts a whole release here: over the one it's recognised as, or new. */
async function upsert(
  c: Collections,
  fields: ReleaseFields,
  uid: string
): Promise<ObjectId> {
  const match = await findMatch(c, fields);
  if (!match) return insert(c, fields, uid);
  await overwrite(c, match._id, fields, uid);
  return match._id;
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
  return doneWithIds(c, ids);
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
  if (!(await isLive(c))) return notLive();
  const id = (await upsert(c, fields, uid)).toHexString();
  return doneWithIds(c, { [ref]: id });
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

  await overwrite(c, _id, merged.data, uid);
  // Made a draft again before its day, it no longer shows.
  await offShelfIfHidden(c, _id, { ...merged.data, shown: current.shown });
  return done(c, true);
}

/** Takes a release off the site, off the shelf, and its cover out of storage: it left DISCOGRAPHY. */
export async function removeRelease(id: string): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const c = await open();
  const _id = new ObjectId(id);
  const removed = await c.releases.findOneAndDelete(
    { _id },
    { projection: { cover: 1 } }
  );
  await c.meta.updateOne({ _id: 'releases' }, { $pull: { shelf: _id } });
  if (removed?.cover) await removeImages(removed.cover);
  return done(c, removed !== null);
}

/** Hidden by hand, or not: then its status and date decide. */
export async function setVisibility(
  id: string,
  raw: unknown,
  uid: string
): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const parsed = visibilitySchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const c = await open();
  const _id = new ObjectId(id);
  const saved = await c.releases.findOneAndUpdate(
    { _id },
    {
      $set: {
        shown: parsed.data.shown,
        updatedAt: new Date(),
        updatedBy: uid
      }
    },
    { returnDocument: 'after' }
  );
  if (!saved) return notFound();
  await offShelfIfHidden(c, _id, saved);
  return done(c, true);
}

/** The home page shelf: up to eight releases here, in order, all of them shown. */
export async function setShelf(raw: unknown): Promise<ReleasesOutcome> {
  const parsed = shelfSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const ids = parsed.data.ids.map((id) => new ObjectId(id));
  const c = await open();
  const found = await c.releases
    .find(
      { _id: { $in: ids } },
      { projection: { shown: 1, status: 1, date: 1 } }
    )
    .toArray();
  if (found.length !== ids.length) return fail(409, { error: 'out_of_date' });
  if (found.some((doc) => !isVisible(doc))) return hiddenOnShelf();
  await c.meta.updateOne(
    { _id: 'releases' },
    { $set: { shelf: ids }, $setOnInsert: { live: false } },
    { upsert: true }
  );
  return done(c, true);
}

/**
 * Several changes from RELEASES at once: releases sent for the first time
 * (each as publishRelease takes it), changed fields (as updateRelease),
 * hidden or not (as setVisibility), and the whole shelf (as setShelf).
 * Each is checked against what the others leave before anything is
 * written, so one that can't be made leaves the site as it was. Answers
 * with the site's id for each new release's ref.
 */
export async function applyChanges(
  raw: unknown,
  uid: string
): Promise<ReleasesOutcome<BatchResult>> {
  const parsed = changesSchema.safeParse(raw);
  if (!parsed.success) return invalid(firstIssue(parsed.error));
  const { add, update, visibility, shelf } = parsed.data;

  const c = await open();
  if (!(await isLive(c))) return notLive();

  // Every release named must still be here: one gone means Haven is
  // looking at an older site.
  const named = [
    ...new Set([
      ...update.map((change) => change.id),
      ...visibility.map((change) => change.id),
      ...(shelf ?? [])
    ])
  ];
  const docs = named.length
    ? await c.releases
        .find({ _id: { $in: named.map((id) => new ObjectId(id)) } })
        .toArray()
    : [];
  const byId = new Map(docs.map((doc) => [doc._id.toHexString(), doc]));
  const missing = named.filter((id) => !byId.has(id));
  if (missing.length) return fail(409, { error: 'out_of_date', ids: missing });

  // Each change over what's here, the whole release checked again.
  const merged = new Map<string, ReleaseFields>();
  for (const { id, fields } of update) {
    const current = byId.get(id);
    if (!current) continue; // found above
    const release = releaseSchema.safeParse({
      ...fieldsOf(current),
      ...fields
    });
    if (!release.success)
      return invalid(
        `${fields.title ?? current.title}: ${firstIssue(release.error)}`
      );
    merged.set(id, release.data);
  }
  const shownBy = new Map(visibility.map((change) => [change.id, change]));

  // A new release Haven sends may be one already here: recognised now, by
  // what's here before these changes, and written over it below.
  const added = await Promise.all(
    add.map(async (entry) => ({
      ...entry,
      match: await findMatch(c, entry.fields)
    }))
  );
  const addedOver = new Map(
    added.flatMap(({ fields, match }) =>
      match ? [[match._id.toHexString(), fields] as const] : []
    )
  );

  // The shelf as these changes leave it holds only what visitors see.
  const visibleAfter = (doc: ReleasePublishedDocument) => {
    const id = doc._id.toHexString();
    const fields = addedOver.get(id) ?? merged.get(id) ?? doc;
    const change = shownBy.get(id);
    return isVisible({
      status: fields.status,
      date: fields.date,
      shown: change ? change.shown : doc.shown
    });
  };
  if (
    shelf?.some((id) => {
      const doc = byId.get(id);
      return !doc || !visibleAfter(doc);
    })
  )
    return hiddenOnShelf();

  // Everything checked: written now.
  const now = new Date();
  const writes: AnyBulkWriteOperation<ReleasePublishedDocument>[] = [
    ...new Set([...merged.keys(), ...shownBy.keys()])
  ].map((id) => {
    const fields = merged.get(id);
    const change = shownBy.get(id);
    return {
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: {
          $set: {
            ...(fields ? stored(fields) : {}),
            ...(change ? { shown: change.shown } : {}),
            updatedAt: now,
            updatedBy: uid
          },
          ...(fields ? { $unset: dropped(fields) } : {})
        }
      }
    };
  });
  if (writes.length) await c.releases.bulkWrite(writes);

  const ids: Record<string, string> = {};
  for (const { ref, fields, match } of added) {
    if (match) {
      await overwrite(c, match._id, fields, uid);
      ids[ref] = match._id.toHexString();
    } else {
      // Not here before, though one sent earlier in this request may be it.
      ids[ref] = (await upsert(c, fields, uid)).toHexString();
    }
  }

  if (shelf)
    await c.meta.updateOne(
      { _id: 'releases' },
      { $set: { shelf: shelf.map((id) => new ObjectId(id)) } }
    );
  // Whatever these changes hid comes off the shelf, the one just set too.
  const changed = new Set([
    ...merged.keys(),
    ...shownBy.keys(),
    ...Object.values(ids)
  ]);
  await offShelfWhereHidden(
    c,
    [...changed].map((id) => new ObjectId(id))
  );
  return doneWithIds(c, ids);
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

// ------------------------------------------------------------------ covers

/**
 * A release's cover, from the image Haven sent: made into the site's WebP,
 * put in storage, and the release pointed at it. The cover it had before
 * comes out of storage once nothing points to it.
 */
export async function setCover(
  id: string,
  image: Buffer,
  uid: string
): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const c = await open();
  const _id = new ObjectId(id);
  if (!(await c.releases.countDocuments({ _id }, { limit: 1 })))
    return notFound();

  let encoded: EncodedCover;
  try {
    encoded = await encodeCover(image);
  } catch (error) {
    if (error instanceof InvalidCoverError) return invalid(error.message);
    throw error;
  }
  const { data, ...size } = encoded;
  const uploaded = await uploadCover(id, data);
  const tape = await makeTape(id, data);

  const now = new Date();
  const cover: ReleaseCoverDocument = {
    ...uploaded,
    ...size,
    updatedAt: now,
    ...(tape ? { tape } : {})
  };
  const before = await c.releases.findOneAndUpdate(
    { _id },
    { $set: { cover, updatedAt: now, updatedBy: uid } },
    { returnDocument: 'before', projection: { cover: 1 } }
  );
  if (!before) {
    // Removed while its cover was on the way: the cover goes too.
    await removeImages(cover);
    return notFound();
  }
  if (before.cover && before.cover.path !== uploaded.path)
    await removeCover(before.cover.path);
  if (before.cover?.tape && before.cover.tape.path !== tape?.path)
    await removeCover(before.cover.tape.path);
  return done(c, true);
}

/**
 * The shelf's tape for a cover, put beside it. A tape that can't be made
 * leaves the release on the placeholder tape, not without its cover.
 */
async function makeTape(
  id: string,
  cover: Buffer
): Promise<ReleaseCoverDocument['tape'] | null> {
  try {
    const data = await tapeFromCover(cover);
    return { ...(await uploadTape(id, data)), bytes: data.length };
  } catch (error) {
    console.error(`The tape for release ${id} could not be made.`, error);
    return null;
  }
}

/** A cover and its tape, out of storage. */
async function removeImages(cover: ReleaseCoverDocument) {
  await removeCover(cover.path);
  if (cover.tape) await removeCover(cover.tape.path);
}

/** Back to the placeholder: the release's cover comes off it and out of storage. */
export async function clearCover(
  id: string,
  uid: string
): Promise<ReleasesOutcome> {
  if (!isReleaseId(id)) return notFound();
  const c = await open();
  const _id = new ObjectId(id);
  const before = await c.releases.findOneAndUpdate(
    { _id, cover: { $exists: true } },
    { $unset: { cover: '' }, $set: { updatedAt: new Date(), updatedBy: uid } },
    { returnDocument: 'before', projection: { cover: 1 } }
  );
  if (!before?.cover) {
    // No cover to clear: fine, as long as the release is here.
    const here = await c.releases.countDocuments({ _id }, { limit: 1 });
    return here ? done(c, false) : notFound();
  }
  await removeImages(before.cover);
  return done(c, true);
}
