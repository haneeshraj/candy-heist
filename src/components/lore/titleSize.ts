// How wide each capital sets in the titles' face (Archivo 600, spaced
// 0.06em), in ems: M and W wide, the rounds a little less, I and J
// narrow, the rest about two thirds of an em.
function capitalWidth(letter: string) {
  if (/[MW]/.test(letter)) return 0.92;
  if (/[OQCGD]/.test(letter)) return 0.78;
  if (/[IJ]/.test(letter)) return 0.3;
  return 0.66;
}

const SPACING = 0.06;
// Room to spare, for the estimate.
const SAFETY = 0.94;

/**
 * The font size, in design pixels, that sets a title's longest word
 * across `column` design pixels at most, and no larger than `max`.
 */
export function titleSize(title: string, column: number, max: number) {
  const widest = Math.max(
    ...title
      .toUpperCase()
      .split(/\s+/)
      .map((word) =>
        [...word].reduce((em, letter) => em + capitalWidth(letter) + SPACING, 0)
      )
  );
  return Math.min(max, (column * SAFETY) / widest);
}
