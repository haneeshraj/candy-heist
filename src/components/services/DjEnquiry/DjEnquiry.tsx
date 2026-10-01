'use client';

import Image from 'next/image';
import { useLenis } from 'lenis/react';
import { useEffect, useId, useRef, useState } from 'react';
import { StepHeading } from '@/components/booking/StepHeading';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { CornerTicks } from '@/components/common/CornerTicks';
import { Frame } from '@/components/common/Frame';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { SentEnquiry } from '@/lib/enquiry/sendEnquiry';
import styles from './DjEnquiry.module.scss';
import type { DjEnquiryProps } from './DjEnquiry.types';
import EnquiryForm from './EnquiryForm';
import EnquirySent from './EnquirySent';

// "Book me as a DJ" (Figma "DJ · 1 · Enquiry form"): the headline, then the
// enquiry beside a framed photo and the email for anyone who'd rather
// write. Once it's sent, the form gives way to "Sent." and a slip of what
// went, brought into view.
export default function DjEnquiry({ content, contact }: DjEnquiryProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const formHeadingId = useId();
  const lenis = useLenis();
  const [sent, setSent] = useState<SentEnquiry | null>(null);
  useEntrance(heroRef, { delay: 0.1 });
  useScrollReveal(asideRef);

  const { intro, form, aside } = content;

  // The confirmation replaces the form where it stood: bring its top in.
  useEffect(() => {
    const body = bodyRef.current;
    if (!sent || !body || body.getBoundingClientRect().top >= 0) return;
    if (lenis) lenis.scrollTo(body, { offset: -32 });
    else body.scrollIntoView({ behavior: 'smooth' });
  }, [sent, lenis]);

  return (
    <div className={styles.page}>
      <header ref={heroRef} className={styles.hero}>
        <h1 className={styles.headline}>
          <span className={styles.srOnly}>
            {intro.lead} {intro.statement}
          </span>
          <span className={styles.headlineVisual} aria-hidden="true">
            <WordReveal
              className={styles.lead}
              text={intro.lead}
              trigger="mount"
              staggerDelay={0.08}
            />
            <ClipRevealText
              className={styles.statement}
              text={intro.statement}
              trigger="mount"
              startDelay={0.3}
            />
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.intro}
          text={intro.body}
          trigger="mount"
          startDelay={0.5}
          staggerDelay={0.02}
        />
        <div className={styles.divider} data-enter aria-hidden="true">
          <span className={styles.dividerLine} />
          <SigilIcon className={styles.dividerSigil} />
          <span className={styles.dividerLine} />
        </div>
      </header>

      <div ref={bodyRef} className={styles.body}>
        {sent ? (
          <EnquirySent copy={content.sent} sent={sent} contact={contact} />
        ) : (
          <div className={styles.enquiry}>
            <div className={styles.main}>
              <StepHeading
                id={formHeadingId}
                label={form.label}
                heading={form.heading}
                sub={form.sub}
                trigger="inView"
                delay={0.4}
              />
              <EnquiryForm
                copy={form}
                labelledBy={formHeadingId}
                onSent={setSent}
              />
            </div>

            <aside ref={asideRef} className={styles.aside}>
              <div className={styles.photo} data-reveal>
                <Frame travel={80}>
                  <Image
                    src={aside.photo.src}
                    alt={aside.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    className={styles.photoImage}
                  />
                </Frame>
                <CornerTicks />
              </div>
              <p className={styles.write} data-reveal>
                <span className={styles.writeLabel}>{aside.write}</span>
                <a
                  className={styles.writeLink}
                  href={`mailto:${contact.email}`}
                >
                  {contact.email}
                </a>
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
