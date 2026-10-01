import type { ServiceItem } from '@/content/services/catalogue';
import type { ProducerFlowContent } from '@/content/services/flows';
import type { ServiceBrowse } from '@/lib/services/browse';

export interface IntroStepProps {
  content: ProducerFlowContent;
  items: ServiceItem[];
  /** The search, filter and sort over the cards. */
  browse: ServiceBrowse;
  onBrowse: (browse: ServiceBrowse) => void;
  /** Opens an item's details. */
  onOpen: (itemId: string) => void;
}

export interface BrowseBarProps {
  copy: ProducerFlowContent['browse'];
  kinds: ProducerFlowContent['kinds'];
  /** Every item, before the search and filters. */
  items: ServiceItem[];
  browse: ServiceBrowse;
  /** How many the search and filters leave. */
  shown: number;
  onBrowse: (browse: ServiceBrowse) => void;
}

export interface ServiceCardsProps {
  items: ServiceItem[];
  kinds: ProducerFlowContent['kinds'];
  /** The flow's placeholder, for items without a price yet. */
  price: string;
  /** "View details". */
  view: string;
  onOpen: (itemId: string) => void;
}

export interface ItemCardProps {
  item: ServiceItem;
  /** The item's own address, so the card opens like any link. */
  href: string;
  /** Its kind: "Commission", "1-1 session". */
  tag: string;
  price: string;
  /** "View details". */
  view: string;
  onOpen: (itemId: string) => void;
}
