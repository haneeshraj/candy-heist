import 'server-only';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS, type RateLimitDocument } from '@/lib/db/collections';
import { visitorKey } from './visitorKey';

const HOUR = 60 * 60 * 1000;

/**
 * Who's asking, as far as the server can tell: the first address in the
 * forwarding chain the host adds. In development there's no proxy, so it
 * falls back to a fixed name and everyone on the machine shares one limit.
 */
export async function visitorAddress(): Promise<string> {
  const list = await headers();
  const forwarded = list.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || list.get('x-real-ip')?.trim() || 'local';
}

/**
 * Counts one more use of something by this visitor, and says whether it's
 * within `limit` an hour. Every use is counted, allowed or not, so knocking
 * on the limit keeps it shut.
 */
export async function withinHourlyLimit(
  purpose: string,
  limit: number
): Promise<boolean> {
  const db = await getDb();
  const key = visitorKey(await visitorAddress(), purpose);
  const now = new Date();
  const limits = db.collection<RateLimitDocument>(COLLECTIONS.rateLimits);

  const recent = await limits.countDocuments({
    key,
    at: { $gt: new Date(now.getTime() - HOUR) }
  });
  await limits.insertOne({
    key,
    at: now,
    expireAt: new Date(now.getTime() + HOUR)
  });
  return recent < limit;
}
