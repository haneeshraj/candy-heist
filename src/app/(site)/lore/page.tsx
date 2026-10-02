import type { Metadata } from 'next';
import { LorePage } from '@/components/lore/LorePage';
import { getLore } from '@/content/lore/getLore';
import { copyOf, summarize } from '@/content/lore/lore';

export const metadata: Metadata = {
  title: 'The lore of Nayara · Candy Heist',
  description:
    'Nayara, the world behind the music of Candy Heist: a living planet, the resonance called Omun, and the rogue sonoalchemist Heist, told chapter by chapter.'
};

// The lore's way in: the arrival and the chapters, each a link to its
// page. Only what the index shows is sent down, not the chapters' text.
// Built once and kept until Candy Haven publishes again (getLore.ts).
export default async function LoreRoute() {
  const lore = await getLore();
  return (
    <main>
      <LorePage copy={copyOf(lore)} chapters={lore.chapters.map(summarize)} />
    </main>
  );
}
