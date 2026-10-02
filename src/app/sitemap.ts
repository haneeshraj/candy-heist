import type { MetadataRoute } from 'next';
import { releases } from '@/content/discography/releases';
import { getLore } from '@/content/lore/getLore';
import { gridReleases } from '@/lib/discography/catalogue';
import { albumTracks } from '@/lib/discography/tracks';
import { absolute } from '@/lib/site/url';

// Every page worth finding: the site's own, each release and album track,
// and each chapter of the lore. The share links (/listen) are left out:
// they're the release pages again, for sharing.
const PAGES = [
  '/',
  '/about',
  '/services',
  '/services/producer',
  '/services/dj',
  '/discography',
  '/lore',
  '/contact',
  '/terms'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lore = await getLore();
  return [
    ...PAGES,
    ...gridReleases(releases).map((release) => `/discography/${release.slug}`),
    ...albumTracks(releases).map(
      ({ release, track }) => `/discography/${release.slug}/${track.slug}`
    ),
    ...lore.chapters.map((chapter) => `/lore/${chapter.slug}`)
  ].map((path) => ({ url: absolute(path) }));
}
