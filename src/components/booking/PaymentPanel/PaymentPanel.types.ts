import type { CardPayer } from '@/lib/payments/client';

export interface PaymentPanelCopy {
  /** Over the amount: "Paid in full", "Half upfront · 50%". */
  panel: string;
  card: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
    /** When Pay is pressed with no name on the card. */
    nameMissing: string;
  };
  /** Instead of the card, while payments can't be taken. */
  notOpen: string;
  secure: string;
  /** "Pay {price} now". */
  cta: string;
  paying: string;
  terms: {
    /** The box to tick: "I’ve read and accept the {link}." */
    accept: string;
    /** The link's words, to the terms page (in a new tab). */
    link: string;
    /** Under the box: read them first, payments are final. */
    note: string;
    /** When Pay is pressed with the box unticked. */
    error: string;
  };
}

export interface PaymentPanelProps {
  copy: PaymentPanelCopy;
  /** What's paid now, or the placeholder. */
  amount: string;
  /** True while the payment is going through. */
  paying: boolean;
  /** False while this can't be paid for online (no price yet). */
  open: boolean;
  /** Pressed with the terms accepted: pay with the card on the panel. */
  onPay: (payer: CardPayer) => void;
  className?: string;
}
