import { ImageResponse } from 'next/og';
import { previewCopy } from '@/content/site/preview';
import { imageDataUrl, ogFonts, vortexPath } from '@/lib/og/assets';
import { OG_SIZE, SiteCard } from '@/lib/og/cards';

// The site's link preview, for every page without its own (the releases
// have theirs).
export const alt = previewCopy.site.alt;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  const [photo, mark, fonts] = await Promise.all([
    imageDataUrl('/img/home/landing-photo.jpeg', 1200),
    vortexPath(),
    ogFonts()
  ]);
  const { lead, statement, line, foot } = previewCopy.site;
  return new ImageResponse(
    <SiteCard
      photo={photo}
      mark={mark}
      lead={lead}
      statement={statement}
      line={line}
      foot={foot}
    />,
    { ...size, fonts }
  );
}
