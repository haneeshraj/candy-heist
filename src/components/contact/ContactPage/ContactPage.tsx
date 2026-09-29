'use client';

import { useId, useState } from 'react';
import type { SentMessage } from '@/lib/contact/sendMessage';
import { ContactForm } from '../ContactForm';
import { ContactHero } from '../ContactHero';
import { ContactSent } from '../ContactSent';
import styles from './ContactPage.module.scss';
import type { ContactPageProps } from './ContactPage.types';

// Figma "Contact page form": the heading and its rings, then the form under
// the horizon, which gives way to the confirmation once a message has gone.
// "Send another" brings back an empty form.
export default function ContactPage({ content }: ContactPageProps) {
  const headingId = useId();
  const [sent, setSent] = useState<SentMessage | null>(null);

  return (
    <div className={styles.page}>
      <ContactHero
        headingId={headingId}
        label={content.label}
        headline={content.headline}
        intro={content.intro}
      />
      <div className={styles.body}>
        {sent ? (
          <ContactSent
            copy={content.sent}
            sent={sent}
            phone={content.phone}
            onAgain={() => setSent(null)}
          />
        ) : (
          <ContactForm
            copy={content.form}
            labelledBy={headingId}
            onSent={setSent}
          />
        )}
      </div>
    </div>
  );
}
