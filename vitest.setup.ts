import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom has no matchMedia implementation; useMediaQuery/useReducedMotion call
// it unconditionally on every render, so any test that mounts a component
// using them needs at least a non-throwing default. Tests that care about a
// specific match state override this themselves (see useMediaQuery.test.ts).
// Server tests run in plain Node, with no window to give it to.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
}

// jsdom has no IntersectionObserver either, and useInView constructs one
// unconditionally regardless of a component's `trigger` prop. This stub just
// keeps that construction from throwing; tests exercising the inView
// transition itself install a callback-capturing mock (see useInView.test.ts).
class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!('IntersectionObserver' in globalThis)) {
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
