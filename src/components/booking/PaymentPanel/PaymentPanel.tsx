'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import { fill } from '@/lib/booking/format';
import styles from './PaymentPanel.module.scss';
import type { PaymentPanelProps } from './PaymentPanel.types';

const CARD_PLACEHOLDERS = [
  { key: 'number', value: '1234 1234 1234 1234' },
  { key: 'expiry', value: 'MM / YY' },
  { key: 'cvc', value: '123' },
  { key: 'name', value: '' }
] as const;

// Figma "Booking / Payment", card only: what's paid now, the card, a box
// to tick for the terms, the button. The fields mark where Stripe's own
// card form mounts: card details are typed into Stripe's frame, never
// into this page, so these are placeholders rather than inputs until the
// Stripe keys and the Server Action are in. Payments are final, so Pay
// won't go ahead until the terms are accepted: pressed without, it says
// so and puts focus on the box; the terms open in a new tab, so reading
// them doesn't lose the place. Shared by the booking flow and the
// invoice page.
export default function PaymentPanel({
  copy,
  amount,
  paying,
  onPay,
  className
}: PaymentPanelProps) {
  const boxRef = useRef<HTMLInputElement | null>(null);
  const baseId = useId();
  const [accepted, setAccepted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [beforeLink, afterLink = ''] = copy.terms.accept.split('{link}');

  const boxId = `${baseId}-terms`;
  const noteId = `${boxId}-note`;
  const errorId = `${boxId}-error`;
  const missing = attempted && !accepted;

  function pay() {
    if (!accepted) {
      setAttempted(true);
      boxRef.current?.focus();
      return;
    }
    onPay();
  }

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

      <div className={styles.accept} data-invalid={missing || undefined}>
        <span className={styles.box}>
          <input
            ref={boxRef}
            id={boxId}
            className={styles.boxInput}
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            disabled={paying}
            aria-required="true"
            aria-invalid={missing || undefined}
            aria-describedby={missing ? `${noteId} ${errorId}` : noteId}
          />
          <CheckIcon className={styles.tick} />
        </span>
        <label className={styles.acceptLabel} htmlFor={boxId}>
          {beforeLink}
          <Link
            className={styles.termsLink}
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.terms.link}
            <span className={styles.srOnly}> (opens in a new tab)</span>
          </Link>
          {afterLink}
        </label>
        <p id={noteId} className={styles.note}>
          {copy.terms.note}
        </p>
        {missing ? (
          <p id={errorId} className={styles.error}>
            {copy.terms.error}
          </p>
        ) : null}
      </div>

      <SigilChip
        variant="solid"
        icon={<ArrowIcon />}
        onClick={pay}
        disabled={paying}
        aria-busy={paying || undefined}
      >
        {paying ? copy.paying : fill(copy.cta, { price: amount })}
      </SigilChip>
      <p className={styles.secure}>{copy.secure}</p>
    </div>
  );
}
