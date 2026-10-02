// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { tapeFromCover } from './tapeFromCover';
import { TAPE_SPRITE } from './tapeSprite';

// The shelf's tape from a cover: the template's cassette, with the cover
// printed on its insert.

const flat = (background: string) =>
  sharp({ create: { width: 750, height: 750, channels: 3, background } })
    .webp()
    .toBuffer();

/** The tape's pixels, decoded. */
async function pixels(tape: Buffer) {
  const { data, info } = await sharp(tape)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

/** The mean colour of a small square, read as [r, g, b]. */
function mean(data: Buffer, width: number, cx: number, cy: number) {
  const sum = [0, 0, 0];
  let count = 0;
  for (let y = cy - 4; y <= cy + 4; y++)
    for (let x = cx - 4; x <= cx + 4; x++) {
      const i = (y * width + x) * 4;
      for (let k = 0; k < 3; k++) sum[k] += data[i + k];
      count++;
    }
  return sum.map((total) => total / count);
}

describe('a tape from a cover', () => {
  it('is a WebP the size of every tape sprite, with its shadow kept', async () => {
    const tape = await tapeFromCover(await flat('#b1272b'));
    const { info } = await pixels(tape);
    expect((await sharp(tape).metadata()).format).toBe('webp');
    expect([info.width, info.height]).toEqual([
      TAPE_SPRITE.width,
      TAPE_SPRITE.height
    ]);
    expect(info.channels).toBe(4);
    expect(tape.length).toBeLessThan(1024 * 1024);
  });

  it('prints the cover on the insert, and leaves the shell as it is', async () => {
    const red = await pixels(await tapeFromCover(await flat('#d02020')));
    const blue = await pixels(await tapeFromCover(await flat('#2030d0')));
    const { width } = red.info;
    // On the insert, left of the reel window: the cover's colour shows.
    const insert = { x: 200, y: 420 };
    const onRed = mean(red.data, width, insert.x, insert.y);
    const onBlue = mean(blue.data, width, insert.x, insert.y);
    expect(onRed[0]).toBeGreaterThan(onRed[2] + 20);
    expect(onBlue[2]).toBeGreaterThan(onBlue[0] + 20);
    // The bottom of the shell, below the insert: the same either way.
    const shell = { x: 420, y: 900 };
    const a = mean(red.data, width, shell.x, shell.y);
    const b = mean(blue.data, width, shell.x, shell.y);
    for (let k = 0; k < 3; k++) expect(Math.abs(a[k] - b[k])).toBeLessThan(3);
  });
});
