'use client';

import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes
} from 'react';
import { flushSync } from 'react-dom';
import { Field } from '@/components/common/Field';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  emptyMessage,
  FIELD_ORDER,
  isDetailField,
  MAX_LENGTH,
  type ContactField,
  type ContactMessage
} from '@/lib/contact/message';
import { sendMessage } from '@/lib/contact/sendMessage';
import { validateMessage, type MessageErrors } from '@/lib/contact/validation';
import { notifyError } from '@/lib/toast/notify';
import styles from './ContactForm.module.scss';
import type { ContactFormProps } from './ContactForm.types';

// What each input needs from the browser beyond its copy.
const INPUTS: Partial<
  Record<ContactField, InputHTMLAttributes<HTMLInputElement>>
> = {
  name: { autoComplete: 'name' },
  email: {
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    spellCheck: false
  },
  phone: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
  organisation: { autoComplete: 'organization' },
  links: { spellCheck: false }
};

const DETAIL_PAIRS: Array<[ContactField, ContactField]> = [
  ['phone', 'organisation'],
  ['date', 'location'],
  ['budget', 'links']
];

// The one form for every kind of request. The four things needed come
// first; the rest wait behind "Additional details", closed by default and
// only opened by the people who need them. Closing it keeps what's typed,
// and it still sends. Errors show after the first try, then update as the
// fields are fixed; focus goes to the first field that needs a look, opening
// the details first if that's where it is. Everything rises in on view.
export default function ContactForm({
  copy,
  labelledBy,
  onSent
}: ContactFormProps) {
  const rootRef = useRef<HTMLFormElement | null>(null);
  const baseId = useId();
  const [values, setValues] = useState<ContactMessage>(emptyMessage);
  const [errors, setErrors] = useState<MessageErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  useScrollReveal(rootRef);

  const id = (field: ContactField) => `${baseId}-${field}`;
  const detailsId = `${baseId}-details`;

  function update(field: ContactField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (attempted) setErrors(validateMessage(next, copy.errors));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setAttempted(true);
    const found = validateMessage(values, copy.errors);
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) {
      // A closed details panel is inert; open it before reaching into it.
      if (!open && FIELD_ORDER.some((f) => isDetailField(f) && found[f]))
        flushSync(() => setOpen(true));
      document.getElementById(id(first))?.focus();
      return;
    }
    setSending(true);
    try {
      onSent(await sendMessage(values));
    } catch {
      // What was typed stays in the form.
      notifyError(copy.failed.title, copy.failed.text);
    } finally {
      setSending(false);
    }
  }

  function field(name: ContactField) {
    const { label, placeholder } = copy.fields[name];
    const shared = {
      id: id(name),
      name,
      label,
      placeholder,
      required: !isDetailField(name),
      maxLength: MAX_LENGTH[name],
      value: values[name],
      error: errors[name]
    };
    return name === 'message' ? (
      <Field
        {...shared}
        multiline
        rows={5}
        onChange={(event) => update(name, event.target.value)}
      />
    ) : (
      <Field
        {...shared}
        {...INPUTS[name]}
        onChange={(event) => update(name, event.target.value)}
      />
    );
  }

  const count = Object.keys(errors).length;
  const summary =
    count === 0
      ? null
      : count === 1
        ? copy.summary.one
        : copy.summary.other.replace(
            '{count}',
            copy.summary.counts[count - 1] ?? String(count)
          );

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

      <div className={styles.pair}>
        <div data-reveal>{field('name')}</div>
        <div data-reveal>{field('email')}</div>
      </div>
      <div data-reveal>{field('subject')}</div>
      <div data-reveal>{field('message')}</div>

      <div className={styles.detailsBlock} data-reveal>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((was) => !was)}
        >
          <span className={styles.toggleLabel}>{copy.details}</span>
          <span className={styles.sign} aria-hidden="true" />
        </button>

        {/* Kept in the page when closed, so what's typed stays and sends. */}
        <div
          id={detailsId}
          className={styles.details}
          data-open={open ? 'true' : undefined}
          inert={!open}
        >
          <div className={styles.detailsClip}>
            <div className={styles.detailsFields}>
              {DETAIL_PAIRS.map(([a, b]) => (
                <div key={a} className={styles.pair}>
                  {field(a)}
                  {field(b)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer} data-reveal>
        <p
          className={summary ? styles.summary : styles.note}
          aria-live="polite"
        >
          {summary ?? copy.privacy}
        </p>
        <span className={styles.send}>
          <SigilChip
            variant="solid"
            icon={<ArrowIcon />}
            type="submit"
            disabled={sending}
          >
            {sending ? copy.sending : copy.send}
          </SigilChip>
        </span>
      </div>
    </form>
  );
}
