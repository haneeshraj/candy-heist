import type { ServiceItem } from '@/content/services/catalogue';
import type { KindCopy, ProducerFlowContent } from '@/content/services/flows';

export interface ItemStepProps {
  copy: ProducerFlowContent['item'];
  /** Each kind's label over its group, and its call to action. */
  kinds: ProducerFlowContent['kinds'];
  items: ServiceItem[];
  selectedId: string;
  /** The flow's placeholder, for items without a price yet. */
  price: string;
  onSelect: (itemId: string) => void;
  /** Continues with the selected item (to the calendar, or your details). */
  onContinue: () => void;
}

export interface ItemOptionProps {
  item: ServiceItem;
  name: string;
  selected: boolean;
  onSelect: (itemId: string) => void;
}

export interface ItemDetailProps {
  copy: ProducerFlowContent['item'];
  /** The copy for the item's kind: its tag and how its price reads. */
  kind: KindCopy;
  item: ServiceItem;
  /** The flow's placeholder, for an item without a price yet. */
  price: string;
}
