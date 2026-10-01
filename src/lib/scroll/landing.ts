// The landing at a page's end: scrolling down comes to rest exactly there,
// the page's end on the foot of the screen, and carries on into the footer
// only with a new scroll. The one that brought it there stops there,
// however long it goes on (a wheel still turning, a swipe's momentum);
// once it's at rest, the next scroll, after a pause, goes on. Pure: the
// footer feeds it each wheel event.

/** A pause this long (ms) between wheel events starts a new scroll. */
export const NEW_SCROLL = 180;

export interface WheelStep {
  /** The wheel's pixels down (negative is up). */
  delta: number;
  /** When it came, in ms. */
  at: number;
  /** Where the scroll is headed (Lenis's target). */
  target: number;
  /** Where the scroll is now. */
  current: number;
  /** Where the page's end comes to rest. */
  landing: number;
}

/** Let it scroll, scroll by `delta` instead (to land), or hold it. */
export type WheelResult =
  { kind: 'pass' } | { kind: 'land'; delta: number } | { kind: 'hold' };

const PASS: WheelResult = { kind: 'pass' };

export function createLanding() {
  let landed = false;
  let lastAt = -Infinity;

  return {
    wheel({ delta, at, target, current, landing }: WheelStep): WheelResult {
      const fresh = at - lastAt > NEW_SCROLL;
      lastAt = at;

      // Up is always free, and leaves the landing. So does having moved
      // off it some other way (the keyboard, the scrollbar, a link to
      // another page).
      if (delta <= 0 || Math.abs(target - landing) > 1) landed = false;
      if (delta <= 0) return PASS;

      if (landed) {
        const resting = Math.abs(current - landing) < 1;
        if (!(resting && fresh)) return { kind: 'hold' };
        landed = false;
        return PASS;
      }

      // Coming down from above to it, or past it: land on it exactly.
      if (target < landing - 1 && target + delta > landing - 1) {
        landed = true;
        return { kind: 'land', delta: landing - target };
      }
      return PASS;
    }
  };
}
