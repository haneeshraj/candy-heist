'use client';

import { useEffect, useState } from 'react';
import { releaseTime } from '@/lib/discography/catalogue';
import { timeLeft } from '@/lib/discography/format';

/**
 * Whether a release is out, and the time left until it is, kept live. It
 * starts from `renderedAt` (when the server made the page), so the first
 * render matches the server's, then follows the reader's clock, ticking
 * each second until the moment comes, when the page turns to "out" by
 * itself.
 */
export function useReleaseClock(date: string | undefined, renderedAt: number) {
  const target = date ? releaseTime({ date }) : null;
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    if (target === null) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(() => {
      tick();
      if (Date.now() >= target) window.clearInterval(id);
    }, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [target]);

  const out = target === null || now >= target;
  return { out, left: target === null ? null : timeLeft(target, now) };
}
