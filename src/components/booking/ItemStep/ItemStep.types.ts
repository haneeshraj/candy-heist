import type { ServiceItem } from '@/content/services/catalogue';
import type { KindCopy, ProducerFlowContent } from '@/content/services/flows';

export interface ItemStepProps {
  copy: ProducerFlowContent['item'];
  /** Each kind's copy: its tag, how its price reads, its call to action. */
  kinds: ProducerFlowContent['kinds'];
  item: ServiceItem;
  /** The flow's placeholder, for items without a price yet. */
  price: string;
  /** Back to the list of services. */
  onBack: () => void;
  /** Continues with the item (to the calendar, or your details). */
  onContinue: () => void;
}

export interface ItemDetailProps {
  copy: ProducerFlowContent['item'];
  /** The copy for the item's kind: its tag, how its price reads, its call to action. */
  kind: KindCopy;
  item: ServiceItem;
  /** The flow's placeholder, for an item without a price yet. */
  price: string;
  onContinue: () => void;
}
