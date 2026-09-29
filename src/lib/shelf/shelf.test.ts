import { describe, expect, it } from 'vitest';
import { TAPE_SPRITE } from './tapeSprite';
import {
  arrival,
  DESKTOP_SHELF,
  measureShelf,
  mod,
  placeTape,
  SHELF_FRONT
} from './shelf';

const m = measureShelf(1440, 760, DESKTOP_SHELF);

describe('measureShelf', () => {
  it('sizes the focused tape by width, capped by height', () => {
    const tall = measureShelf(1440, 1600, DESKTOP_SHELF);
    expect(tall.tapeWidth).toBeCloseTo(1440 * 0.44);
    // The desktop band (1440 × 760) is height-limited: the same 444 px tape
    // as the Figma frame's 640 band.
    const aspect = TAPE_SPRITE.width / TAPE_SPRITE.height;
    expect(m.tapeWidth).toBeCloseTo(760 * 0.522 * aspect);
    expect(m.tapeWidth).toBeCloseTo(444, 0);
  });

  it('puts the vanishing point up and to the right of the focus', () => {
    expect(m.vanish.x).toBeGreaterThan(m.focus.x);
    expect(m.vanish.y).toBeLessThan(m.focus.y);
  });
});

describe('placeTape', () => {
  it('lifts the focused tape and puts its centre over the focus', () => {
    const p = placeTape(0, m);
    expect(p.scale).toBe(1);
    expect(p.x + m.anchor.x).toBeCloseTo(m.focus.x);
    expect(p.y + m.anchor.y).toBeCloseTo(m.focus.y - m.lift);
  });

  it('spaces neighbours one step apart along the row at the focus', () => {
    const centre = (u: number) => {
      const p = placeTape(u, m);
      return { x: p.x + m.anchor.x * p.scale, y: p.y + m.anchor.y * p.scale };
    };
    // u = 1 sits a step up the row from the focus; what's left of the lift
    // that far out moves it by a pixel or two at most.
    const behind = centre(1);
    const dx = behind.x - m.focus.x;
    const dy = behind.y - m.focus.y;
    const along = dx * TAPE_SPRITE.rowDir.x + dy * TAPE_SPRITE.rowDir.y;
    expect(Math.abs(along - m.step)).toBeLessThan(2);
  });

  it('shrinks, darkens and draws tapes behind under those in front', () => {
    const near = placeTape(-1, m);
    const far = placeTape(4, m);
    expect(far.scale).toBeLessThan(1);
    expect(near.scale).toBeGreaterThan(1);
    expect(far.brightness).toBeLessThan(near.brightness);
    expect(far.zIndex).toBeLessThan(near.zIndex);
  });

  it('fades the ends of the row to black', () => {
    expect(placeTape(11, m).brightness).toBe(0);
    expect(placeTape(-SHELF_FRONT - 0.5, m).brightness).toBe(0);
  });
});

describe('arrival', () => {
  it('brings the front of the row in first', () => {
    expect(arrival(-1, 0)).toBe(0);
    expect(arrival(0.3, -SHELF_FRONT)).toBeGreaterThan(arrival(0.3, 5));
    expect(arrival(Infinity, 3)).toBe(1);
    expect(arrival(10, 3)).toBe(1);
  });
});

describe('mod', () => {
  it('wraps negative indices', () => {
    expect(mod(-1, 14)).toBe(13);
    expect(mod(15, 14)).toBe(1);
  });
});
