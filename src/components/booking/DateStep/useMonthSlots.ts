'use client';

import { useEffect, useState } from 'react';
import type { Slot } from '@/lib/booking/availability';
import { addMonths, toDateKey, zonedTimeToUtc } from '@/lib/booking/dates';

// One month of a session's times, as the visitor's calendar has the month:
// asked of the server (/api/booking/slots) each time the month or the
// session changes. Candy's calendar and the bookings are read there.

export type MonthSlots =
  | { status: 'loading' }
  | { status: 'ready'; slots: Slot[] }
  | { status: 'error' };

const LOADING: MonthSlots = { status: 'loading' };

export function useMonthSlots(
  itemId: string,
  view: { year: number; month: number },
  timeZone: string
): MonthSlots {
  const { year, month } = view;
  const key = `${itemId}|${year}-${month}|${timeZone}`;
  const [result, setResult] = useState<{ key: string; value: MonthSlots }>({
    key: '',
    value: LOADING
  });

  useEffect(() => {
    const controller = new AbortController();
    const next = addMonths({ year, month }, 1);
    const from = zonedTimeToUtc(
      toDateKey({ year, month, day: 1 }),
      '00:00',
      timeZone
    );
    const to = zonedTimeToUtc(
      toDateKey({ ...next, day: 1 }),
      '00:00',
      timeZone
    );
    const params = new URLSearchParams({
      service: itemId,
      from: from.toISOString(),
      to: to.toISOString()
    });
    fetch(`/api/booking/slots?${params}`, {
      signal: controller.signal,
      cache: 'no-store'
    })
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{ slots: Slot[] }>)
          : Promise.reject(new Error(`Open times: ${response.status}`))
      )
      .then((body) =>
        setResult({ key, value: { status: 'ready', slots: body.slots } })
      )
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ key, value: { status: 'error' } });
      });
    return () => controller.abort();
  }, [key, itemId, year, month, timeZone]);

  return result.key === key ? result.value : LOADING;
}
