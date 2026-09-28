import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMagnetic, type MagneticOptions } from './useMagnetic';

const { quickTo, setters } = vi.hoisted(() => {
  const setters: Array<ReturnType<typeof vi.fn>> = [];
  const quickTo = vi.fn(() => {
    const setter = vi.fn();
    setters.push(setter);
    return setter;
  });
  return { quickTo, setters };
});

vi.mock('@/lib/animation/gsap', () => ({
  gsap: { quickTo, killTweensOf: vi.fn(), set: vi.fn() }
}));

function mockMatchMedia({
  finePointer,
  reducedMotion
}: {
  finePointer: boolean;
  reducedMotion: boolean;
}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('pointer: fine')
      ? finePointer
      : query.includes('reduced-motion')
        ? reducedMotion
        : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

function Probe(options: MagneticOptions) {
  const { ref, innerRef } = useMagnetic<HTMLButtonElement, HTMLSpanElement>(
    options
  );
  return (
    <button ref={ref} data-testid="target">
      <span ref={innerRef} />
    </button>
  );
}

function renderProbe(options: MagneticOptions = {}) {
  render(<Probe {...options} />);
  const target = screen.getByTestId('target');
  target.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 100,
      height: 40,
      right: 100,
      bottom: 40,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }) as DOMRect;
  return target;
}

describe('useMagnetic', () => {
  beforeEach(() => {
    quickTo.mockClear();
    setters.length = 0;
  });

  it('follows the pointer by `strength`, and the inner content by `innerStrength`', () => {
    mockMatchMedia({ finePointer: true, reducedMotion: false });
    const target = renderProbe({ strength: 0.5, innerStrength: 0.25 });

    fireEvent.pointerMove(target, { clientX: 90, clientY: 30 });

    const [x, y, innerX, innerY] = setters;
    expect(x).toHaveBeenLastCalledWith(20);
    expect(y).toHaveBeenLastCalledWith(5);
    expect(innerX).toHaveBeenLastCalledWith(10);
    expect(innerY).toHaveBeenLastCalledWith(2.5);
  });

  it('eases everything back to rest when the pointer leaves', () => {
    mockMatchMedia({ finePointer: true, reducedMotion: false });
    const target = renderProbe();

    fireEvent.pointerMove(target, { clientX: 90, clientY: 30 });
    fireEvent.pointerLeave(target);

    setters.forEach((setter) => expect(setter).toHaveBeenLastCalledWith(0));
  });

  it('stays inert on touch devices', () => {
    mockMatchMedia({ finePointer: false, reducedMotion: false });
    renderProbe();
    expect(quickTo).not.toHaveBeenCalled();
  });

  it('stays inert when reduced motion is preferred', () => {
    mockMatchMedia({ finePointer: true, reducedMotion: true });
    renderProbe();
    expect(quickTo).not.toHaveBeenCalled();
  });

  it('stays inert when disabled', () => {
    mockMatchMedia({ finePointer: true, reducedMotion: false });
    renderProbe({ enabled: false });
    expect(quickTo).not.toHaveBeenCalled();
  });
});
