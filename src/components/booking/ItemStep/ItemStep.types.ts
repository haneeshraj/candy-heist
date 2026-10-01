import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowContent } from '@/content/services/flows';

export interface ItemStepProps {
  copy: FlowContent['item'];
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
  copy: FlowContent['item'];
  item: ServiceItem;
  price: string;
}
