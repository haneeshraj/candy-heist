import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReleasePage } from '@/components/discography/ReleasePage';
import { discographyCopy } from '@/content/discography/discography';
import { getCatalogue } from '@/content/discography/getCatalogue';
import { findRelease } from '@/content/discography/releases';
import { moreLike } from '@/lib/discography/catalogue';
import { KIND_LABEL } from '@/lib/discography/format';
import { summarize } from '@/lib/discography/summary';
import { appearsOn } from '@/lib/discography/tracks';
import { fill } from '@/lib/text/fill';

// Every release page is built ahead of time, and made again each hour so
// one turns from its countdown to its platforms on the day. One Candy
// Haven sends later is made on its first visit; any other slug is a 404. (A single inside an album still has its page, though the
// grid shows only the album; so does each track that came out with an
// album, under the album's: see ./[track].)
export const revalidate = 3600;

export async function generateStaticParams() {
  const { releases } = await getCatalogue();
  return releases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata(
  props: PageProps<'/discography/[slug]'>
): Promise<Metadata> {
  const { releases } = await getCatalogue();
  const release = findRelease(releases, (await props.params).slug);
  if (!release) return {};
  const values = {
    title: release.title,
    artist: release.artist,
    kind: KIND_LABEL[release.kind].one.toLowerCase()
  };
  return {
    title: fill(discographyCopy.release.meta.title, values),
    description: fill(discographyCopy.release.meta.description, values)
  };
}

export default async function ReleaseRoute(
  props: PageProps<'/discography/[slug]'>
) {
  const { releases } = await getCatalogue();
  const release = findRelease(releases, (await props.params).slug);
  if (!release) notFound();
  // A Server Component, made once per revalidation: its clock's start.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <main>
      <ReleasePage
        copy={discographyCopy.release}
        forthcoming={discographyCopy.page.forthcoming}
        release={release}
        alsoOn={appearsOn(release, releases)}
        more={moreLike(release, releases).map((r) => summarize(r, now))}
        renderedAt={now}
      />
    </main>
  );
}
