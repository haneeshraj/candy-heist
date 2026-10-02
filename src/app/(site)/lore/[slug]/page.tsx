import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoreChapterPage } from '@/components/lore/LoreChapterPage';
import { getLore } from '@/content/lore/getLore';
import { copyOf, findChapter, summarize } from '@/content/lore/lore';

// A page per chapter. Those the lore has at build are made then; one Candy
// Haven publishes later is made on its first visit and kept, and every
// one is made again after a publish (lib/lore/revalidate.ts). A slug the
// lore doesn't have is a 404.
export const dynamic = 'force-static';

export async function generateStaticParams() {
  return (await getLore()).chapters.map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata(
  props: PageProps<'/lore/[slug]'>
): Promise<Metadata> {
  const chapter = findChapter(
    (await getLore()).chapters,
    (await props.params).slug
  );
  if (!chapter) return {};
  return {
    title: `${chapter.title} · The lore of Nayara · Candy Heist`,
    description: `Chapter ${chapter.numeral} of the lore of Nayara, the world behind the music of Candy Heist. ${chapter.line}`
  };
}

export default async function LoreChapterRoute(
  props: PageProps<'/lore/[slug]'>
) {
  const lore = await getLore();
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
