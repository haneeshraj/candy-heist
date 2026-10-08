import type { FlowCopy } from '@/content/services/flows';
import type { CardPayer } from '@/lib/payments/client';
import type { SummaryProps } from '../types';

export interface PaymentStepProps {
  copy: FlowCopy['payment'];
  summary: SummaryProps;
  /**
   * What's paid now: half a commission's price, all of a session's, or
   * the placeholder.
   */
  price: string;
  /** True while the booking is being finalised. */
  paying: boolean;
  /** False while it can't be paid for online (the price isn't set). */
  open: boolean;
  onPay: (payer: CardPayer) => void;
  onBack: () => void;
}
