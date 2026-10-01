'use client';

import Image from 'next/image';
import { useId, useRef, useState, type ComponentType } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { Frame } from '@/components/common/Frame';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import {
  ArrowIcon,
  DjIcon,
  FeedbackIcon,
  MixIcon,
  ProductionIcon,
  SigilIcon,
  type IconProps
} from '@/components/icons';
import type { ServiceIcon } from '@/content/services/catalogue';
import { fill } from '@/lib/text/fill';
import QuoteDots from './QuoteDots';
import styles from './TestimonialsSection.module.scss';
import type {
  TestimonialsReveals,
  TestimonialsSectionProps
} from './TestimonialsSection.types';
import { useQuoteRotation } from './useQuoteRotation';
import { useTestimonialsMotion } from './useTestimonialsMotion';

const GLYPHS: Record<ServiceIcon, ComponentType<IconProps>> = {
  production: ProductionIcon,
  dj: DjIcon,
  feedback: FeedbackIcon,
  mix: MixIcon
};

// "IV v2 · By service" from the Figma file: the stage photo on the left
// fading into the page, and in the column beside it the headline, one
// quote at a time with who said it and what they booked, the dots and
// dashes under it, and the one button, to the booking page. The quotes
// rotate on their own (useQuoteRotation); the section plays in once as it
// comes into view (useTestimonialsMotion).
// The label and headline are paired with a plain copy for assistive tech;
// the quotes' WordReveal carries its own.
export default function TestimonialsSection({
  content
}: TestimonialsSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const slidesRef = useRef<Array<HTMLElement | null>>([]);
  const reveals = useRef<TestimonialsReveals>({
    label: null,
    lead: null,
    statement: null,
    quotes: []
  });
  const [revealed, setRevealed] = useState(false);
  const headingId = useId();
  const { testimonials, headline, controls } = content;
  const rotation = useQuoteRotation({
    count: testimonials.length,
    rootRef,
    slidesRef,
    revealsRef: reveals,
    revealed
  });
  useTestimonialsMotion(rootRef, reveals, () => setRevealed(true));

  const total = testimonials.length;

  return (
    <section
      ref={rootRef}
      id="testimonials"
      className={styles.testimonials}
      aria-labelledby={headingId}
    >
      <div className={styles.backdrop} data-motion="backdrop">
        <Frame travel={120}>
          <div className={styles.photo} data-motion="photo">
            <Image
              src={content.photo.src}
              alt={content.photo.alt}
              fill
              // The left 560 of the 1440 frame; the phone's band is full width.
              sizes="(min-width: 1024px) 39vw, 100vw"
              className={styles.photoImage}
            />
          </div>
        </Frame>
        <span className={styles.shade} aria-hidden="true" />
        <span className={styles.fade} aria-hidden="true" />
      </div>

      <div className={styles.inner}>
        <div className={styles.column} data-motion="column">
          <p className={styles.label}>
            <span className={styles.labelSigil} data-motion="label-sigil">
              <SigilIcon />
            </span>
            <span className={styles.srOnly}>{content.label}</span>
            <span aria-hidden="true">
              <ClipRevealText
                ref={(handle) => {
                  reveals.current.label = handle;
                }}
                text={content.label}
                trigger="manual"
                wipeColor="var(--color-gilt)"
              />
            </span>
          </p>

          <h2 id={headingId} className={styles.headline}>
            <span className={styles.srOnly}>
              {headline.lead} {headline.statement}
            </span>
            <span className={styles.headlineVisual} aria-hidden="true">
              <WordReveal
                ref={(handle) => {
                  reveals.current.lead = handle;
                }}
                className={styles.lead}
                text={headline.lead}
                trigger="manual"
                staggerDelay={0.08}
              />
              <ClipRevealText
                ref={(handle) => {
                  reveals.current.statement = handle;
                }}
                className={styles.statement}
                text={headline.statement}
                trigger="manual"
              />
            </span>
          </h2>

          <div
            className={styles.carousel}
            role="region"
            aria-roledescription="carousel"
            aria-label={content.label}
            {...rotation.hoverProps}
            {...rotation.focusProps}
          >
            <span
              className={styles.quoteMark}
              data-motion="quote-mark"
              aria-hidden="true"
            >
              “
            </span>

            {/* Every quote in one cell, so the height never jumps. */}
            <div
              className={styles.slides}
              aria-live={rotation.running ? 'off' : 'polite'}
            >
              {testimonials.map((t, i) => {
                const on = i === rotation.active;
                const Glyph = GLYPHS[t.service.icon];
                return (
                  <figure
                    key={t.name + t.service.id}
                    ref={(node) => {
                      slidesRef.current[i] = node;
                    }}
                    className={styles.slide}
                    data-motion="slide"
                    data-active={on || undefined}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={fill(controls.slide, { n: i + 1, total })}
                    aria-hidden={!on || undefined}
                    inert={!on}
                  >
                    {/* WordReveal reads out the whole quote itself. */}
                    <blockquote className={styles.quote}>
                      <WordReveal
                        ref={(handle) => {
                          reveals.current.quotes[i] = handle;
                        }}
                        as="p"
                        className={styles.quoteText}
                        text={t.quote}
                        trigger="manual"
                        staggerDelay={0.03}
                      />
                    </blockquote>
                    <figcaption className={styles.credit} data-motion="credit">
                      <span className={styles.creditName}>{t.name}</span>
                      <span className={styles.creditRole}>{t.role}</span>
                      <span className={styles.creditSep} aria-hidden="true">
                        ·
                      </span>
                      <span className={styles.creditService}>
                        <Glyph
                          className={styles.creditGlyph}
                          aria-hidden="true"
                        />
                        {t.service.name}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>

            {total > 1 && (
              <QuoteDots
                count={total}
                active={rotation.active}
                running={rotation.running}
                paused={rotation.paused}
                rotates={rotation.rotates}
                labels={controls}
                onSelect={rotation.goTo}
                onElapsed={rotation.next}
                onTogglePause={rotation.togglePause}
              />
            )}
          </div>
        </div>

        {/* Motion wraps the chip so it never fights the magnetic pull. */}
        <span className={styles.cta} data-motion="cta">
          <SigilChip
            variant="solid"
            href={content.cta.href}
            icon={<ArrowIcon />}
          >
            {content.cta.label}
          </SigilChip>
        </span>
      </div>
    </section>
  );
}
