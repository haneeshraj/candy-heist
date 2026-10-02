import { ImageResponse } from 'next/og';
import { getCatalogue } from '@/content/discography/getCatalogue';
import { findRelease } from '@/content/discography/releases';
import { previewCopy } from '@/content/site/preview';
import { isOut, yearOf } from '@/lib/discography/catalogue';
import { KIND_LABEL, formatDate } from '@/lib/discography/format';
import { artistLine } from '@/lib/discography/summary';
import { findAlbumTrack } from '@/lib/discography/tracks';
import { fill } from '@/lib/text/fill';
import { imageDataUrl, ogFonts, vortexPath } from './assets';
import { OG_SIZE, ReleaseCard } from './cards';

const copy = previewCopy.release;

/**
 * A release's link preview, or one of its album tracks': the cover, what
 * it is (its kind and year, or the day it's out), the title, the artist,
 * and Listen now or Pre-save.
 */
export async function releaseImage(slug: string, trackSlug?: string) {
  const { releases } = await getCatalogue();
  const release = findRelease(releases, slug);
  const found = trackSlug ? findAlbumTrack(releases, slug, trackSlug) : null;
  if (!release || (trackSlug && !found))
    return new Response('Not found', { status: 404 });

  const out = isOut(release, Date.now());
  const year = yearOf(release);
  const what = found
    ? fill(copy.track, { n: String(found.position).padStart(2, '0') })
    : KIND_LABEL[release.kind].one;
  const meta = out
    ? [what, year].filter(Boolean).join(' · ')
    : release.date
      ? fill(copy.out, { date: formatDate(release.date) })
      : copy.forthcoming;

  const [cover, mark, fonts] = await Promise.all([
    imageDataUrl(release.cover.src, 932),
    vortexPath(),
    ogFonts()
  ]);

  return new ImageResponse(
    <ReleaseCard
      cover={cover}
      mark={mark}
      meta={meta}
      title={found ? found.track.title : release.title}
      artist={found?.track.artist ?? artistLine(release)}
      from={found ? fill(copy.from, { title: release.title }) : undefined}
      action={out ? copy.listen : copy.presave}
    />,
    { ...OG_SIZE, fonts }
  );
}
