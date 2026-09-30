// The site scrollbar's geometry, in pixels: the thumb is as long, of the
// track, as the screen is of the page, and as far down the track as the
// page is scrolled; dragging it runs the other way.

/** The shortest the thumb gets, so a long page still has one to grab. */
export const MIN_THUMB = 48;

export interface Thumb {
  size: number;
  offset: number;
}

interface Measure {
  /** The track's length. */
  track: number;
  /** The screen's height. */
  viewport: number;
  /** The page's height. */
  content: number;
  /** How far down it's scrolled. */
  scroll: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** The thumb for a scroll position, or null for a page with nothing to scroll. */
export function thumbFor({
  track,
  viewport,
  content,
  scroll
}: Measure): Thumb | null {
  const limit = content - viewport;
  if (track <= 0 || limit < 1) return null;
  const size = clamp((track * viewport) / content, MIN_THUMB, track);
  return { size, offset: (track - size) * clamp(scroll / limit, 0, 1) };
}

/** The scroll position for the thumb moved to an offset along the track. */
export function scrollFor({
  track,
  size,
  limit,
  offset
}: {
  track: number;
  size: number;
  /** The furthest it scrolls. */
  limit: number;
  offset: number;
}) {
  const room = track - size;
  if (room <= 0) return 0;
  return clamp(offset / room, 0, 1) * limit;
}
