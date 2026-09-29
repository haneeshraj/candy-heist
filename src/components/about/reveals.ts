'use client';

import { useCallback, useRef } from 'react';

// What a text component hands its parent (WordReveal, ClipRevealText and
// RichWordReveal all share it): play it, reset it, or take its timeline to
// nest in a scroll-scrubbed one.
export interface RevealHandle {
  play: () => Promise<void>;
  reset: () => void;
  timeline: () => gsap.core.Timeline;
}

export type RevealBinder = (
  key: string
) => (handle: RevealHandle | null) => void;
export type RevealMap = Map<string, RevealHandle>;

// A registry for the page's text reveals, keyed by name ("who.body"), so
// the motion hooks can reach any of them: scrubbing them on desktop,
// playing them on view on phones, showing them at once with reduced
// motion. Each key keeps one stable callback ref.
export function useReveals() {
  const reveals = useRef<RevealMap>(new Map());
  const binders = useRef(
    new Map<string, (handle: RevealHandle | null) => void>()
  );

  const bind = useCallback<RevealBinder>((key) => {
    let binder = binders.current.get(key);
    if (!binder) {
      binder = (handle) => {
        if (handle) reveals.current.set(key, handle);
        else reveals.current.delete(key);
      };
      binders.current.set(key, binder);
    }
    return binder;
  }, []);

  return { bind, reveals };
}
