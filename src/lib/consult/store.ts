import 'server-only';
import { randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type ConsultationAccessDocument,
  type ConsultationDocument,
  type ConsultationFeedbackDocument
} from '@/lib/db/collections';
import { parseId } from '@/lib/inbox/store';
import { absolute } from '@/lib/site/url';
import { decodeWaveform, type Feedback } from './engine';
import {
  ChangeConsultationSchema,
  DAY,
  MAX_DAYS,
  OpenConsultationSchema,
  isOpen,
  type ConsultationForHaven,
  type FeedbackForHaven,
  type Room
} from './model';

// The site's reads and writes of consultations. Candy Haven opens, moves,
// closes and removes them through its API, and pulls what producers sent;
// a link's page reads its room and files feedback.
//
// Whether a link is open is decided here every time, from its dates, and
// not left to the TTL indexes: those delete what has closed within a
// minute or so, and in that minute a closed link must already read as
// closed.

/** How much feedback one check-in hands over before asking for the rest. */
export const PAGE_SIZE = 200;

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

/** Every consultation, newest first: the open ones with their links. */
export async function listConsultations(
  now: Date = new Date()
): Promise<{ consultations: ConsultationForHaven[] }> {
  const { consultations, access, feedback } = await collections();
  const docs = await consultations.find().sort({ createdAt: -1 }).toArray();
  const ids = docs.map((doc) => doc._id);
  const [gates, counts] = await Promise.all([
    access.find({ _id: { $in: ids } }).toArray(),
    feedback
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { consultationId: { $in: ids }, expireAt: { $gt: now } } },
        { $group: { _id: '$consultationId', count: { $sum: 1 } } }
      ])
      .toArray()
  ]);
  const gateOf = new Map(gates.map((gate) => [gate._id.toHexString(), gate]));
  const countOf = new Map(
    counts.map(({ _id, count }) => [_id.toHexString(), count])
  );
  return {
    consultations: docs.map((doc) => {
      const id = doc._id.toHexString();
      return forHaven(doc, gateOf.get(id) ?? null, countOf.get(id) ?? 0, now);
    })
  };
}

/**
 * Moves when an open link closes, or records that Haven deleted its track.
 * A link closes a week from when it was shared at the latest, and it can't
 * be reopened: once it's closed, its feedback is gone.
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

  const set: Partial<
    Pick<ConsultationDocument, 'expiresAt' | 'audioDeletedAt'>
  > = {};
  if (parsed.data.expiresAt !== undefined) {
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
    set.expiresAt = expiresAt;
  }
  if (parsed.data.audioDeletedAt !== undefined && doc.audioDeletedAt === null)
    set.audioDeletedAt = new Date(parsed.data.audioDeletedAt);

  if (set.expiresAt || set.audioDeletedAt)
    await consultations.updateOne({ _id }, { $set: set });
  if (set.expiresAt) {
    await access.updateOne({ _id }, { $set: { expireAt: set.expiresAt } });
    await feedback.updateMany(
      { consultationId: _id },
      { $set: { expireAt: set.expiresAt } }
    );
  }

  const next = { ...doc, ...set };
  const [gate, count] = await Promise.all([
    access.findOne({ _id }),
    feedback.countDocuments({ consultationId: _id, expireAt: { $gt: now } })
  ]);
  return { ok: true, body: forHaven(next, gate, count, now) };
}

/**
 * Closes a link now: its page stops answering and its feedback is deleted,
 * as if its time had run out. The record stays, as an expired one does.
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
  return { ok: true, body: forHaven(next, null, 0, now) };
}

/**
 * Forgets a consultation altogether, whatever is left of it. Removing one
 * that's gone already is not an error: the other copy of Haven may have
 * got there first.
 */
export async function removeConsultation(
  id: string
): Promise<ConsultOutcome<null>> {
  const _id = parseId(id);
  if (!_id) return refuse(404, 'not_found');
  const { consultations, access, feedback } = await collections();
  await access.deleteOne({ _id });
  await feedback.deleteMany({ consultationId: _id });
  await consultations.deleteOne({ _id });
  return { ok: true, body: null };
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
