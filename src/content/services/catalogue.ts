import { z } from 'zod';
import {
  readServiceItem,
  serviceListSchema,
  type ServiceItem,
  type ServiceItemInput
} from '@/lib/services/model';
import catalogueData from './catalogue.json';

// The site's own list of what's offered under "Book me as a music
// producer", shown until Candy Haven publishes its own (see getServices.ts).
// Haven adds, changes and removes services as Candy likes, and sets each
// one's kind, so nothing on the site may assume these six, their order, or
// how many of each kind there are.
//
// PLACEHOLDERS: the six here are stand-ins, and their prices are unset, so
// the flow shows its placeholder. Haven's "start from the website's list"
// copies them in, addresses and all, to be edited there.

export const catalogueSchema = z.object({ items: serviceListSchema });

/** As written, the write-ups still markdown: what Haven copies in. */
export const fileServices: ServiceItemInput[] =
  catalogueSchema.parse(catalogueData).items;

/** As the pages use them, in the client's order. */
export const catalogue: ServiceItem[] = fileServices.map(readServiceItem);
