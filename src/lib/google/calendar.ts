import 'server-only';
import { createHash } from 'node:crypto';
import type { Interval } from '@/lib/booking/availability';
import { googleFetch, GoogleRequestError } from './oauth';

// Candy's own calendar ("primary"): when he's busy, and each session put
// on it with a Google Meet link and the client invited, so Google sends
// them the invitation too.

const API = 'https://www.googleapis.com/calendar/v3';

/** When Candy is busy in [from, to): times only, never what the events are. */
export async function calendarBusy(from: Date, to: Date): Promise<Interval[]> {
  const response = await googleFetch(`${API}/freeBusy`, {
    method: 'POST',
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: 'primary' }]
    })
  });
  if (!response.ok)
    throw new GoogleRequestError(response.status, await response.text());
  const body = (await response.json()) as {
    calendars?: Record<
      string,
      { busy?: { start: string; end: string }[]; errors?: unknown[] }
    >;
  };
  const primary = body.calendars?.primary;
  if (!primary || primary.errors?.length)
    throw new GoogleRequestError(502, JSON.stringify(primary?.errors ?? body));
  return (primary.busy ?? []).map((slot) => ({
    start: new Date(slot.start),
    end: new Date(slot.end)
  }));
}

/**
 * The event's id, made from the booking's reference: the same booking
 * always makes the same id, so adding it twice finds the first instead.
 * Google takes 5 to 1024 of a–v and 0–9; a hex hash is within that.
 */
export const sessionEventId = (reference: string) =>
  `ch${createHash('sha256').update(reference).digest('hex').slice(0, 30)}`;

export interface SessionEvent {
  reference: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  /** The client, invited by Google's own email. */
  attendee: { email: string; name: string };
  timeZone: string;
}

export interface PlacedEvent {
  id: string;
  meetLink: string | null;
  htmlLink: string | null;
}

interface GoogleEvent {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[];
    createRequest?: { status?: { statusCode?: string } };
  };
}

const placed = (event: GoogleEvent): PlacedEvent => ({
  id: event.id,
  meetLink:
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find(
      (point) => point.entryPointType === 'video'
    )?.uri ??
    null,
  htmlLink: event.htmlLink ?? null
});

async function readEvent(id: string): Promise<GoogleEvent> {
  const response = await googleFetch(
    `${API}/calendars/primary/events/${id}?conferenceDataVersion=1`
  );
  if (!response.ok)
    throw new GoogleRequestError(response.status, await response.text());
  return (await response.json()) as GoogleEvent;
}

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Puts a session on Candy's calendar with a Meet link, once. */
export async function placeSessionEvent(
  session: SessionEvent
): Promise<PlacedEvent> {
  const id = sessionEventId(session.reference);
  const response = await googleFetch(
    `${API}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      body: JSON.stringify({
        id,
        summary: session.summary,
        description: session.description,
        start: {
          dateTime: session.start.toISOString(),
          timeZone: session.timeZone
        },
        end: {
          dateTime: session.end.toISOString(),
          timeZone: session.timeZone
        },
        attendees: [
          { email: session.attendee.email, displayName: session.attendee.name }
        ],
        conferenceData: {
          createRequest: {
            requestId: id,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false
      })
    }
  );

  let event: GoogleEvent;
  if (response.status === 409) event = await readEvent(id);
  else if (!response.ok)
    throw new GoogleRequestError(response.status, await response.text());
  else event = (await response.json()) as GoogleEvent;

  // The Meet link is usually there at once; a moment later if it's pending.
  for (let tries = 0; !placed(event).meetLink && tries < 3; tries++) {
    await wait(1200);
    event = await readEvent(id);
  }
  return placed(event);
}

/**
 * Moves a session's event to its new time, the Meet link kept; Google
 * sends the client the updated invitation. An event deleted by hand comes
 * back. Null when there's no such event at all (it was never made).
 */
export async function moveSessionEvent(
  id: string,
  start: Date,
  end: Date,
  timeZone: string
): Promise<PlacedEvent | null> {
  const response = await googleFetch(
    `${API}/calendars/primary/events/${id}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
        status: 'confirmed'
      })
    }
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new GoogleRequestError(response.status, await response.text());
  return placed((await response.json()) as GoogleEvent);
}

/**
 * Takes a session's event off Candy's calendar; Google tells the client.
 * One that's gone already is fine.
 */
export async function removeSessionEvent(id: string): Promise<void> {
  const response = await googleFetch(
    `${API}/calendars/primary/events/${id}?sendUpdates=all`,
    { method: 'DELETE' }
  );
  if (response.ok || response.status === 404 || response.status === 410) return;
  throw new GoogleRequestError(response.status, await response.text());
}
