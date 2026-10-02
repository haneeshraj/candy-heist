import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { LORE_TAG } from './published';

// After a publish, an unpublish or a new order: the lore pages are built
// again on their next visit. Expired at once rather than marked stale, so
// whoever published and goes to look sees the change, not the old page
// while the new one is made.
export function revalidateLore(): void {
  revalidateTag(LORE_TAG, { expire: 0 });
  revalidatePath('/lore');
  revalidatePath('/lore/[slug]', 'page');
  revalidatePath('/sitemap.xml');
}
