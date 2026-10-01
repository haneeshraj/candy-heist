'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Field } from '@/components/common/Field';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import type { BookingDetails, MeetOn } from '@/lib/booking/bookingState';
import {
  NOTE_MAX_LENGTH,
  validateDetails,
  type DetailsErrors
} from '@/lib/booking/validation';
import BookingSummary from '../BookingSummary/BookingSummary';
import StepHeading from '../StepHeading/StepHeading';
import styles from './DetailsStep.module.scss';
import type { DetailsStepProps } from './DetailsStep.types';
import MeetOnSwitch from './MeetOnSwitch';

type TextField = keyof DetailsErrors;

const ORDER: TextField[] = [
  'name',
  'email',
  'instagram',
  'discord',
  'phone',
  'note'
];

// Figma "Your details": name and email; for a session, where to meet
// (Google Meet or Discord); Instagram and Discord, so Candy can reach out;
// a phone number and a note. Only what's starred is needed, and Discord
// becomes needed once it's where to meet. Errors show after the first try
// to continue, then update as the fields are fixed.
export default function DetailsStep({
  copy,
  summary,
  details,
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

  const id = (key: TextField) => `${fieldId}-${key}`;
  const onDiscord = details.meetOn === 'discord';
  const sub = onDiscord && copy.subDiscord ? copy.subDiscord : copy.sub;

  function update(next: BookingDetails) {
    onChange(next);
    if (attempted) setErrors(validateDetails(next, copy.errors));
  }

  const edit = (key: TextField, value: string) =>
    update({ ...details, [key]: value });
  const meetOn = (value: MeetOn) => update({ ...details, meetOn: value });

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
          />
          {/* Keyed by its text, so it writes itself in again on a change. */}
          <WordReveal
            key={sub}
            as="p"
            className={styles.sub}
            text={sub}
            trigger="mount"
            startDelay={attempted ? 0 : 0.45}
            staggerDelay={0.02}
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
                  onChange={(event) => edit('name', event.target.value)}
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
                  onChange={(event) => edit('email', event.target.value)}
                  error={errors.email}
                />
              </div>
            </div>

            {copy.meetOn ? (
              <div data-enter>
                <MeetOnSwitch
                  copy={copy.meetOn}
                  value={details.meetOn}
                  onChange={meetOn}
                />
              </div>
            ) : null}

            <div className={styles.pair}>
              <div data-enter>
                <Field
                  id={id('instagram')}
                  label={copy.instagram.label}
                  placeholder={copy.instagram.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  value={details.instagram}
                  onChange={(event) => edit('instagram', event.target.value)}
                  error={errors.instagram}
                />
              </div>
              <div data-enter>
                <Field
                  id={id('discord')}
                  label={copy.discord.label}
                  placeholder={copy.discord.placeholder}
                  required={onDiscord}
                  autoComplete="off"
                  spellCheck={false}
                  value={details.discord}
                  onChange={(event) => edit('discord', event.target.value)}
                  error={errors.discord}
                />
              </div>
            </div>
            <div data-enter>
              <Field
                id={id('phone')}
                label={copy.phone.label}
                placeholder={copy.phone.placeholder}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={details.phone}
                onChange={(event) => edit('phone', event.target.value)}
                error={errors.phone}
              />
            </div>
            <div data-enter>
              <Field
                id={id('note')}
                label={copy.note.label}
                placeholder={copy.note.placeholder}
                multiline
                rows={6}
                maxLength={NOTE_MAX_LENGTH}
                value={details.note}
                onChange={(event) => edit('note', event.target.value)}
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

        <BookingSummary {...summary} />
      </div>
    </section>
  );
}
