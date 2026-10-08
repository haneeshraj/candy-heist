import type { NextRequest } from 'next/server';
import { catalogue } from '@/content/services/catalogue';
import { slotsBetween } from '@/lib/booking/availability';
import { bookableWindow, HOURS } from '@/lib/booking/hours';
import {
  AvailabilityUnavailableError,
  busyBetween
} from '@/lib/booking/server/busy';
import { DatabaseUnavailableError } from '@/lib/db/client';

// A session's open times in a stretch of days, for the date step:
// GET /api/booking/slots?service=dj-lessons&from=…&to=… (ISO instants, the
// visitor's month). A read, so a route rather than a Server Action: the
// page can ask for the next month while it still shows this one.

/** The longest stretch one request can ask for. */
const MAX_RANGE_MS = 45 * 24 * 60 * 60 * 1000;

const noStore = { 'cache-control': 'no-store' };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const item = catalogue.find(
    (entry) => entry.id === params.get('service') && entry.kind === 'session'
  );
  const from = new Date(params.get('from') ?? '');
  const to = new Date(params.get('to') ?? '');
  if (
    !item ||
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    to <= from ||
    to.getTime() - from.getTime() > MAX_RANGE_MS
  )
    return Response.json(
      { error: 'invalid' },
      { status: 400, headers: noStore }
    );

  const now = new Date();
  const durationMinutes = item.durationMinutes ?? 60;
  // Busy times either side, so a session near the edge still sees them.
  const margin = (durationMinutes + HOURS.bufferMinutes) * 60_000;
  try {
    const busy = await busyBetween(
      new Date(from.getTime() - margin),
      new Date(to.getTime() + margin),
      now
    );
    const { earliest, latest } = bookableWindow(HOURS, now);
    return Response.json(
      {
        slots: slotsBetween(
          { hours: HOURS, durationMinutes, busy, now },
          from,
          to
        ),
        earliest: earliest.toISOString(),
        latest: latest.toISOString()
      },
      { headers: noStore }
    );
  } catch (error) {
    if (
      !(error instanceof AvailabilityUnavailableError) &&
      !(error instanceof DatabaseUnavailableError)
    )
      console.error('Open times could not be read.', error);
    return Response.json(
      { error: 'unavailable' },
      { status: 503, headers: noStore }
    );
  }
}
