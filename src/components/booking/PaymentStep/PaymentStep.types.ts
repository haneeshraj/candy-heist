import type { FlowContent } from '@/content/services/flows';
import type { SummaryProps } from '../types';

export interface PaymentStepProps {
  copy: FlowContent['payment'];
  summary: SummaryProps;
  /** What's paid now: the item's price, or the placeholder. */
  price: string;
  /** True while the booking is being finalised. */
  paying: boolean;
  onPay: () => void;
  onBack: () => void;
}
