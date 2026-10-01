'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './TermsPage.module.scss';
import type { TermsPageProps } from './TermsPage.types';

/** A paragraph, with the booking email made a link where it's named. */
function Paragraph({ text, email }: { text: string; email: string }) {
  const [before, after] = text.split('{email}');
  return (
    <p className={styles.paragraph} data-reveal>
      {before}
      {after !== undefined ? (
        <>
          <Link className={styles.email} href={`mailto:${email}`}>
            {email}
          </Link>
          {after}
        </>
      ) : null}
    </p>
  );
}

// The terms: the headline, when they were last changed, then each part
// with its heading beside its words, rising in as they come into view,
// and the way back to booking.
export default function TermsPage({ content, email }: TermsPageProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useEntrance(heroRef, { delay: 0.1 });
  useScrollReveal(bodyRef);

  return (
    <div className={styles.page}>
      <header ref={heroRef} className={styles.hero}>
        <p className={styles.label} data-enter>
          <SigilIcon className={styles.labelGlyph} />
          {content.label}
        </p>
        <h1 className={styles.headline}>
          <span className={styles.srOnly}>
            {content.lead} {content.statement}
          </span>
          <span className={styles.headlineVisual} aria-hidden="true">
            <WordReveal
              className={styles.lead}
              text={content.lead}
              trigger="mount"
              staggerDelay={0.08}
            />
            <ClipRevealText
              className={styles.statement}
              text={content.statement}
              trigger="mount"
              startDelay={0.3}
            />
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.intro}
          text={content.intro}
          trigger="mount"
          startDelay={0.5}
          staggerDelay={0.02}
        />
        <p className={styles.updated} data-enter>
          {content.updated}
        </p>
      </header>

      <div ref={bodyRef} className={styles.body}>
        {content.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.heading} data-reveal>
              {section.heading}
            </h2>
            <div className={styles.paragraphs}>
              {section.paragraphs.map((text) => (
                <Paragraph key={text} text={text} email={email} />
              ))}
            </div>
          </section>
        ))}
        <div className={styles.cta} data-reveal>
          <SigilChip
            variant="outline"
            icon={<ArrowIcon />}
            href={content.cta.href}
          >
            {content.cta.label}
          </SigilChip>
        </div>
      </div>
    </div>
  );
}
