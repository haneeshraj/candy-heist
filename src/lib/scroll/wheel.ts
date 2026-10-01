import type { VirtualScrollData } from 'lenis';

// The page's wheel goes through here before Lenis scrolls it (SmoothScroll
// gives `passWheel` to Lenis as its virtualScroll). Whatever needs to steer
// it, like the footer's landing, sets one steer at a time: it can change
// the event's delta, or return false to take the event (preventing its
// default itself, as Lenis then leaves it alone).

export type WheelSteer = (data: VirtualScrollData) => boolean;

let steer: WheelSteer | null = null;

/** Steers the wheel until the returned function is called. */
export function steerWheel(next: WheelSteer) {
  steer = next;
  return () => {
    if (steer === next) steer = null;
  };
}

/** For Lenis: lets the wheel through, unless the steer takes it. */
export function passWheel(data: VirtualScrollData) {
  return steer ? steer(data) : true;
}
