import 'server-only';
import { cache } from 'react';
import { shelfOf } from '@/lib/discography/catalogue';
import { readPublishedReleases } from '@/lib/releases/published';
import { fileReleases, type Release } from './releases';

// The catalogue the pages show. Until Candy Haven's RELEASES publishes
// everything, the site's own releases.json; from then on, only what Haven
// sent, whole: the two never mix.

export interface Catalogue {
  releases: Release[];
  /** The home page shelf: up to eight releases, in order. */
  shelf: Release[];
}

export const getCatalogue = cache(async (): Promise<Catalogue> => {
  const published = await readPublishedReleases();
  if (!published)
    return { releases: fileReleases, shelf: shelfOf(fileReleases) };
  return {
    releases: published.releases,
    shelf: shelfOf(published.releases, published.shelf)
  };
});
