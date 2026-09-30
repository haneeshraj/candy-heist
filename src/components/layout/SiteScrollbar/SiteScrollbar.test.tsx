import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SiteScrollbar from './SiteScrollbar';

// jsdom lays nothing out: the bar, the screen and the page get their sizes
// here, and a frame runs at once.
function measure(track: number, content: number) {
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: Element) {
      return this.getAttribute('aria-hidden') === 'true' ? track : 0;
    }
  );
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(
    function (this: Element) {
      return this === document.documentElement ? content : 0;
    }
  );
}

function scrollWindow(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  fireEvent.scroll(window);
}

const bar = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((draw) => {
    draw(0);
    return 1;
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 900
  });
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.setPointerCapture = vi.fn();
  scrollWindow(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('SiteScrollbar', () => {
  it('stays out of sight with nothing to scroll, and out of the accessibility tree', () => {
    measure(800, 900);
    const { container } = render(<SiteScrollbar />);
    expect(bar(container)).toHaveAttribute('aria-hidden', 'true');
    expect(bar(container)).toHaveAttribute('data-hidden');
  });

  it('sizes the thumb by the page and moves it with the scroll, bright while it moves', () => {
    measure(800, 3600);
    const { container } = render(<SiteScrollbar />);
    const el = bar(container);
    expect(el).not.toHaveAttribute('data-hidden');
    expect(el.style.getPropertyValue('--thumb-size')).toBe('200px');
    expect(el.style.getPropertyValue('--thumb-offset')).toBe('0px');

    scrollWindow(1350);
    expect(el.style.getPropertyValue('--thumb-offset')).toBe('300px');
    expect(el).toHaveAttribute('data-active');
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(el).not.toHaveAttribute('data-active');
  });

  it('drags the page with the thumb', () => {
    measure(800, 3600);
    const { container } = render(<SiteScrollbar />);
    const el = bar(container);
    const thumb = el.firstElementChild as HTMLElement;

    fireEvent.pointerDown(thumb, { button: 0, pointerId: 1, clientY: 100 });
    expect(el).toHaveAttribute('data-dragging');
    fireEvent.pointerMove(thumb, { pointerId: 1, clientY: 400 });
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: 1350,
      behavior: 'instant'
    });
    fireEvent.pointerUp(thumb, { pointerId: 1, clientY: 400 });
    expect(el).not.toHaveAttribute('data-dragging');
  });

  it('goes where the line is clicked, the thumb centred there', () => {
    measure(800, 3600);
    const { container } = render(<SiteScrollbar />);
    fireEvent.pointerDown(bar(container), {
      button: 0,
      pointerId: 1,
      clientY: 500
    });
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: 1800,
      behavior: 'smooth'
    });
  });
});
