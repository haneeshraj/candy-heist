import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SERVICES_TAG } from './published';

// After a publish: the producer page and the home page (its Sessions and
// Testimonials name the services) are built again on their next visit.
// Expired at once rather than marked stale, so whoever published and goes
// to look sees the change, not the old page while the new one is made.
export function revalidateServices(): void {
  revalidateTag(SERVICES_TAG, { expire: 0 });
  revalidatePath('/services/producer');
  revalidatePath('/');
}
