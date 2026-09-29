'use client';

import Image from 'next/image';
import { useId } from 'react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { RichWordReveal } from '@/components/common/RichWordReveal';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { WordReveal } from '@/components/common/WordReveal';
import type { AboutCopy, AboutPhoto } from '@/content/about/about';
import { AboutLabel } from '../AboutLabel';
import type { RevealBinder } from '../reveals';
import styles from './AboutJourney.module.scss';

interface BehindPanelProps {
  copy: AboutCopy['behind'];
  /** The frame's first photo: his, carried over from the orb. */
  photo: AboutPhoto;
  bind: RevealBinder;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Frame 4: behind the signal. On desktop the orb has squared into the 3:4
// frame on the right; the two paragraphs give way to the roles, one at a
// time, each replacing the last (no stack of the ones already read) while
// the frame cuts to its photo. Phones list the roles under one photo.
export default function BehindPanel({ copy, photo, bind }: BehindPanelProps) {
  const headingId = useId();
  const count = copy.roles.length;

  return (
    <section
      className={`${styles.panel} ${styles.behind}`}
      data-motion="panel-behind"
      aria-labelledby={headingId}
    >
      <div className={styles.column}>
        <AboutLabel text={copy.label} revealKey="behind.label" bind={bind} />
        <h2 id={headingId} className={styles.behindHeadline}>
          <WordReveal
            ref={bind('behind.headline')}
            text={copy.headline}
            trigger="manual"
            staggerDelay={0.06}
          />
        </h2>

        {/* The paragraphs and the roles share one place on desktop. */}
        <div className={styles.behindStack}>
          <div className={styles.behindParagraphs} data-motion="paragraphs">
            {copy.paragraphs.map((paragraph, i) => (
              <RichWordReveal
                key={i}
                ref={bind(`behind.p${i}`)}
                segments={paragraph}
                className={styles.behindParagraph}
                emphasisClassName={styles.emphasis}
                placeholderClassName={styles.placeholder}
                staggerDelay={0.012}
              />
            ))}
          </div>

          <div className={styles.flowFrame} data-motion="flow-frame">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 420px, 90vw"
              className={styles.windowImage}
            />
            <CornerTicks inset={10} size={22} />
          </div>

          <ol className={styles.roles}>
            {copy.roles.map((role, i) => (
              <li key={role.title} className={styles.role} data-motion="role">
                <span className={styles.roleRule} data-motion="role-rule" />
                <span className={styles.roleBar} data-motion="role-bar" />
                <h3 className={styles.roleTitle}>
                  <span className={styles.srOnly}>{role.title}</span>
                  <span aria-hidden="true">
                    <ClipRevealText
                      ref={bind(`role.${i}.title`)}
                      text={role.title}
                      trigger="manual"
                    />
                  </span>
                </h3>
                <p className={styles.roleCounter} data-motion="role-counter">
                  {pad(i + 1)} / {pad(count)}
                </p>
                <WordReveal
                  ref={bind(`role.${i}.body`)}
                  as="p"
                  className={styles.roleBody}
                  text={role.body}
                  trigger="manual"
                  staggerDelay={0.015}
                />
                <RichWordReveal
                  ref={bind(`role.${i}.note`)}
                  segments={role.note}
                  className={styles.roleNote}
                  placeholderClassName={styles.placeholder}
                  staggerDelay={0.015}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
