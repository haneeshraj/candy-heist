import type { Metadata } from 'next';
import { DiscographyPage } from '@/components/discography/DiscographyPage';
import { discographyCopy } from '@/content/discography/discography';
import { getCatalogue } from '@/content/discography/getCatalogue';
import { gridReleases } from '@/lib/discography/catalogue';
import { summarize } from '@/lib/discography/summary';

export const metadata: Metadata = discographyCopy.page.meta;

// Made again every hour, so a release turns from forthcoming to out on
// its day (the page's own clock turns it as well, for whoever has it open).
export const revalidate = 3600;

// The catalogue's grid: an album's tracks sit inside it, not beside it,
// and every list sends only the summaries it shows.
export default async function DiscographyRoute() {
  const { releases } = await getCatalogue();
  // A Server Component, made once per revalidation: the time it's made
  // is what "forthcoming" is measured against.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <main>
      <DiscographyPage
        copy={discographyCopy.page}
        releases={gridReleases(releases).map((r) => summarize(r, now))}
      />
    </main>
  );
}
