import { describe, expect, it } from 'vitest';
import { createLanding, NEW_SCROLL } from './landing';

const LANDING = 2000;

// A landing, landed on: one notch from just above it.
function landed() {
  const landing = createLanding();
  const first = landing.wheel({
    delta: 100,
    at: 0,
    target: 1950,
    current: 1950,
    landing: LANDING
  });
  return { landing, first };
}

describe('createLanding', () => {
  it('lets the page scroll as usual above its end', () => {
    const landing = createLanding();
    expect(
      landing.wheel({
        delta: 100,
        at: 0,
        target: 1000,
        current: 1000,
        landing: LANDING
      })
    ).toEqual({ kind: 'pass' });
  });

  it('comes to rest exactly at the end, however big the scroll', () => {
    const landing = createLanding();
    expect(
      landing.wheel({
        delta: 900,
        at: 0,
        target: 1500,
        current: 1400,
        landing: LANDING
      })
    ).toEqual({ kind: 'land', delta: 500 });
  });

  it('lands on a scroll that reaches the end exactly, and holds the next', () => {
    const landing = createLanding();
    expect(
      landing.wheel({
        delta: 100,
        at: 0,
        target: 1900,
        current: 1900,
        landing: LANDING
      })
    ).toEqual({ kind: 'land', delta: 100 });
    expect(
      landing.wheel({
        delta: 100,
        at: 50,
        target: LANDING,
        current: 1960,
        landing: LANDING
      })
    ).toEqual({ kind: 'hold' });
  });

  it('holds there while it settles, then a new scroll carries on', () => {
    const { landing, first } = landed();
    expect(first).toEqual({ kind: 'land', delta: 50 });
    // Still easing in: held.
    expect(
      landing.wheel({
        delta: 100,
        at: 300,
        target: LANDING,
        current: 1990,
        landing: LANDING
      })
    ).toEqual({ kind: 'hold' });
    // At rest, after a pause: on into the footer.
    expect(
      landing.wheel({
        delta: 100,
        at: 300 + NEW_SCROLL + 20,
        target: LANDING,
        current: LANDING,
        landing: LANDING
      })
    ).toEqual({ kind: 'pass' });
  });

  it('holds the scroll that brought it there, however long it goes on', () => {
    const { landing } = landed();
    // A wheel still turning, no pause between its notches.
    for (let at = 40; at < 3000; at += 40) {
      expect(
        landing.wheel({
          delta: 100,
          at,
          target: LANDING,
          current: LANDING,
          landing: LANDING
        })
      ).toEqual({ kind: 'hold' });
    }
  });

  it('doesn’t let a fling’s momentum carry through', () => {
    const { landing } = landed();
    let delta = 90;
    for (let at = 16; at < 2000; at += 16) {
      delta = Math.max(1, delta * 0.96);
      expect(
        landing.wheel({
          delta,
          at,
          target: LANDING,
          current: LANDING,
          landing: LANDING
        })
      ).toEqual({ kind: 'hold' });
    }
  });

  it('frees the way up, and lands again on the way back down', () => {
    const { landing } = landed();
    expect(
      landing.wheel({
        delta: -100,
        at: 40,
        target: LANDING,
        current: LANDING,
        landing: LANDING
      })
    ).toEqual({ kind: 'pass' });
    expect(
      landing.wheel({
        delta: 200,
        at: 80,
        target: 1900,
        current: 1900,
        landing: LANDING
      })
    ).toEqual({ kind: 'land', delta: 100 });
  });

  it('lets go once the page has moved off it some other way', () => {
    const { landing } = landed();
    // Another page, scrolled to its top: the first scroll isn't held.
    expect(
      landing.wheel({ delta: 100, at: 40, target: 0, current: 0, landing: 900 })
    ).toEqual({ kind: 'pass' });
  });

  it('doesn’t hold a page that starts at its end', () => {
    const landing = createLanding();
    expect(
      landing.wheel({ delta: 100, at: 0, target: 0, current: 0, landing: 0 })
    ).toEqual({ kind: 'pass' });
  });
});
