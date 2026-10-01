'use client';

import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes
} from 'react';
import { Field } from '@/components/common/Field';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  emptyEnquiry,
  FIELD_ORDER,
  isRequired,
  MAX_LENGTH,
  type DjEnquiry,
  type EnquiryField
} from '@/lib/enquiry/enquiry';
import { sendEnquiry } from '@/lib/enquiry/sendEnquiry';
import { validateEnquiry, type EnquiryErrors } from '@/lib/enquiry/validation';
import styles from './DjEnquiry.module.scss';
import type { EnquiryFormProps } from './DjEnquiry.types';

// What each input needs from the browser beyond its copy.
const INPUTS: Partial<
  Record<EnquiryField, InputHTMLAttributes<HTMLInputElement>>
> = {
  name: { autoComplete: 'name' },
  title: { autoComplete: 'organization-title' },
  email: {
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    spellCheck: false
  },
  phone: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' }
};

// Two rows of two each: who's asking, then the event.
const GROUPS = {
  you: [
    ['name', 'title'],
    ['email', 'phone']
  ],
  event: [['eventName', 'eventVenue'], ['budget']]
} as const satisfies Record<string, EnquiryField[][]>;

// Figma "DJ · 1 · Enquiry form": who's asking (name, title, email, phone),
// then the event (its name, the venue, the budget) and a few words about
// it. Only what's starred is needed. Errors show after the first try, then
// update as the fields are fixed; focus goes to the first that needs a
// look. Everything rises in on view.
export default function EnquiryForm({
  copy,
  labelledBy,
  onSent
}: EnquiryFormProps) {
  const rootRef = useRef<HTMLFormElement | null>(null);
  const baseId = useId();
  const [values, setValues] = useState<DjEnquiry>(emptyEnquiry);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  useScrollReveal(rootRef);

  const id = (field: EnquiryField) => `${baseId}-${field}`;

  function update(field: EnquiryField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (attempted) setErrors(validateEnquiry(next, copy.errors));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setAttempted(true);
    const found = validateEnquiry(values, copy.errors);
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    setSending(true);
    try {
      onSent(await sendEnquiry(values));
    } finally {
      setSending(false);
    }
  }

  function field(name: EnquiryField) {
    const { label, placeholder } = copy.fields[name];
    const shared = {
      id: id(name),
      name,
      label,
      placeholder,
      required: isRequired(name),
      maxLength: MAX_LENGTH[name],
      value: values[name],
      error: errors[name]
    };
    return (
      <Field
        {...shared}
        {...INPUTS[name]}
        onChange={(event) => update(name, event.target.value)}
      />
    );
  }

  return (
    <form
      ref={rootRef}
      className={styles.form}
      aria-labelledby={labelledBy}
      onSubmit={submit}
      noValidate
    >
      <p className={styles.required} data-reveal>
        <span aria-hidden="true">* </span>
        {copy.required}
      </p>

      {(['you', 'event'] as const).map((group) => (
        <fieldset key={group} className={styles.group}>
          <legend className={styles.groupLabel} data-reveal>
            {copy.groups[group]}
          </legend>
          {GROUPS[group].map((row) => (
            <div key={row[0]} className={styles.pair} data-reveal>
              {row.map((name) => (
                <div key={name}>{field(name)}</div>
              ))}
            </div>
          ))}
          {group === 'event' ? (
            <div data-reveal>
              <Field
                id={id('about')}
                name="about"
                label={copy.fields.about.label}
                placeholder={copy.fields.about.placeholder}
                required
                multiline
                rows={6}
                maxLength={MAX_LENGTH.about}
                value={values.about}
                onChange={(event) => update('about', event.target.value)}
                error={errors.about}
              />
            </div>
          ) : null}
        </fieldset>
      ))}

      <div className={styles.send} data-reveal>
        <SigilChip
          variant="solid"
          icon={<ArrowIcon />}
          type="submit"
          disabled={sending}
          aria-busy={sending || undefined}
        >
          {sending ? copy.sending : copy.send}
        </SigilChip>
      </div>
    </form>
  );
}
