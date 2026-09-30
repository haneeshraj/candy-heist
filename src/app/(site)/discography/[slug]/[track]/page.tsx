import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReleasePage } from '@/components/discography/ReleasePage';
import { discographyCopy } from '@/content/discography/discography';
import { releases } from '@/content/discography/releases';
import { moreLike } from '@/lib/discography/catalogue';
import { summarize } from '@/lib/discography/summary';
import { albumTracks, findAlbumTrack } from '@/lib/discography/tracks';
import { fill } from '@/lib/text/fill';

// A track's own page: one that came out with its album (or EP, or
// compilation), in the album's cover. The grid never lists it; the album's
// running order leads here. Built ahead of time and made again each hour,
// as the album's page is; any other track is a 404.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return albumTracks(releases).map(({ release, track }) => ({
    slug: release.slug,
    track: track.slug
  }));
}

export async function generateMetadata(
  props: PageProps<'/discography/[slug]/[track]'>
): Promise<Metadata> {
  const { slug, track } = await props.params;
  const found = findAlbumTrack(releases, slug, track);
  if (!found) return {};
  const values = {
    title: found.track.title,
    artist: found.track.artist ?? found.release.artist,
    release: found.release.title
  };
  return {
    title: fill(discographyCopy.release.meta.title, values),
    description: fill(discographyCopy.release.meta.track, values)
  };
}

export default async function TrackRoute(
  props: PageProps<'/discography/[slug]/[track]'>
) {
  const { slug, track } = await props.params;
  const found = findAlbumTrack(releases, slug, track);
  if (!found) notFound();
  // A Server Component, made once per revalidation: its clock's start.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <main>
      <ReleasePage
        copy={discographyCopy.release}
        forthcoming={discographyCopy.page.forthcoming}
        release={found.release}
        position={found.position}
        more={moreLike(found.release, releases).map((r) => summarize(r, now))}
        renderedAt={now}
      />
    </main>
  );
}
