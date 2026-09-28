import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollTrigger } from './gsap';
import { revealStart } from './reveal';

function elementAt(top: number) {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
  return el;
}

describe('revealStart', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts when the element top passes 85% of the viewport', () => {
    vi.spyOn(ScrollTrigger, 'maxScroll').mockReturnValue(5000);
    vi.stubGlobal('innerHeight', 1000);
    // 2000 from the top of the page, minus 85% of a 1000 px viewport.
    expect(revealStart(elementAt(2000))()).toBe(1150);
  });

  it('never starts later than 1px before the end of the page', () => {
    vi.spyOn(ScrollTrigger, 'maxScroll').mockReturnValue(1000);
    vi.stubGlobal('innerHeight', 1000);
    expect(revealStart(elementAt(2000))()).toBe(999);
  });
});
