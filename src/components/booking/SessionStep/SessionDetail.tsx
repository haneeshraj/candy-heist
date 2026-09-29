'use client';

import Image from 'next/image';
import { useId, useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { CornerTicks } from '@/components/common/CornerTicks';
import { Frame } from '@/components/common/Frame';
import { ScrambleText } from '@/components/common/ScrambleText';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './SessionStep.module.scss';
import type { SessionDetailProps } from './SessionStep.types';

const CAPITALS = { range: [65, 90] as [number, number] };

// Everything about one session. It's mounted fresh for each session, so
// the top writes itself in straight away and each block below rises in as
// it scrolls into view: the column can run long.
export default function SessionDetail({ copy, service }: SessionDetailProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useEntrance(rootRef, { stagger: 0.08 });
  useScrollReveal(rootRef);

  const [first, ...rest] = service.overview;

  return (
    <article ref={rootRef} className={styles.detail} aria-labelledby={titleId}>
      <div className={styles.photo} data-enter>
        <Frame travel={80}>
          <Image
            src={service.photos.wide}
            alt={service.photos.alt}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className={styles.photoImage}
          />
        </Frame>
        <CornerTicks />
      </div>

      <p className={styles.meta}>
        <span className={styles.srOnly}>{service.meta}</span>
        <span aria-hidden="true">
          <ClipRevealText
            text={service.meta}
            trigger="mount"
            startDelay={0.2}
            staggerDelay={0.02}
            wipeColor="var(--color-gilt)"
          />
        </span>
      </p>
      <h2 id={titleId} className={styles.title}>
        <span className={styles.srOnly}>{service.name}</span>
        <span aria-hidden="true">
          <ScrambleText
            text={service.name}
            trigger="mount"
            startDelay={0.3}
            staggerDelay={0.035}
            scramble={CAPITALS}
          />
        </span>
      </h2>
      <WordReveal
        as="p"
        className={styles.lede}
        text={first}
        trigger="mount"
        startDelay={0.55}
        staggerDelay={0.018}
      />
      {rest.map((paragraph) => (
        <WordReveal
          key={paragraph}
          as="p"
          className={styles.paragraph}
          text={paragraph}
          trigger="inView"
          staggerDelay={0.012}
        />
      ))}

      <dl className={styles.facts} data-reveal>
        {service.facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt className={styles.blockLabel}>{fact.label}</dt>
            <dd className={styles.factValue}>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section className={styles.block} data-reveal>
        <h3 className={styles.blockLabel}>{copy.included}</h3>
        <ul className={styles.bullets}>
          {service.included.map((item) => (
            <li key={item} className={styles.bullet}>
              <SigilIcon className={styles.bulletSigil} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {service.howItRuns.length ? (
        <section className={styles.block} data-reveal>
          <h3 className={styles.blockLabel}>{copy.howItRuns}</h3>
          <ol className={styles.timeline}>
            {service.howItRuns.map((step) => (
              <li key={step.title} className={styles.timelineStep} data-reveal>
                <span className={styles.timelineAt}>{step.at}</span>
                <span className={styles.timelineBody}>
                  <span className={styles.timelineTitle}>{step.title}</span>
                  <span className={styles.timelineText}>{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className={styles.pair}>
        {service.goodFor.length ? (
          <section className={styles.block} data-reveal>
            <h3 className={styles.blockLabel}>{copy.goodFor}</h3>
            <ul className={styles.bullets}>
              {service.goodFor.map((item) => (
                <li key={item} className={styles.bullet}>
                  <SigilIcon className={styles.bulletSigil} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {service.bring.length ? (
          <section className={styles.block} data-reveal>
            <h3 className={styles.blockLabel}>{copy.bring}</h3>
            <ul className={styles.bullets}>
              {service.bring.map((item) => (
                <li key={item} className={styles.bullet}>
                  <SigilIcon className={styles.bulletSigil} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
