import Link from 'next/link';
import { CornerTicks } from '@/components/common/CornerTicks';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { fill } from '@/lib/booking/format';
import styles from './PaymentPanel.module.scss';
import type { PaymentPanelProps } from './PaymentPanel.types';

const CARD_PLACEHOLDERS = [
  { key: 'number', value: '1234 1234 1234 1234' },
  { key: 'expiry', value: 'MM / YY' },
  { key: 'cvc', value: '123' },
  { key: 'name', value: '' }
] as const;

// Figma "Booking / Payment", card only: what's paid now, the card, the
// button, and under it that payments are final, with the terms. The
// fields mark where Stripe's own card form mounts: card details are typed
// into Stripe's frame, never into this page, so these are placeholders
// rather than inputs until the Stripe keys and the Server Action are in.
// Shared by the booking flow and the invoice page.
export default function PaymentPanel({
  copy,
  amount,
  paying,
  onPay,
  className
}: PaymentPanelProps) {
  const [beforeLink, afterLink = ''] = copy.terms.text.split('{link}');

  return (
    <div className={[styles.panel, className].filter(Boolean).join(' ')}>
      <CornerTicks />
      <div className={styles.head}>
        <p className={styles.label}>{copy.panel}</p>
        <p className={styles.amount}>{amount}</p>
      </div>

      <div className={styles.card} data-stripe-slot aria-hidden="true">
        {CARD_PLACEHOLDERS.map((field) => (
          <div
            key={field.key}
            className={styles.cardField}
            data-field={field.key}
          >
            <span className={styles.cardLabel}>{copy.card[field.key]}</span>
            <span className={styles.cardBox}>{field.value}</span>
          </div>
        ))}
      </div>

      <SigilChip
        variant="solid"
        icon={<ArrowIcon />}
        onClick={onPay}
        disabled={paying}
        aria-busy={paying || undefined}
      >
        {paying ? copy.paying : fill(copy.cta, { price: amount })}
      </SigilChip>
      <p className={styles.terms}>
        {beforeLink}
        <Link className={styles.termsLink} href="/terms">
          {copy.terms.link}
        </Link>
        {afterLink}
      </p>
      <p className={styles.secure}>{copy.secure}</p>
    </div>
  );
}
