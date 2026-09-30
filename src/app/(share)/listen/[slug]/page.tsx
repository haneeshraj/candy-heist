import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SharePage } from '@/components/discography/SharePage';
import { discographyCopy } from '@/content/discography/discography';
import { findRelease, releases } from '@/content/discography/releases';
import { isOut } from '@/lib/discography/catalogue';
import { formatDate } from '@/lib/discography/format';
import { fill } from '@/lib/text/fill';

// A release's share link page, outside the site's navbar and footer: to
// play it once it's out, to pre-save it before. Built ahead of time and
// made again each hour, so it turns on the day.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return releases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata(
  props: PageProps<'/listen/[slug]'>
): Promise<Metadata> {
  const release = findRelease((await props.params).slug);
  if (!release) return {};
  const copy = discographyCopy.share.meta;
  const values = {
    title: release.title,
    artist: release.artist,
    date: release.date ? formatDate(release.date) : ''
  };
  const out = isOut(release, Date.now());
  return {
    title: fill(copy.title, values),
    description: fill(out ? copy.out : copy.soon, values)
  };
}

export default async function ListenRoute(props: PageProps<'/listen/[slug]'>) {
  const release = findRelease((await props.params).slug);
  if (!release) notFound();
  // A Server Component, made once per revalidation: its clock's start.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <SharePage copy={discographyCopy} release={release} renderedAt={now} />
  );
}
