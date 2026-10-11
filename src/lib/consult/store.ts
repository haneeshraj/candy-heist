import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { ObjectId, type Collection } from 'mongodb';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type ConsultationAccessDocument,
  type ConsultationDocument,
  type ConsultationFeedbackDocument
} from '@/lib/db/collections';
import { parseId } from '@/lib/inbox/store';
import { absolute } from '@/lib/site/url';
import {
  blobConfigured,
  deleteTrack,
  issueUploadToken,
  listTracks
} from './blob';
import { decodeWaveform, type Feedback } from './engine';
import {
  ChangeConsultationSchema,
  DAY,
  DiscardUploadSchema,
  MAX_DAYS,
  OpenConsultationSchema,
  STORE_LIMIT_BYTES,
  UploadRequestSchema,
  isOpen,
  trackFolder,
  type ConsultationForHaven,
  type ConsultationList,
  type FeedbackForHaven,
  type Room,
  type StoreUsage,
  type UploadPass
} from './model';

// The site's reads and writes of consultations. Candy Haven asks for a
// pass to upload a track, opens, moves, closes and removes links through
// its API, and pulls what producers sent; a link's page reads its room and
// files feedback. The site deletes the tracks itself: when a link is ended,
// when Haven asks it to sweep, and once a day by itself (the cron route).
//
// Whether a link is open is decided here every time, from its dates, and
// not left to the TTL indexes: those delete what has closed within a
// minute or so, and in that minute a closed link must already read as
// closed.

/** How much feedback one check-in hands over before asking for the rest. */
export const PAGE_SIZE = 200;

/**
 * How old a track no record points to must be before the sweep takes it
 * for an upload whose link never opened: well past its pass's hour, so
 * one still being uploaded is never caught.
 */
export const ORPHAN_AFTER_MS = 6 * 60 * 60 * 1000;

/** A link's token: 32 random bytes as base64url, 43 characters. */
const TOKEN = /^[\w-]{43}$/;

export const newToken = () => randomBytes(32).toString('base64url');

export type ConsultOutcome<T> =
  | { ok: true; body: T }
  | { ok: false; status: number; body: { error: string; message?: string } };

const refuse = (
  status: number,
  error: string,
  message?: string
): ConsultOutcome<never> => ({
  ok: false,
  status,
  body: message ? { error, message } : { error }
});

/** Bytes in the units Haven shows them in: `312 MB`, `1.0 GB`. */
const size = (bytes: number) =>
  bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
    : `${bytes > 0 ? Math.max(1, Math.round(bytes / 1024 ** 2)) : 0} MB`;

async function collections() {
  const db = await getDb();
  return {
    consultations: db.collection<ConsultationDocument>(
      COLLECTIONS.consultations
    ),
    access: db.collection<ConsultationAccessDocument>(
      COLLECTIONS.consultationAccess
    ),
    feedback: db.collection<ConsultationFeedbackDocument>(
      COLLECTIONS.consultationFeedback
    )
  };
}

function forHaven(
  doc: ConsultationDocument,
  access: ConsultationAccessDocument | null,
  feedbackCount: number,
  now: Date
): ConsultationForHaven {
  const open = access !== null && isOpen(doc, now);
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    message: doc.message,
    durationMs: doc.durationMs,
    bpm: doc.bpm,
    audio: doc.audio,
    createdAt: doc.createdAt.toISOString(),
    createdBy: doc.createdBy,
    expiresAt: doc.expiresAt.toISOString(),
    endedAt: doc.endedAt?.toISOString() ?? null,
    audioDeletedAt: doc.audioDeletedAt?.toISOString() ?? null,
    link: open ? absolute(`/consult/${access.token}`) : null,
    waveform: open ? access.waveform : null,
    feedbackCount: open ? feedbackCount : 0
  };
}

/** How full the store is, by the records of the tracks not deleted yet. */
async function usage(
  consultations: Collection<ConsultationDocument>
): Promise<StoreUsage> {
  const [row] = await consultations
    .aggregate<{ bytes: number }>([
      { $match: { audioDeletedAt: null } },
      { $group: { _id: null, bytes: { $sum: '$audio.bytes' } } }
    ])
    .toArray();
  return {
    configured: blobConfigured(),
    usedBytes: row?.bytes ?? 0,
    limitBytes: STORE_LIMIT_BYTES
  };
}

/**
 * The pass for one upload: a name in this copy's folder, and a token that
 * lets exactly that file, of that type and size, into the store within the
 * hour. Refused when there's no store, or no room for it: the count here
 * is of every track not yet deleted, shared from either copy of Haven.
 */
