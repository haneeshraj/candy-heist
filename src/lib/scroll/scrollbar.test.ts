import { describe, expect, it } from 'vitest';
import { MIN_THUMB, scrollFor, thumbFor } from './scrollbar';

const page = { track: 800, viewport: 900, content: 3600 };

describe('thumbFor', () => {
  it('is as long, of the track, as the screen is of the page', () => {
    expect(thumbFor({ ...page, scroll: 0 })?.size).toBe(200);
  });

  it('runs from the top of the track to its foot as the page scrolls', () => {
    const limit = page.content - page.viewport;
    expect(thumbFor({ ...page, scroll: 0 })?.offset).toBe(0);
    expect(thumbFor({ ...page, scroll: limit / 2 })?.offset).toBe(300);
    expect(thumbFor({ ...page, scroll: limit })?.offset).toBe(600);
    // Past either end (a bounce), it stays on the track.
    expect(thumbFor({ ...page, scroll: limit + 90 })?.offset).toBe(600);
    expect(thumbFor({ ...page, scroll: -40 })?.offset).toBe(0);
  });

  it('keeps a thumb to grab on a very long page', () => {
    expect(thumbFor({ ...page, content: 90000, scroll: 0 })?.size).toBe(
      MIN_THUMB
    );
  });

  it('has none for a page with nothing to scroll', () => {
    expect(thumbFor({ ...page, content: 900, scroll: 0 })).toBeNull();
    expect(thumbFor({ ...page, track: 0, scroll: 0 })).toBeNull();
  });
});

describe('scrollFor', () => {
  it('turns a thumb offset back into the scroll, within the page', () => {
    const drag = { track: 800, size: 200, limit: 2700 };
    expect(scrollFor({ ...drag, offset: 300 })).toBe(1350);
    expect(scrollFor({ ...drag, offset: -50 })).toBe(0);
    expect(scrollFor({ ...drag, offset: 900 })).toBe(2700);
    expect(scrollFor({ ...drag, size: 800, offset: 10 })).toBe(0);
  });
});
