'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Field } from '@/components/common/Field';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import type { BookingDetails } from '@/lib/booking/bookingState';
import {
  NOTE_MAX_LENGTH,
  validateDetails,
  type DetailsErrors
} from '@/lib/booking/validation';
import BookingSummary from '../BookingSummary/BookingSummary';
import StepHeading from '../StepHeading/StepHeading';
import styles from './DetailsStep.module.scss';
import type { DetailsStepProps } from './DetailsStep.types';

const ORDER: Array<keyof BookingDetails> = ['name', 'email', 'phone', 'note'];

// Figma "D1 · 4 Your details", trimmed to what a booking needs: name and
// email, an optional phone number and a note for Candy Heist. Errors show
// after the first try to continue, then update as the fields are fixed.
export default function DetailsStep({
  copy,
  summaryCopy,
  service,
  date,
  time,
  details,
  timeZoneLabel,
  price,
  onChange,
  onSubmit,
  onBack
}: DetailsStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const fieldId = useId();
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [attempted, setAttempted] = useState(false);
  useEntrance(rootRef, { delay: 0.3 });

  const id = (key: keyof BookingDetails) => `${fieldId}-${key}`;

  function update(key: keyof BookingDetails, value: string) {
    const next = { ...details, [key]: value };
    onChange(next);
    if (attempted) setErrors(validateDetails(next, copy.errors));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    const found = validateDetails(details, copy.errors);
    setErrors(found);
    const first = ORDER.find((key) => found[key]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    onSubmit(details);
  }

  return (
    <section ref={rootRef} className={styles.step} aria-labelledby={headingId}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <StepHeading
            id={headingId}
            label={copy.label}
            heading={copy.heading}
            sub={copy.sub}
          />

          <form className={styles.form} onSubmit={submit} noValidate>
            <p className={styles.required} data-enter>
              <span aria-hidden="true">* </span>
              {copy.required}
            </p>
            <div className={styles.pair}>
              <div data-enter>
                <Field
                  id={id('name')}
                  label={copy.name.label}
                  placeholder={copy.name.placeholder}
                  required
                  autoComplete="name"
                  value={details.name}
                  onChange={(event) => update('name', event.target.value)}
                  error={errors.name}
                />
              </div>
              <div data-enter>
                <Field
                  id={id('email')}
                  label={copy.email.label}
                  placeholder={copy.email.placeholder}
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={details.email}
                  onChange={(event) => update('email', event.target.value)}
                  error={errors.email}
                />
              </div>
            </div>
            <div data-enter>
              <Field
                id={id('phone')}
                label={copy.phone.label}
                optionalLabel={copy.optional}
                placeholder={copy.phone.placeholder}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={details.phone}
                onChange={(event) => update('phone', event.target.value)}
                error={errors.phone}
              />
            </div>
            <div data-enter>
              <Field
                id={id('note')}
                label={copy.note.label}
                optionalLabel={copy.optional}
                placeholder={copy.note.placeholder}
                multiline
                rows={6}
                maxLength={NOTE_MAX_LENGTH}
                value={details.note}
                onChange={(event) => update('note', event.target.value)}
                error={errors.note}
              />
            </div>

            <div className={styles.actions} data-enter>
              <SigilChip variant="ghost" icon={null} onClick={onBack}>
                {copy.back}
              </SigilChip>
              <SigilChip variant="solid" icon={<ArrowIcon />} type="submit">
                {copy.cta}
              </SigilChip>
            </div>
          </form>
        </div>

        <BookingSummary
          copy={summaryCopy}
          service={service}
          date={date}
          time={time}
          timeZoneLabel={timeZoneLabel}
          price={price}
        />
      </div>
    </section>
  );
}
