'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type FormEvent
} from 'react';
import { StepHeading } from '@/components/booking/StepHeading';
import { Field } from '@/components/common/Field';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { isInvoiceId, type Invoice } from '@/lib/invoices/invoice';
import { findInvoice } from '@/lib/invoices/payInvoice';
import styles from './PayInvoice.module.scss';
import type { FindInvoiceProps } from './PayInvoice.types';

// The invoice ID, and Find. A missing or misshapen ID is caught before
// the lookup; one that isn't there, after. An ID from the email's link is
// looked up straight away.
export default function FindInvoice({
  copy,
  initialId,
  onFound
}: FindInvoiceProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const fieldId = useId();
  const [value, setValue] = useState(initialId);
  const [error, setError] = useState<string | undefined>();
  // An ID from the link is being looked up from the start.
  const [finding, setFinding] = useState(initialId !== '');
  useEntrance(rootRef, { delay: 0.3 });

  /** Looks the ID up; false (with the reason shown) if it can't. */
  async function find(id: string) {
    const problem =
      id.trim() === ''
        ? copy.errors.missing
        : !isInvoiceId(id)
          ? copy.errors.invalid
          : null;
    if (problem) {
      setError(problem);
      return false;
    }
    setError(undefined);
    setFinding(true);
    let invoice: Invoice;
    try {
      invoice = await findInvoice(id);
    } catch {
      setFinding(false);
      setError(copy.errors.notFound);
      return false;
    }
    onFound(invoice);
    return true;
  }

  // Brought in by the email's link: look it up at once.
  const found = useEffectEvent((invoice: Invoice) => onFound(invoice));
  const missed = useEffectEvent(() => {
    setFinding(false);
    setError(copy.errors.notFound);
  });
  useEffect(() => {
    if (!initialId) return;
    let live = true;
    findInvoice(initialId).then(
      (invoice) => live && found(invoice),
      () => live && missed()
    );
    return () => {
      live = false;
    };
  }, [initialId]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (finding) return;
    void find(value).then((found) => {
      if (!found) document.getElementById(fieldId)?.focus();
    });
  }

  return (
    <section ref={rootRef} className={styles.step} aria-labelledby={headingId}>
      <div className={styles.findLayout}>
        <StepHeading
          id={headingId}
          label={copy.label}
          heading={copy.heading}
          sub={copy.sub}
        />
        <form className={styles.findForm} onSubmit={submit} noValidate>
          <div data-enter>
            <Field
              id={fieldId}
              label={copy.field.label}
              placeholder={copy.field.placeholder}
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={60}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(undefined);
              }}
              error={error}
            />
          </div>
          <div data-enter>
            <SigilChip
              variant="solid"
              icon={<ArrowIcon />}
              type="submit"
              disabled={finding}
              aria-busy={finding || undefined}
            >
              {finding ? copy.finding : copy.cta}
            </SigilChip>
          </div>
        </form>
      </div>
    </section>
  );
}
