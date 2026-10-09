import 'server-only';
import { cache } from 'react';
import type { Hours } from '@/lib/booking/hours';
import { readServiceItem, type ServiceItem } from '@/lib/services/model';
import { readPublishedServices } from '@/lib/services/published';
import { catalogue } from './catalogue';
import { fileHours } from './hours';

// Everything "Book me as a music producer" offers, and when sessions can
// be booked: Candy Haven's, once it has published, else the site's own
// files. The producer page, the home page, the open times and the payment
// all read them here, so they always agree.

export interface Services {
  /** In their order on the site. */
  items: ServiceItem[];
  hours: Hours;
}

export const getServices = cache(async (): Promise<Services> => {
  const published = await readPublishedServices();
  if (!published) return { items: catalogue, hours: fileHours };

  // Checked when published, so none should fail here; one that does is
  // left out rather than taking the page down with it.
  const items = published.items.flatMap((item) => {
    try {
      return [readServiceItem(item)];
    } catch (error) {
      console.error(`Service "${item.id}" can't be shown.`, error);
      return [];
    }
  });
  return {
    items: items.length ? items : catalogue,
    hours: { ...published.hours, holdMinutes: fileHours.holdMinutes }
  };
});
