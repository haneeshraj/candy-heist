import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { RELEASES_TAG } from './published';

// After Candy Haven's RELEASES changes anything: the discography is built
// again on its next visit, with the home page's shelf, the share pages,
// their link previews and the sitemap. Expired at once rather than marked
// stale, so whoever sent the change and goes to look sees it.
export function revalidateReleases(): void {
  revalidateTag(RELEASES_TAG, { expire: 0 });
  revalidatePath('/');
  revalidatePath('/discography', 'layout');
  revalidatePath('/listen', 'layout');
  revalidatePath('/sitemap.xml');
}
