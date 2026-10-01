'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId } from 'react';
import { StarField } from '@/components/common/StarField';
import { VortexMark } from '@/components/common/VortexMark';
import type { DiscographyCopy } from '@/content/discography/discography';
import type { Release } from '@/content/discography/releases';
import {
  formatDate,
  KIND_LABEL,
  PRESAVE_LABEL
} from '@/lib/discography/format';
import { billing, pageRecord } from '@/lib/discography/tracks';
import { fill } from '@/lib/text/fill';
import { Countdown, useReleaseClock } from '../Countdown';
import PlatformButton from './PlatformButton';
import styles from './SharePage.module.scss';

interface SharePageProps {
  copy: DiscographyCopy;
  release: Release;
  /** A track's share page: its place in the release's running order, from 1. */
  position?: number;
  /** When the server made the page: the clock's first reading. */
  renderedAt: number;
}

// Figma "Share link page": a page per release, made to be shared, always
// 9:16 (it fits the screen's height on desktop, its width on phones, and
// screenshots as a story). The cover, blurred, behind it. Once it's out:
// the platforms to play it on. Before: the
// countdown and where to pre-save it; it turns by itself on the day. No
// navbar or footer, only the copyright. A track on a release has one too:
// the track, in the release's cover, "From" the release.
export default function SharePage({
  copy,
  release,
  position,
  renderedAt
}: SharePageProps) {
  const titleId = useId();
  const { out, left } = useReleaseClock(release.date, renderedAt);
  const record = pageRecord(release, position);
  const date = release.date ? formatDate(release.date) : null;
  const meta = [
    record.from
      ? `${copy.release.from} ${record.from.title}`
      : KIND_LABEL[release.kind].one,
    date && (out ? date : fill(copy.release.out, { date }))
  ]
    .filter(Boolean)
    .join(' · ');
  const links = release.distribution.flatMap((d) => {
    const href = out ? d.streamUrl : d.presaveUrl;
    if (!href) return [];
    return [
      {
        platform: d.platform,
        href,
        action: out
          ? undefined
          : (PRESAVE_LABEL[d.platform] ?? copy.share.presave)
      }
    ];
  });
  const copyright = release.date
    ? fill(copy.share.copyright, { year: release.date.slice(0, 4) })
    : copy.share.copyrightUndated;

  return (
    <main className={styles.screen}>
      <StarField className={styles.stars} />
      <article className={styles.card} aria-labelledby={titleId}>
        <div className={styles.backdrop} aria-hidden="true">
          {/* The largest thing on the card, so it loads at once. */}
          <Image
            src={release.cover.src}
            alt=""
            fill
            loading="eager"
            sizes="540px"
            className={styles.backdropBlur}
          />
          <span className={styles.shade} />
        </div>

        <div className={styles.content}>
          <Link className={styles.logo} href="/">
            <VortexMark className={styles.logoMark} />
            <span className={styles.srOnly}>{copy.share.home}</span>
          </Link>
          <div className={styles.cover}>
            <Image
              src={release.cover.src}
              alt={release.cover.alt}
              fill
              priority
              sizes="(min-width: 540px) 280px, 52vw"
              className={styles.coverImage}
            />
          </div>
          <h1 id={titleId} className={styles.title}>
            {record.title}
          </h1>
          <p className={styles.artist}>
            {billing(record, copy.release.featuring)}
          </p>
          <p className={styles.meta} data-forthcoming={!out || undefined}>
            {meta}
          </p>
          {!out && left && (
            <Countdown
              className={styles.countdown}
              left={left}
              copy={copy.release.countdown}
              size="card"
            />
          )}
          <ul className={styles.buttons}>
            {links.map((link, i) => (
              <li key={link.platform}>
                <PlatformButton
                  platform={link.platform}
                  href={link.href}
                  action={link.action}
                  solid={i === 0}
                />
              </li>
            ))}
          </ul>
          <p className={styles.copyright}>{copyright}</p>
        </div>
      </article>
    </main>
  );
}
