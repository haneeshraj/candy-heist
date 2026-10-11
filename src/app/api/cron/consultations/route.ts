import { timingSafeEqual } from 'node:crypto';
import { sweepConsultations } from '@/lib/consult/store';
import { havenFailure, havenJson } from '@/lib/haven/guard';

// The daily sweep, run by Vercel Cron (vercel.json): deletes the tracks of
// links that have closed and uploads whose link never opened, so a track
// goes even if no copy of Candy Haven is opened again. Vercel calls it
// with CRON_SECRET as a bearer token; anything else is turned away.

function fromVercelCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET)
    return havenJson({ error: 'not_configured' }, 503);
  if (!fromVercelCron(request))
    return havenJson({ error: 'unauthorized' }, 401);
  try {
    return havenJson(await sweepConsultations(new Date(), { orphans: true }));
  } catch (error) {
    return havenFailure(error);
  }
}
