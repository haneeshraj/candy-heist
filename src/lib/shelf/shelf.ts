import { TAPE_SPRITE } from './tapeSprite';

// The shelf's geometry, as pure functions. Every tape image sits somewhere
// along one diagonal line, and that one number (its offset `u` from the
// focus, in tapes) decides everything else: where it sits on a perspective
// line converging up and to the right, how big it is, how dark (fog to
// black, never transparency: the tapes are solid), what it overlaps, and
// how far it lifts as it passes the focus. The images never change; that's
// the 2.5D trick.

export interface ShelfLayout {
  /** Width of the focused tape, as a fraction of the shelf's width… */
  width: number;
  /** …capped so its height stays within this fraction of the shelf's height. */
  height: number;
  /** Distance between neighbours at the focus, in tape widths. */
  step: number;
  /** How far the focused tape rises, in tape widths. */
  lift: number;
  /** How fast tapes shrink with depth. */
  falloff: number;
  /** Where the focused tape's centre sits, in fractions of the shelf. */
  focus: { x: number; y: number };
}

/** Tapes drawn in front of the focus, and behind it. */
export const SHELF_FRONT = 6;
export const SHELF_BEHIND = 10;
/** Enough elements to draw every visible tape, recycled as the shelf moves. */
export const SHELF_POOL = SHELF_FRONT + SHELF_BEHIND + 2;
/** How many neighbours share the lift, as a gaussian's width in tapes. */
const LIFT_WIDTH = 0.34;
/** Seconds the intro's arrival takes per tape, and between tapes. */
const ARRIVE_DURATION = 0.6;
const ARRIVE_STAGGER = 0.045;
export const INTRO_SECONDS =
  ARRIVE_DURATION + ARRIVE_STAGGER * (SHELF_FRONT + SHELF_BEHIND + 2);

// Tuned against the Figma v3 frames: 1440 × 640 desktop band, 390 × 460 phone.
export const DESKTOP_SHELF: ShelfLayout = {
  width: 0.44,
  height: 0.62,
  step: 0.29,
  lift: 0.23,
  falloff: 0.075,
  focus: { x: 0.52, y: 0.56 }
};

export const MOBILE_SHELF: ShelfLayout = {
  width: 0.64,
  height: 0.6,
  step: 0.29,
  lift: 0.23,
  falloff: 0.075,
  focus: { x: 0.5, y: 0.58 }
};

export interface ShelfMetrics {
  /** Rendered width of a tape image at scale 1 (the focus), in px. */
  tapeWidth: number;
  step: number;
  lift: number;
  falloff: number;
  /** The focus point, and the vanishing point the row converges on. */
  focus: { x: number; y: number };
  vanish: { x: number; y: number };
  /** The shell's centre within the image, in px at scale 1. */
  anchor: { x: number; y: number };
}

export interface TapePlacement {
  /** Top-left of the image, in px, before `scale` (origin top left). */
  x: number;
  y: number;
  scale: number;
  zIndex: number;
  /** Depth fog: 1 at the focus, darker (towards black) further back. */
  fog: number;
  /** 0 to 1: the row's two ends, and the intro's arrival, fade tapes out. */
  fade: number;
  /** Both together: how light the tape reads, 0 (gone) to 1. */
  brightness: number;
}

export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));
export const mod = (n: number, m: number) => ((n % m) + m) % m;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function measureShelf(
  width: number,
  height: number,
  layout: ShelfLayout,
  sprite = TAPE_SPRITE
): ShelfMetrics {
  const aspect = sprite.width / sprite.height;
  const tapeWidth = Math.min(
    width * layout.width,
    height * layout.height * aspect
  );
  const step = tapeWidth * layout.step;
  const focus = { x: width * layout.focus.x, y: height * layout.focus.y };
  // Placed so that neighbours at the focus sit exactly `step` apart.
  const reach = (step * (1 + layout.falloff)) / layout.falloff;
  return {
    tapeWidth,
    step,
    lift: tapeWidth * layout.lift,
    falloff: layout.falloff,
    focus,
    vanish: {
      x: focus.x + sprite.rowDir.x * reach,
      y: focus.y + sprite.rowDir.y * reach
    },
    anchor: {
      x: sprite.anchor.x * tapeWidth,
      y: sprite.anchor.y * (tapeWidth / aspect)
    }
  };
}

/**
 * How far into its arrival a tape is, `seconds` into the intro: they arrive
 * front to back. 1 means in place.
 */
export function arrival(seconds: number, u: number) {
  if (seconds === Infinity) return 1;
  if (seconds < 0) return 0;
  return easeOut(
    clamp((seconds - (u + SHELF_FRONT) * ARRIVE_STAGGER) / ARRIVE_DURATION)
  );
}

/** Where the tape `u` tapes from the focus goes, `arrive` of the way in. */
export function placeTape(
  u: number,
  m: ShelfMetrics,
  arrive = 1,
  rowDir = TAPE_SPRITE.rowDir
): TapePlacement {
  const scale = 1 / (1 + m.falloff * u);
  let x = m.vanish.x + (m.focus.x - m.vanish.x) * scale;
  let y = m.vanish.y + (m.focus.y - m.vanish.y) * scale;
  y -= m.lift * Math.exp(-(u * u) / (2 * LIFT_WIDTH ** 2)) * scale;

  // Arriving tapes slide in from further up the row.
  const offset = (1 - arrive) * m.step * 1.5 * scale;
  x += rowDir.x * offset;
  y += rowDir.y * offset;

  const fog =
    u > 0 ? Math.max(0.1, 1 - u * 0.095) : Math.max(0.62, 1 + u * 0.05);
  const fade =
    clamp((SHELF_BEHIND + 1 - u) / 2.2) *
    clamp((u + SHELF_FRONT + 0.5) / 1.2) *
    arrive;

  return {
    x: x - m.anchor.x * scale,
    y: y - m.anchor.y * scale,
    scale,
    zIndex: 1000 - Math.round(u * 10),
    fog,
    fade,
    brightness: fog * fade
  };
}
