import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  it('queries prefers-reduced-motion and reflects its match state', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)'
    );
  });

  it('is false when the user has no reduced-motion preference', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });
});
