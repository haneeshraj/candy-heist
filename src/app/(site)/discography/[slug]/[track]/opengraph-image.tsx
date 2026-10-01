import { releases } from '@/content/discography/releases';
import { previewCopy } from '@/content/site/preview';
import { albumTracks } from '@/lib/discography/tracks';
import { OG_SIZE } from '@/lib/og/cards';
import { releaseImage } from '@/lib/og/releaseImage';

// An album track's link preview, in its album's cover.
export const alt = previewCopy.release.alt;
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

export function generateStaticParams() {
  return albumTracks(releases).map(({ release, track }) => ({
    slug: release.slug,
    track: track.slug
  }));
}

export default async function Image({
  params
}: {
  params: Promise<{ slug: string; track: string }>;
}) {
  const { slug, track } = await params;
  return releaseImage(slug, track);
}
