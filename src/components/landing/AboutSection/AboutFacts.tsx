import { Fragment } from 'react';
import styles from './AboutSection.module.scss';
import type { AboutFactsProps } from './AboutSection.types';

export default function AboutFacts({ facts, side }: AboutFactsProps) {
  return (
    <div className={styles.factsWrap} data-side={side}>
      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div
            key={fact.label}
            className={styles.fact}
            data-motion={`fact-${side}`}
          >
            <span className={styles.factTick} aria-hidden="true" />
            <dt className={styles.factLabel}>{fact.label}</dt>
            <dd className={styles.factValue}>
              {fact.value.map((line, i) => (
                <Fragment key={line}>
                  {i > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
