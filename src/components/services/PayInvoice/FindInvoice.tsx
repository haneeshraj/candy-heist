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
import { lookUpInvoice } from '@/lib/invoices/actions';
import { isInvoiceId, type Invoice } from '@/lib/invoices/invoice';
import styles from './PayInvoice.module.scss';
import type { FindInvoiceProps } from './PayInvoice.types';

// The invoice ID, and Find. A missing or misshapen ID is caught before
// the lookup; one that isn't there, after. An ID from the email's link is
// looked up straight away.

/** Not found, or the lookup couldn't be made: which one, for the message. */
class LookupError extends Error {
  constructor(readonly reason: 'notFound' | 'limited' | 'unavailable') {
    super(reason);
  }
}

async function lookUp(id: string): Promise<Invoice> {
  const result = await lookUpInvoice(id);
  if (!result.ok) throw new LookupError(result.reason);
  return result.invoice;
}
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

  const messageFor = (error: unknown) =>
    error instanceof LookupError && error.reason !== 'notFound'
      ? copy.errors.unavailable
      : copy.errors.notFound;

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
      invoice = await lookUp(id);
    } catch (problem) {
      setFinding(false);
      setError(messageFor(problem));
      return false;
    }
    onFound(invoice);
    return true;
  }

  // Brought in by the email's link: look it up at once.
  const found = useEffectEvent((invoice: Invoice) => onFound(invoice));
  const missed = useEffectEvent((problem: unknown) => {
    setFinding(false);
    setError(messageFor(problem));
  });
  useEffect(() => {
    if (!initialId) return;
    let live = true;
    lookUp(initialId).then(
      (invoice) => live && found(invoice),
      (problem: unknown) => live && missed(problem)
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
