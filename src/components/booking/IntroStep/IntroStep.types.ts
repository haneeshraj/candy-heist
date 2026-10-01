import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowContent } from '@/content/services/flows';
import type { FlowKind } from '@/lib/booking/bookingState';

export interface IntroStepProps {
  kind: FlowKind;
  content: FlowContent;
  items: ServiceItem[];
  /** The flow's placeholder, for items without a price yet. */
  price: string;
  /** Opens an item's details. */
  onOpen: (itemId: string) => void;
}

export interface ItemCardProps {
  item: ServiceItem;
  /** The item's own address, so the card opens like any link. */
  href: string;
  price: string;
  /** "View details". */
  view: string;
  onOpen: (itemId: string) => void;
}
