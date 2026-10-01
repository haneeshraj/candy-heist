export interface PaymentPanelCopy {
  /** Over the amount: "Paid in full", "Half upfront · 50%". */
  panel: string;
  card: { number: string; expiry: string; cvc: string; name: string };
  secure: string;
  /** "Pay {price} now". */
  cta: string;
  paying: string;
  /** "… By paying, you agree to the {link}." and the link's words. */
  terms: { text: string; link: string };
}

export interface PaymentPanelProps {
  copy: PaymentPanelCopy;
  /** What's paid now, or the placeholder. */
  amount: string;
  /** True while the payment is going through. */
  paying: boolean;
  onPay: () => void;
  className?: string;
}
