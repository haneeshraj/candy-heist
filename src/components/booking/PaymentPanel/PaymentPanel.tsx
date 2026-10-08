'use client';

import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import type {
  Stripe,
  StripeCardElementOptions,
  StripeElements,
  StripeElementsOptions
} from '@stripe/stripe-js';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import { fill } from '@/lib/booking/format';
import { getStripeJs, type CardPayer } from '@/lib/payments/client';
import styles from './PaymentPanel.module.scss';
import type { PaymentPanelProps } from './PaymentPanel.types';

const CARD_PLACEHOLDERS = [
  { key: 'number', value: '1234 1234 1234 1234' },
  { key: 'expiry', value: 'MM / YY' },
  { key: 'cvc', value: '123' }
] as const;

// Stripe draws its fields in frames of its own, which the page's styles
// don't reach: the design's colours and face are handed over here.
const FIELD_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: '#ddcfb2',
      fontFamily: 'Archivo, Arial, sans-serif',
      fontSize: '15px',
      fontSmoothing: 'antialiased',
      iconColor: '#d2a961',
      '::placeholder': { color: 'rgba(138, 128, 113, 0.8)' }
    },
    invalid: { color: '#e27b6e', iconColor: '#e27b6e' }
  },
  classes: { focus: styles.focused, invalid: styles.invalidField }
};

const ELEMENTS_OPTIONS: StripeElementsOptions = {
  fonts: [
    {
      cssSrc:
        'https://fonts.googleapis.com/css2?family=Archivo:wght@400&display=swap'
    }
  ],
  locale: 'en'
};

interface StripeHandle {
  stripe: Stripe;
  elements: StripeElements;
}

/** Stripe's three card fields; hands Stripe itself up once it's ready. */
function CardFields({
  copy,
  onReady,
  onError
}: {
  copy: PaymentPanelProps['copy'];
  onReady: (handle: StripeHandle | null) => void;
  onError: (message: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  useEffect(() => {
    onReady(stripe && elements ? { stripe, elements } : null);
  }, [stripe, elements, onReady]);

  const change = (event: { error?: { message: string } }) =>
    onError(event.error?.message ?? null);

  return (
    <>
      <div className={styles.cardField} data-field="number">
        <span className={styles.cardLabel}>{copy.card.number}</span>
        <CardNumberElement
          className={styles.cardBox}
          options={{ ...FIELD_OPTIONS, showIcon: true }}
          onChange={change}
        />
      </div>
      <div className={styles.cardField} data-field="expiry">
        <span className={styles.cardLabel}>{copy.card.expiry}</span>
        <CardExpiryElement
          className={styles.cardBox}
          options={FIELD_OPTIONS}
          onChange={change}
        />
      </div>
      <div className={styles.cardField} data-field="cvc">
        <span className={styles.cardLabel}>{copy.card.cvc}</span>
        <CardCvcElement
          className={styles.cardBox}
          options={FIELD_OPTIONS}
          onChange={change}
        />
      </div>
    </>
  );
}

// Figma "Booking / Payment", card only: what's paid now, the card, a box
// to tick for the terms, the button. The card is typed into Stripe's own
// fields, never into this page; the name on the card is the page's. While
// payments can't be taken (the price isn't set, or Stripe isn't set up
// here), the fields show as placeholders under a word saying so. Payments
// are final, so Pay won't go ahead until the terms are accepted: pressed
// without, it says so and puts focus on the box; the terms open in a new
// tab, so reading them doesn't lose the place. Shared by the booking flow
// and the invoice page.
export default function PaymentPanel({
  copy,
  amount,
  paying,
  open,
  onPay,
  className
}: PaymentPanelProps) {
  const boxRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const handle = useRef<StripeHandle | null>(null);
  const baseId = useId();
  const [accepted, setAccepted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [name, setName] = useState('');
  const [nameMissing, setNameMissing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [stripePromise] = useState(() => (open ? getStripeJs() : null));
  const [beforeLink, afterLink = ''] = copy.terms.accept.split('{link}');

  const taking = open && stripePromise !== null;
  const boxId = `${baseId}-terms`;
  const noteId = `${boxId}-note`;
  const errorId = `${boxId}-error`;
  const nameId = `${baseId}-name`;
  const cardErrorId = `${baseId}-card-error`;
  const missing = attempted && !accepted;

  const payer: CardPayer = {
    async confirm(clientSecret, billing) {
      const ready = handle.current;
      const card = ready?.elements.getElement(CardNumberElement);
      if (!ready || !card) return { ok: false, message: null };
      const result = await ready.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: name.trim(), email: billing.email }
        }
      });
      if (result.error) {
        setCardError(result.error.message ?? null);
        return { ok: false, message: result.error.message ?? null };
      }
      return result.paymentIntent?.status === 'succeeded'
        ? { ok: true }
        : { ok: false, message: null };
    }
  };

  function pay() {
    if (!taking) return;
    if (name.trim() === '') {
      setNameMissing(true);
      nameRef.current?.focus();
      return;
    }
    if (!accepted) {
      setAttempted(true);
      boxRef.current?.focus();
      return;
    }
    setCardError(null);
    onPay(payer);
  }

  return (
    <div className={[styles.panel, className].filter(Boolean).join(' ')}>
      <CornerTicks />
      <div className={styles.head}>
        <p className={styles.label}>{copy.panel}</p>
        <p className={styles.amount}>{amount}</p>
      </div>

      {taking ? (
        <div className={styles.card}>
          <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
            <CardFields
              copy={copy}
              onReady={(next) => {
                handle.current = next;
              }}
              onError={setCardError}
            />
          </Elements>
          <div className={styles.cardField} data-field="name">
            <label className={styles.cardLabel} htmlFor={nameId}>
              {copy.card.name}
            </label>
            <input
              ref={nameRef}
              id={nameId}
              className={`${styles.cardBox} ${styles.nameInput}`}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (event.target.value.trim()) setNameMissing(false);
              }}
              autoComplete="cc-name"
              maxLength={120}
              disabled={paying}
              aria-invalid={nameMissing || undefined}
              aria-describedby={nameMissing ? `${nameId}-error` : undefined}
            />
            {nameMissing ? (
              <p id={`${nameId}-error`} className={styles.cardError}>
                {copy.card.nameMissing}
              </p>
            ) : null}
          </div>
          {cardError ? (
            <p id={cardErrorId} className={styles.cardError} role="alert">
              {cardError}
            </p>
          ) : null}
        </div>
      ) : (
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
          <div className={styles.cardField} data-field="name">
            <span className={styles.cardLabel}>{copy.card.name}</span>
            <span className={styles.cardBox} />
          </div>
        </div>
      )}
      {!taking ? <p className={styles.notOpen}>{copy.notOpen}</p> : null}

      <div className={styles.accept} data-invalid={missing || undefined}>
        <span className={styles.box}>
          <input
            ref={boxRef}
            id={boxId}
            className={styles.boxInput}
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            disabled={paying || !taking}
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
        disabled={paying || !taking}
        aria-busy={paying || undefined}
      >
        {paying ? copy.paying : fill(copy.cta, { price: amount })}
      </SigilChip>
      <p className={styles.secure}>{copy.secure}</p>
    </div>
  );
}
