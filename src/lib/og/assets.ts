import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// What the link previews (the Open Graph images) are drawn with: the
// brand's three faces as files (the image renderer can't use next/font),
// the site's photos and covers as data URLs (WebP covers turned into PNG
// first, which the renderer can read; a cover in storage fetched first),
// and the vortex's path. Read once per build and reused.

const root = process.cwd();
const font = (file: string) => readFile(join(root, 'src/assets/fonts', file));

let fontsOnce: ReturnType<typeof loadFonts> | null = null;

async function loadFonts() {
  const [archivo, mono, cormorant] = await Promise.all([
    font('Archivo-SemiBold.ttf'),
    font('IBMPlexMono-Medium.ttf'),
    font('CormorantGaramond-Italic.ttf')
  ]);
  return [
    {
      name: 'Archivo',
      data: archivo,
      weight: 600 as const,
      style: 'normal' as const
    },
    {
      name: 'Plex Mono',
      data: mono,
      weight: 500 as const,
      style: 'normal' as const
    },
    {
      name: 'Cormorant',
      data: cormorant,
      weight: 400 as const,
      style: 'italic' as const
    }
  ];
}

export const ogFonts = () => (fontsOnce ??= loadFonts());

/** How long a cover in storage has to arrive before the preview gives up on it. */
const FETCH_TIMEOUT_MS = 8000;

/** An image online, as bytes. */
async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
  return Buffer.from(await response.arrayBuffer());
}

/**
 * A file under /public, or an image online (a cover in storage), as a PNG
 * data URL, resized to `width`.
 */
export async function imageDataUrl(src: string, width: number) {
  const input = /^https?:\/\//.test(src)
    ? await fetchImage(src)
    : join(root, 'public', src);
  const png = await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

let markOnce: Promise<string> | null = null;

/** The vortex's one path, from the brand file. */
export function vortexPath() {
  return (markOnce ??= readFile(
    join(root, 'public/img/brand/vortex.svg'),
    'utf8'
  ).then((svg) => /\sd="([^"]+)"/.exec(svg)?.[1] ?? ''));
}
