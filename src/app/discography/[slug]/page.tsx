import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReleasePlaceholder from '@/components/discography/ReleasePlaceholder';
import { findRelease, releases } from '@/content/discography/releases';

// Every release page is built ahead of time; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return releases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata(
  props: PageProps<'/discography/[slug]'>
): Promise<Metadata> {
  const release = findRelease((await props.params).slug);
  if (!release) return {};
  return {
    title: `${release.title} · Candy Heist`,
    description: `${release.title} by ${release.artist}.`
  };
}

// Placeholder until the release page is designed.
export default async function ReleasePage(
  props: PageProps<'/discography/[slug]'>
) {
  const release = findRelease((await props.params).slug);
  if (!release) notFound();
  return <ReleasePlaceholder release={release} />;
}
