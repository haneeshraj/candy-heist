import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// What the link previews (the Open Graph images) are drawn with: the
// brand's three faces as files (the image renderer can't use next/font),
// the site's photos and covers as data URLs (WebP covers turned into PNG
// first, which the renderer can read), and the vortex's path. Read once
// per build and reused.

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

/** A file under /public as a PNG data URL, resized to `width`. */
export async function imageDataUrl(publicPath: string, width: number) {
  const png = await sharp(join(root, 'public', publicPath))
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
