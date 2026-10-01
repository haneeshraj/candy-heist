import type { MetadataRoute } from 'next';
import { releases } from '@/content/discography/releases';
import { loadLore } from '@/content/lore/loadLore';
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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES,
    ...gridReleases(releases).map((release) => `/discography/${release.slug}`),
    ...albumTracks(releases).map(
      ({ release, track }) => `/discography/${release.slug}/${track.slug}`
    ),
    ...loadLore().chapters.map((chapter) => `/lore/${chapter.slug}`)
  ].map((path) => ({ url: absolute(path) }));
}
