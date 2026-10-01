// The geometry of the viewer's flight: the artwork leaves its place on the
// page, grows into the viewer, and on the way out goes back to it.

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The image size the page and the viewer both ask for, so the cover the
 * viewer flies in with is the one the page has already loaded.
 */
export const COVER_SIZES = '(min-width: 1024px) 560px, 92vw';

/**
 * The transform that puts an element whose own box is `from` over `to`,
 * scaled about its top left corner (the two are the same shape).
 */
export function placeOver(from: Box, to: Box) {
  return {
    x: to.left - from.left,
    y: to.top - from.top,
    scale: to.width / from.width
  };
}

/**
 * An element's own box, from where it shows (its bounding box) and the
 * transform it has on (x, y, scale about its top left corner): what a
 * flight measures from when it's turned back halfway.
 */
export function ownBox(shown: Box, x: number, y: number, scale: number): Box {
  return {
    left: shown.left - x,
    top: shown.top - y,
    width: shown.width / scale,
    height: shown.height / scale
  };
}
