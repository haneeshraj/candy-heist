import type { ComponentType } from 'react';
import { ScrambleText } from '@/components/common/ScrambleText';
import { WordReveal } from '@/components/common/WordReveal';
import {
  DjIcon,
  FeedbackIcon,
  MixIcon,
  ProductionIcon,
  type IconProps
} from '@/components/icons';
import type { SessionIcon } from '@/content/home/sessions';
import styles from './SessionsSection.module.scss';
import type { SessionsListProps } from './SessionsSection.types';

const GLYPHS: Record<SessionIcon, ComponentType<IconProps>> = {
  production: ProductionIcon,
  dj: DjIcon,
  feedback: FeedbackIcon,
  mix: MixIcon
};

// Capitals only while a name decodes, so the flicker matches the set type.
const NAME_SCRAMBLE = { range: [65, 90] as [number, number] };

// Name and one line per service, no per-item action: the section's one
// button leads to the booking page, which handles the choice.
export default function SessionsList({
  services,
  registerName,
  registerSummary
}: SessionsListProps) {
  return (
    <>
      <ul className={styles.list} data-motion="list">
        {services.map((service, i) => {
          const Glyph = GLYPHS[service.icon];
          return (
            <li
              key={service.id}
              className={styles.service}
              data-motion="service"
            >
              <span
                className={styles.rule}
                data-motion="rule"
                aria-hidden="true"
              />
              <span className={styles.serviceIcon} data-motion="icon">
                <Glyph />
              </span>
              <h3 className={styles.serviceName}>
                <span className={styles.srOnly}>{service.name}</span>
                <span aria-hidden="true">
                  <ScrambleText
                    ref={(handle) => registerName(i, handle)}
                    text={service.name}
                    trigger="manual"
                    staggerDelay={0.03}
                    letterDuration={0.7}
                    scramble={NAME_SCRAMBLE}
                  />
                </span>
              </h3>
              <WordReveal
                ref={(handle) => registerSummary(i, handle)}
                as="p"
                className={styles.serviceSummary}
                text={service.summary}
                trigger="manual"
                staggerDelay={0.035}
                wordDuration={0.8}
              />
            </li>
          );
        })}
      </ul>
      <span
        className={styles.listEnd}
        data-motion="rule-end"
        aria-hidden="true"
      />
    </>
  );
}
