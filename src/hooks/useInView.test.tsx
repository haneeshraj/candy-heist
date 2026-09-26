import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useInView } from './useInView';

let capturedCallback: IntersectionObserverCallback | null = null;
let observeSpy: Mock<(target: Element) => void>;
let disconnectSpy: Mock<() => void>;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe: (target: Element) => void;
  unobserve = vi.fn();
  disconnect: () => void;

  constructor(callback: IntersectionObserverCallback) {
    capturedCallback = callback;
    this.observe = observeSpy;
    this.disconnect = disconnectSpy;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function Probe() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return <div ref={ref} data-testid="target" data-in-view={inView} />;
}

describe('useInView', () => {
  beforeEach(() => {
    capturedCallback = null;
    observeSpy = vi.fn<(target: Element) => void>();
    disconnectSpy = vi.fn<() => void>();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('starts out of view and observes the attached node', () => {
    render(<Probe />);
    expect(screen.getByTestId('target').dataset.inView).toBe('false');
    expect(observeSpy).toHaveBeenCalledWith(screen.getByTestId('target'));
  });

  it('flips to inView once the node intersects, then disconnects', () => {
    render(<Probe />);

    act(() => {
      capturedCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByTestId('target').dataset.inView).toBe('true');
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('ignores a non-intersecting entry', () => {
    render(<Probe />);

    act(() => {
      capturedCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByTestId('target').dataset.inView).toBe('false');
    expect(disconnectSpy).not.toHaveBeenCalled();
  });
});