export async function prepareUpload(
  raw: unknown,
  now: Date = new Date()
): Promise<ConsultOutcome<UploadPass>> {
  const parsed = UploadRequestSchema.safeParse(raw);
  if (!parsed.success)
    return refuse(400, 'invalid', parsed.error.issues[0]?.message);
  if (!blobConfigured())
    return refuse(
      409,
      'no_store',
      'The website has no Blob store yet, so there is nowhere to keep the track.'
    );

  const { consultations } = await collections();
  const { usedBytes, limitBytes } = await usage(consultations);
  const free = Math.max(0, limitBytes - usedBytes);
  const { extension, contentType, bytes } = parsed.data;
  if (bytes > free)
    return refuse(
      409,
      'no_room',
      `There isn’t room for this track: ${size(free)} of the free ${size(limitBytes)} is left, and it is ${size(bytes)}.`
    );

  const pathname = `${trackFolder()}${randomUUID()}.${extension}`;
  const pass = await issueUploadToken(pathname, contentType, bytes, now);
  return {
    ok: true,
    body: {
      pathname,
      token: pass.token,
      validUntil: new Date(pass.validUntil).toISOString()
    }
  };
}

/**
 * Deletes an upload whose link never opened, so it doesn't take room until
 * the daily sweep finds it. Only a name in this copy's folder, and only
 * one no record points to.
 */
export async function discardUpload(
  raw: unknown
): Promise<ConsultOutcome<null>> {
  const parsed = DiscardUploadSchema.safeParse(raw);
  if (!parsed.success)
    return refuse(400, 'invalid', parsed.error.issues[0]?.message);
  const { consultations } = await collections();
  const held = await consultations.findOne({
    'audio.path': parsed.data.pathname
  });
  if (held)
    return refuse(409, 'in_use', 'That track belongs to a shared link.');
  if (blobConfigured()) await deleteTrack(parsed.data.pathname);
  return { ok: true, body: null };
}

/** Opens a link for a track Haven has uploaded: its record, and the way in. */
export async function openConsultation(
  raw: unknown,
  uid: string,
  now: Date = new Date()
): Promise<ConsultOutcome<ConsultationForHaven>> {
  const parsed = OpenConsultationSchema.safeParse(raw);
  if (!parsed.success)
    return refuse(400, 'invalid', parsed.error.issues[0]?.message);
  const body = parsed.data;
  if (!decodeWaveform(body.waveform))
    return refuse(400, 'invalid', 'The waveform could not be read.');

  const { consultations, access } = await collections();
  const _id = new ObjectId();
  const expiresAt = new Date(now.getTime() + body.days * DAY);
  const doc: ConsultationDocument = {
    _id,
    title: body.title,
    message: body.message,
    durationMs: body.durationMs,
    bpm: body.bpm,
    audio: {
      path: body.audio.path,
      url: body.audio.url,
      bytes: body.audio.bytes,
      contentType: body.audio.contentType
    },
    createdAt: now,
    createdBy: uid,
    expiresAt,
    endedAt: null,
    audioDeletedAt: null
  };
  const gate: ConsultationAccessDocument = {
    _id,
    token: newToken(),
    audioUrl: body.audio.url,
    waveform: body.waveform,
    expireAt: expiresAt
  };
  await consultations.insertOne(doc);
  try {
    await access.insertOne(gate);
  } catch (error) {
    // A record with no way in is no record: take it back.
    await consultations.deleteOne({ _id });
    throw error;
  }
  return { ok: true, body: forHaven(doc, gate, 0, now) };
}

/** Every consultation, newest first, the open ones with their links; and the room left. */
export async function listConsultations(
  now: Date = new Date()
): Promise<ConsultationList> {
  const { consultations, access, feedback } = await collections();
  const docs = await consultations.find().sort({ createdAt: -1 }).toArray();
  const ids = docs.map((doc) => doc._id);
  const [gates, counts, storage] = await Promise.all([
    access.find({ _id: { $in: ids } }).toArray(),
    feedback
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { consultationId: { $in: ids }, expireAt: { $gt: now } } },
        { $group: { _id: '$consultationId', count: { $sum: 1 } } }
      ])
      .toArray(),
    usage(consultations)
  ]);
  const gateOf = new Map(gates.map((gate) => [gate._id.toHexString(), gate]));
  const countOf = new Map(
    counts.map(({ _id, count }) => [_id.toHexString(), count])
  );
  return {
    consultations: docs.map((doc) => {
      const id = doc._id.toHexString();
      return forHaven(doc, gateOf.get(id) ?? null, countOf.get(id) ?? 0, now);
    }),
    storage
  };
}

