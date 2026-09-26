import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let changeListeners: Array<(event: MediaQueryListEvent) => void>;
  let mql: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    changeListeners = [];
    mql = {
      matches: false,
      addEventListener: vi.fn((_event, listener) =>
        changeListeners.push(listener)
      ),
      removeEventListener: vi.fn()
    };
    window.matchMedia = vi.fn().mockReturnValue(mql);
  });

  it("reflects the query's initial match state", () => {
    mql.matches = true;
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('updates when the media query change event fires', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);

    mql.matches = true;
    act(() => {
      changeListeners.forEach((listener) =>
        listener({} as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);
  });

  it('unsubscribes from the previous query on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});
