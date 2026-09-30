import { describe, expect, it } from 'vitest';
import { faceBox, ownBox, placeOver } from './flight';

const square = { left: 96, top: 150, width: 560, height: 560 };

describe('the viewer’s flight', () => {
  it('flies the cover from the whole square', () => {
    expect(faceBox(square, 'cover')).toEqual(square);
  });

  it('flies the canvas from the 9:16 strip down the square’s middle', () => {
    expect(faceBox(square, 'canvas')).toEqual({
      left: 96 + (560 - 315) / 2,
      top: 150,
      width: 315,
      height: 560
    });
  });

  it('places an element over another box, scaled about its corner', () => {
    const viewer = { left: 380, top: 112, width: 680, height: 680 };
    expect(placeOver(viewer, square)).toEqual({
      x: 96 - 380,
      y: 150 - 112,
      scale: 560 / 680
    });
  });

  it('finds an element’s own box from where it shows mid-flight', () => {
    const own = { left: 380, top: 112, width: 680, height: 680 };
    const { x, y, scale } = placeOver(own, square);
    // Halfway there: shown at the transform's box.
    const shown = {
      left: own.left + x / 2,
      top: own.top + y / 2,
      width: own.width * (1 + (scale - 1) / 2),
      height: own.height * (1 + (scale - 1) / 2)
    };
    const found = ownBox(shown, x / 2, y / 2, 1 + (scale - 1) / 2);
    expect(found.left).toBeCloseTo(own.left);
    expect(found.top).toBeCloseTo(own.top);
    expect(found.width).toBeCloseTo(own.width);
  });
});