/**
 * Moves when an open link closes. It closes a week from when it was shared
 * at the latest, and it can't be reopened: once it's closed, its feedback
 * is gone.
 */
export async function changeConsultation(
  id: string,
  raw: unknown,
  now: Date = new Date()
): Promise<ConsultOutcome<ConsultationForHaven>> {
  const _id = parseId(id);
  if (!_id) return refuse(404, 'not_found');
  const parsed = ChangeConsultationSchema.safeParse(raw);
  if (!parsed.success)
    return refuse(400, 'invalid', parsed.error.issues[0]?.message);

  const { consultations, access, feedback } = await collections();
  const doc = await consultations.findOne({ _id });
  if (!doc) return refuse(404, 'not_found');
  if (!isOpen(doc, now))
    return refuse(
      409,
      'closed',
      'This link has closed. Share the track again for more feedback.'
    );

  const expiresAt = new Date(parsed.data.expiresAt);
  if (expiresAt.getTime() <= now.getTime())
    return refuse(
      400,
      'invalid',
      'Choose a time still to come, or close the link now.'
    );
  if (expiresAt.getTime() > doc.createdAt.getTime() + MAX_DAYS * DAY)
    return refuse(
      400,
      'invalid',
      `A link stays open ${MAX_DAYS} days at most from when it was shared.`
    );

  await consultations.updateOne({ _id }, { $set: { expiresAt } });
  await access.updateOne({ _id }, { $set: { expireAt: expiresAt } });
  await feedback.updateMany(
    { consultationId: _id },
    { $set: { expireAt: expiresAt } }
  );

  const [gate, count] = await Promise.all([
    access.findOne({ _id }),
    feedback.countDocuments({ consultationId: _id, expireAt: { $gt: now } })
  ]);
  return { ok: true, body: forHaven({ ...doc, expiresAt }, gate, count, now) };
}

/**
 * Deletes a closed link's track, and records that it's gone. False when
 * the store couldn't be reached, for the next sweep to try again.
 */
async function deleteTrackOf(
  consultations: Collection<ConsultationDocument>,
  doc: ConsultationDocument,
  now: Date
): Promise<boolean> {
  if (doc.audioDeletedAt !== null) return true;
  if (!blobConfigured()) return false;
  try {
    await deleteTrack(doc.audio.url || doc.audio.path);
  } catch (error) {
    console.error('Could not delete a consultation’s track yet.', error);
    return false;
  }
  await consultations.updateOne(
    { _id: doc._id, audioDeletedAt: null },
    { $set: { audioDeletedAt: now } }
  );
  return true;
}

/**
 * Closes a link now: its page stops answering, its feedback is deleted,
 * and so is its track, as if its time had run out. The record stays, as
 * an expired one does.
 */
export async function endConsultation(
  id: string,
  now: Date = new Date()
): Promise<ConsultOutcome<ConsultationForHaven>> {
  const _id = parseId(id);
  if (!_id) return refuse(404, 'not_found');
  const { consultations, access, feedback } = await collections();
  const doc = await consultations.findOne({ _id });
  if (!doc) return refuse(404, 'not_found');

  let next = doc;
  if (isOpen(doc, now)) {
    next = { ...doc, endedAt: now, expiresAt: now };
    await consultations.updateOne(
      { _id },
      { $set: { endedAt: now, expiresAt: now } }
    );
  }
  await access.deleteOne({ _id });
  await feedback.deleteMany({ consultationId: _id });
  if (await deleteTrackOf(consultations, next, now))
    next = { ...next, audioDeletedAt: next.audioDeletedAt ?? now };
  return { ok: true, body: forHaven(next, null, 0, now) };
}

/**
 * Forgets a consultation altogether, whatever is left of it, its track
 * included. Removing one that's gone already is not an error: the other
 * copy of Haven may have got there first. A track that can't be deleted
 * now is left to the daily sweep, which deletes what no record points to.
 */
export async function removeConsultation(
  id: string,
  now: Date = new Date()
): Promise<ConsultOutcome<null>> {
  const _id = parseId(id);
  if (!_id) return refuse(404, 'not_found');
  const { consultations, access, feedback } = await collections();
  const doc = await consultations.findOne({ _id });
  if (doc) await deleteTrackOf(consultations, doc, now);
  await access.deleteOne({ _id });
  await feedback.deleteMany({ consultationId: _id });
  await consultations.deleteOne({ _id });
  return { ok: true, body: null };
}

export interface SweepResult {
  /** Closed links whose tracks were deleted. */
  deleted: number;
  /** Uploads no record pointed to, deleted. */
  orphans: number;
}

