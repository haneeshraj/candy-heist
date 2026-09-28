'use client';

import Link from 'next/link';
import { useId, useRef } from 'react';
import FooterVortex from './FooterVortex';
import styles from './SiteFooter.module.scss';
import type { SiteFooterProps } from './SiteFooter.types';
import { useFooterMotion } from './useFooterMotion';

// "Footer R — Vortex Mask" from the Figma file: the sign-off, the photo
// poured into the vortex mark, the bookings address and two link columns.
// Every group reveals once as it scrolls into view (useFooterMotion).
export default function SiteFooter({ content }: SiteFooterProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const followId = useId();
  const navigateId = useId();
  useFooterMotion(rootRef);

  const { headline, follow, navigate } = content;

  return (
    <footer ref={rootRef} className={styles.footer}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>
          <span className={styles.lead} data-motion="lead">
            {headline.lead}
          </span>{' '}
          <span className={styles.statement} data-motion="statement">
            {headline.statement}
          </span>
        </h2>

        <FooterVortex photo={content.photo} />

        <a
          className={styles.email}
          href={`mailto:${content.email}`}
          data-motion="email"
        >
          {content.email}
        </a>

        <div className={styles.columns}>
          <div className={styles.column} data-motion="column">
            <h3 id={followId} className={styles.columnLabel}>
              {follow.label}
            </h3>
            <ul className={styles.links} aria-labelledby={followId}>
              {follow.links.map((link) => (
                <li key={link.label}>
                  <a
                    className={styles.link}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}{' '}
                    <span className={styles.srOnly}>(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav
            className={styles.column}
            aria-labelledby={navigateId}
            data-motion="column"
          >
            <h3 id={navigateId} className={styles.columnLabel}>
              {navigate.label}
            </h3>
            <ul className={styles.links}>
              {navigate.links.map((link) => (
                <li key={link.label}>
                  <Link className={styles.link} href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.legal}>
          <span className={styles.rule} data-motion="rule" aria-hidden="true" />
          <p className={styles.copyright} data-motion="copyright">
            {content.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
