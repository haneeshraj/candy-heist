import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// A release's tape for the home page shelf: the lab's worn cassette with
// the release's own cover printed on its insert, where the placeholder's
// art is.
//
// The template is that cassette rendered twice in the lab
// (cassette-test/tape-shelf, the "image" cover style), once with a black
// cover and once with a white one, from the camera every tape sprite
// shares (tapeSprite.ts):
//
//   base.webp          the tape with a black cover
//   transmission.webp  white minus black: how much of the cover shows at
//                      each pixel, through the shade, grain and plastic;
//                      transparent where none does
//   template.json      where each pixel lands on the cover (a homography)
//
// Laying a cover in is then base + transmission × cover, pixel by pixel.

const DIR = path.join(process.cwd(), 'src/lib/shelf/tape-template');

/** The tape, as the shelf's sprites are: a WebP with its shadow kept. */
const TAPE_QUALITY = 82;

interface Template {
  width: number;
  height: number;
  base: Buffer;
  light: Buffer;
  h: number[];
}

let template: Promise<Template> | null = null;

async function load(): Promise<Template> {
  const raw = (file: string) =>
    sharp(path.join(DIR, file)).ensureAlpha().raw().toBuffer();
  const [base, light, json] = await Promise.all([
    raw('base.webp'),
    raw('transmission.webp'),
    readFile(path.join(DIR, 'template.json'), 'utf8')
  ]);
  const { width, height, homography } = JSON.parse(json) as {
    width: number;
    height: number;
    homography: number[];
  };
  return { width, height, base, light, h: homography };
}

/**
 * The tape with this cover on it, from a cover the site has already made
 * (any square image sharp reads): a WebP the size of every tape sprite.
 */
export async function tapeFromCover(cover: Buffer): Promise<Buffer> {
  const { width, height, base, light, h } = await (template ??= load().catch(
    (error) => {
      template = null;
      throw error;
    }
  ));
  const { data: art, info } = await sharp(cover)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = info.width;
  const m = info.height;

  const out = Buffer.from(base);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Only the insert carries any cover; the rest is the shell as drawn.
      if (light[i + 3] === 0) continue;
      const d = h[6] * x + h[7] * y + h[8];
      const u = (h[0] * x + h[1] * y + h[2]) / d;
      const v = (h[3] * x + h[4] * y + h[5]) / d;
      // Bilinear, inside the cover's edge.
      const fx = Math.min(Math.max(u * n - 0.5, 0), n - 1.001);
      const fy = Math.min(Math.max(v * m - 0.5, 0), m - 1.001);
      const x0 = fx | 0;
      const y0 = fy | 0;
      const ax = fx - x0;
      const ay = fy - y0;
      const a = (y0 * n + x0) * 3;
      const b = a + 3;
      const c = a + n * 3;
      const e = c + 3;
      for (let k = 0; k < 3; k++) {
        const top = art[a + k] * (1 - ax) + art[b + k] * ax;
        const bottom = art[c + k] * (1 - ax) + art[e + k] * ax;
        const shown = top * (1 - ay) + bottom * ay;
        out[i + k] = Math.min(
          255,
          Math.round(base[i + k] + (light[i + k] * shown) / 255)
        );
      }
    }
  }

  return sharp(out, { raw: { width, height, channels: 4 } })
    .webp({ quality: TAPE_QUALITY, alphaQuality: 90, effort: 6 })
    .toBuffer();
}
