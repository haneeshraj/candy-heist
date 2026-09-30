import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoreChapterPage } from '@/components/lore/LoreChapterPage';
import { loadLore } from '@/content/lore/loadLore';
import { copyOf, findChapter, summarize } from '@/content/lore/lore';

// A page per chapter, built ahead of time; a slug the lore doesn't have is
// a 404. When Candy Haven publishes chapters, revalidating these pages
// (or rendering them on request) brings a new one in.
export const dynamicParams = false;

export function generateStaticParams() {
  return loadLore().chapters.map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata(
  props: PageProps<'/lore/[slug]'>
): Promise<Metadata> {
  const chapter = findChapter(loadLore().chapters, (await props.params).slug);
  if (!chapter) return {};
  return {
    title: `${chapter.title} · The lore of Nayara · Candy Heist`,
    description: `Chapter ${chapter.numeral} of the lore of Nayara, the world behind the music of Candy Heist. ${chapter.line}`
  };
}

export default async function LoreChapterRoute(
  props: PageProps<'/lore/[slug]'>
) {
  const lore = loadLore();
  const chapter = findChapter(lore.chapters, (await props.params).slug);
  if (!chapter) notFound();

  return (
    <main>
      <LoreChapterPage
        key={chapter.slug}
        copy={copyOf(lore)}
        chapters={lore.chapters.map(summarize)}
        chapter={chapter}
      />
    </main>
  );
}
