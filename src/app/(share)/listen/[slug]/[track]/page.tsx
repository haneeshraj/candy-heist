import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SharePage } from '@/components/discography/SharePage';
import { discographyCopy } from '@/content/discography/discography';
import { getCatalogue } from '@/content/discography/getCatalogue';
import { isOut } from '@/lib/discography/catalogue';
import { formatDate } from '@/lib/discography/format';
import { albumTracks, findAlbumTrack } from '@/lib/discography/tracks';
import { fill } from '@/lib/text/fill';

// A track's share link page: the track, in its release's cover, to play
// once the release is out and to pre-save before. Built ahead of time (or
// on its first visit, for a release Candy Haven sends later) and made
// again each hour, as the release's is.
export const revalidate = 3600;

export async function generateStaticParams() {
  const { releases } = await getCatalogue();
  return albumTracks(releases).map(({ release, track }) => ({
    slug: release.slug,
    track: track.slug
  }));
}

export async function generateMetadata(
  props: PageProps<'/listen/[slug]/[track]'>
): Promise<Metadata> {
  const { releases } = await getCatalogue();
  const { slug, track } = await props.params;
  const found = findAlbumTrack(releases, slug, track);
  if (!found) return {};
  const copy = discographyCopy.share.meta;
  const { release } = found;
  const values = {
    title: found.track.title,
    artist: found.track.artist ?? release.artist,
    date: release.date ? formatDate(release.date) : ''
  };
  const out = isOut(release, Date.now());
  return {
    title: fill(copy.title, values),
    description: fill(out ? copy.out : copy.soon, values)
  };
}

export default async function ListenTrackRoute(
  props: PageProps<'/listen/[slug]/[track]'>
) {
  const { releases } = await getCatalogue();
  const { slug, track } = await props.params;
  const found = findAlbumTrack(releases, slug, track);
  if (!found) notFound();
  // A Server Component, made once per revalidation: its clock's start.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <SharePage
      copy={discographyCopy}
      release={found.release}
      position={found.position}
      renderedAt={now}
    />
  );
}