/**
 * Deletes what should be gone: the tracks of links that have closed, and,
 * with `orphans`, files in this copy's folder that no record points to and
 * that are older than an upload could still be in progress for. Haven asks
 * for the first when a check-in finds a closed link with its track still
 * there; the daily cron does both, so a track goes even if no copy of
 * Haven is ever opened again.
 */
export async function sweepConsultations(
  now: Date = new Date(),
  { orphans = false }: { orphans?: boolean } = {}
): Promise<SweepResult> {
  if (!blobConfigured()) return { deleted: 0, orphans: 0 };
  const { consultations, access, feedback } = await collections();

  const due = await consultations
    .find({
      audioDeletedAt: null,
      $or: [{ endedAt: { $ne: null } }, { expiresAt: { $lte: now } }]
    })
    .toArray();
  let deleted = 0;
  for (const doc of due) {
    if (!(await deleteTrackOf(consultations, doc, now))) continue;
    // The TTL indexes would get to these; a closed link's are gone now.
    await access.deleteOne({ _id: doc._id });
    await feedback.deleteMany({ consultationId: doc._id });
    deleted += 1;
  }

  let cleared = 0;
  if (orphans) {
    const held = new Set(
      (
        await consultations
          .find({ audioDeletedAt: null }, { projection: { 'audio.path': 1 } })
          .toArray()
      ).map((doc) => doc.audio.path)
    );
    for (const track of await listTracks(trackFolder())) {
      if (held.has(track.pathname)) continue;
      if (now.getTime() - track.uploadedAt.getTime() < ORPHAN_AFTER_MS)
        continue;
      try {
        await deleteTrack(track.url);
        cleared += 1;
      } catch (error) {
        console.error('Could not delete an abandoned upload yet.', error);
      }
    }
  }

  return { deleted, orphans: cleared };
}

export interface FeedbackChanges {
  feedback: FeedbackForHaven[];
  /** Pass back as `since` next time. */
  cursor: string;
  /** More arrived than one page holds: ask again with the cursor. */
  more: boolean;
}

/**
 * Feedback sent at or after `since` on links still open, oldest first.
 * Nothing sent is ever edited, so what arrived is all there is to hand
 * over; at or after, as the inbox does, since two can share a millisecond.
 */
export async function feedbackSince(
  since: Date,
  now: Date = new Date()
): Promise<FeedbackChanges> {
  const { feedback } = await collections();
  const page = await feedback
    .find({ submittedAt: { $gte: since }, expireAt: { $gt: now } })
    .sort({ submittedAt: 1 })
    .limit(PAGE_SIZE)
    .toArray();
  const last = page.at(-1)?.submittedAt ?? since;
  return {
    feedback: page.map((doc) => ({
      id: doc._id.toHexString(),
      consultationId: doc.consultationId.toHexString(),
      name: doc.name,
      notes: doc.notes,
      chain: doc.chain,
      submittedAt: doc.submittedAt.toISOString()
    })),
    cursor: last.toISOString(),
    more: page.length === PAGE_SIZE
  };
}

/** An open link's way in and its record, or null when it isn't open. */
async function openGate(token: string, now: Date) {
  if (!TOKEN.test(token)) return null;
  const { consultations, access } = await collections();
  const gate = await access.findOne({ token });
  if (!gate || gate.expireAt.getTime() <= now.getTime()) return null;
  const doc = await consultations.findOne({ _id: gate._id });
  if (!doc || !isOpen(doc, now)) return null;
  return { gate, doc };
}

/** What a link's page draws, or null when the link isn't open. */
export async function findRoom(
  token: string,
  now: Date = new Date()
): Promise<Room | null> {
  const open = await openGate(token, now);
  if (!open) return null;
  const { gate, doc } = open;
  return {
    token,
    title: doc.title,
    message: doc.message,
    durationMs: doc.durationMs,
    bpm: doc.bpm,
    audioUrl: gate.audioUrl,
    waveform: gate.waveform,
    expiresAt: doc.expiresAt.toISOString()
  };
}

/**
 * Files one producer's feedback against an open link, to be deleted when
 * it closes. Answers false when the link closed in the meantime.
 */
export async function fileFeedback(
  token: string,
  feedback: Feedback,
  now: Date = new Date()
): Promise<boolean> {
  const open = await openGate(token, now);
  if (!open) return false;
  const { feedback: collection } = await collections();
  await collection.insertOne({
    _id: new ObjectId(),
    consultationId: open.gate._id,
    name: feedback.name,
    notes: feedback.notes,
    chain: feedback.chain,
    submittedAt: now,
    expireAt: open.gate.expireAt
  });
  return true;
}
