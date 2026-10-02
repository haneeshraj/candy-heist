import { getCatalogue } from '@/content/discography/getCatalogue';
import { previewCopy } from '@/content/site/preview';
import { OG_SIZE } from '@/lib/og/cards';
import { releaseImage } from '@/lib/og/releaseImage';

// A share link's preview, the same as its release's: made with the page
// and again each hour, so a pre-save turns into Listen now on the day.
export const alt = previewCopy.release.alt;
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

export async function generateStaticParams() {
  const { releases } = await getCatalogue();
  return releases.map((release) => ({ slug: release.slug }));
}

export default async function Image({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  return releaseImage((await params).slug);
}
