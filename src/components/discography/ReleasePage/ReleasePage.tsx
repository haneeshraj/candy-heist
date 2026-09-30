'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Fragment,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { SigilChip } from '@/components/common/SigilChip';
import { StarField } from '@/components/common/StarField';
import { ArrowIcon } from '@/components/icons';
import { releaseHref } from '@/content/discography/links';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { isOneTrack } from '@/lib/discography/catalogue';
import {
  formatDate,
  KIND_LABEL,
  PLATFORM_LABEL,
  totalDuration,
  trackCount
} from '@/lib/discography/format';
import { billing, pageRecord, rowHref } from '@/lib/discography/tracks';
import { fill } from '@/lib/text/fill';
import { titleSize } from '@/lib/text/titleSize';
import { ArtworkViewer, COVER_SIZES, type ArtworkFace } from '../ArtworkViewer';
import { CopyLinkButton } from '../CopyLinkButton';
import { Countdown, useReleaseClock } from '../Countdown';
import { IconSquare } from '../IconSquare';
import { PLATFORM_GLYPH } from '../platformGlyphs';
import { ReleaseCard } from '../ReleaseCard';
import styles from './ReleasePage.module.scss';
import type { ReleasePageProps } from './ReleasePage.types';

// Figma "Release page · released" and "· forthcoming", one template for
// every kind: the cover on the left (Cover | Canvas when there's a
// canvas; either opens large), and on the right the kind and date, the
// title, the artist, then the platforms it's on, or, before it's out, the
// countdown and Pre-save; copy link after either; and the credits and
// label as one table. An album or EP adds its running order under that,
// each named track a link to its own page; more releases to go on to
// close the page. On the day it's out, the page turns from the countdown
// to the platforms by itself.
//
// A track's own page is the same page of its release, of the track: its
// title and artist in the release's cover, "From" the release where the
// kind would be, and the running order marking where it sits. A single
// an album carries says it's also on it.
export default function ReleasePage({
  copy,
  forthcoming,
  release,
  position,
  alsoOn = [],
  more,
  renderedAt
}: ReleasePageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const artRef = useRef<HTMLButtonElement | null>(null);
  const runningId = useId();
  const moreId = useId();
  const [face, setFace] = useState<ArtworkFace>('cover');
  const [viewer, setViewer] = useState<ArtworkFace | null>(null);
  const { out, left } = useReleaseClock(release.date, renderedAt);
  useEntrance(rootRef, { delay: 0.1 });
  useScrollReveal(rootRef);

  const record = pageRecord(release, position);
  const date = release.date ? formatDate(release.date) : null;
  const when = date && (out ? date : fill(copy.out, { date }));
  // The albums a single is also on, a row of their own; then the credits,
  // the label and the date, two to a row. The label always starts a row,
  // so the two of them close the table together.
  const details: Array<{ key: string; value: ReactNode; col: 0 | 1 }> = [
    ...(alsoOn.length
      ? [
          {
            key: copy.alsoOn,
            value: alsoOn.map((r, i) => (
              <Fragment key={r.slug}>
                {i > 0 && ', '}
                <Link className={styles.link} href={releaseHref(r.slug)}>
                  {r.title}
                </Link>
              </Fragment>
            )),
            col: 0 as const
          }
        ]
      : []),
    ...release.credits.map((c, i) => ({
      key: c.role,
      value: c.names.join(', '),
      col: (i % 2) as 0 | 1
    })),
    ...(release.label
      ? [{ key: copy.label, value: release.label, col: 0 as const }]
      : []),
    ...(date
      ? [
          {
            key: out ? copy.released : copy.releaseDate,
            value: date,
            col: (release.label ? 1 : release.credits.length % 2) as 0 | 1
          }
        ]
      : [])
  ];
  const streams = release.distribution.filter((d) => d.streamUrl);
  const tracks = release.tracks;
  const time = totalDuration(tracks);
  // The running order runs down two columns, the first half on the left.
  const rows = Math.ceil(tracks.length / 2);

  return (
    <div
      ref={rootRef}
      className={styles.page}
      style={
        {
          '--title-size': titleSize(record.title, 608, 96),
          '--title-size-sm': titleSize(record.title, 342, 48)
        } as CSSProperties
      }
    >
      <div className={styles.sky} aria-hidden="true">
        <div className={styles.skyPin}>
          <StarField className={styles.stars} />
        </div>
      </div>

      <div className={styles.body}>
        {/* A track's way back is its release. */}
        <Link
          className={styles.back}
          href={record.from?.href ?? '/discography'}
          data-enter
        >
          ← {record.from?.title ?? copy.back}
        </Link>

        <div className={styles.top}>
          <div className={styles.art} data-enter>
            {record.canvas && (
              <div className={styles.faces}>
                {(['cover', 'canvas'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={styles.face}
                    aria-pressed={face === f}
                    onClick={() => setFace(f)}
                  >
                    {copy[f]}
                  </button>
                ))}
              </div>
            )}
            <button
              ref={artRef}
              type="button"
              className={styles.artButton}
              onClick={() => setViewer(face)}
            >
              {face === 'canvas' && record.canvas ? (
                <video
                  className={styles.canvas}
                  src={record.canvas.src}
                  poster={record.canvas.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                // The button says what it does; the viewer describes the art.
                <Image
                  src={release.cover.src}
                  alt=""
                  fill
                  priority
                  sizes={COVER_SIZES}
                  className={styles.cover}
                />
              )}
              <span className={styles.srOnly}>
                {face === 'canvas' ? copy.viewCanvas : copy.viewArtwork}
              </span>
            </button>
          </div>

          <div className={styles.info}>
            <p
              className={styles.kicker}
              data-forthcoming={!out || undefined}
              data-enter
            >
              <span>
                {record.from ? (
                  <>
                    {copy.from}{' '}
                    <Link className={styles.link} href={record.from.href}>
                      {record.from.title}
                    </Link>
                  </>
                ) : (
                  KIND_LABEL[release.kind].one
                )}
                {/* Kept whole, so a line too narrow breaks at the dot. */}
                {when && (
                  <>
                    {' · '}
                    <span className={styles.when}>{when}</span>
                  </>
                )}
              </span>
            </p>
            <h1 className={styles.title}>
              <span className={styles.srOnly}>{record.title}</span>
              <span aria-hidden="true">
                <ClipRevealText
                  text={record.title}
                  trigger="mount"
                  startDelay={0.15}
                />
              </span>
            </h1>
            <p className={styles.artist} data-enter>
              {billing(record, copy.featuring)}
            </p>

            <div className={styles.actions} data-enter>
              {out ? (
                streams.length > 0 && (
                  <>
                    <ul
                      className={styles.platforms}
                      aria-label={copy.platforms}
                    >
                      {streams.map((d) => {
                        const Glyph = PLATFORM_GLYPH[d.platform];
                        return (
                          <li key={d.platform}>
                            <IconSquare
                              href={d.streamUrl!}
                              label={fill(copy.listenOn, {
                                platform: PLATFORM_LABEL[d.platform]
                              })}
                            >
                              <Glyph />
                            </IconSquare>
                          </li>
                        );
                      })}
                    </ul>
                    <span className={styles.divider} aria-hidden="true" />
                  </>
                )
              ) : (
                <>
                  {left && (
                    <Countdown
                      className={styles.countdown}
                      left={left}
                      copy={copy.countdown}
                    />
                  )}
                  <SigilChip
                    variant="solid"
                    href={record.share}
                    icon={<ArrowIcon />}
                  >
                    {copy.presave}
                  </SigilChip>
                </>
              )}
              <CopyLinkButton
                path={record.share}
                label={copy.copyLink}
                copiedLabel={copy.copied}
              />
            </div>

            {details.length > 0 && (
              <dl className={styles.details} data-enter>
                {details.map(({ key, value, col }) => (
                  <div key={key} className={styles.detail} data-col={col}>
                    <dt className={styles.detailKey}>{key}</dt>
                    <dd className={styles.detailValue}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {tracks.length > 1 && (
          <section className={styles.running} aria-labelledby={runningId}>
            <div className={styles.sectionHead} data-reveal>
              <h2 id={runningId} className={styles.sectionLabel}>
                {copy.runningOrder}
              </h2>
              <p className={styles.sectionNote}>
                {trackCount(tracks.length)}
                {time ? ` · ${time}` : ''}
              </p>
            </div>
            <ol
              className={styles.tracks}
              style={{ '--rows': rows } as CSSProperties}
            >
              {tracks.map((track, i) => {
                // This page's own track is marked, not linked.
                const current = position === i + 1;
                const href = current ? null : rowHref(release, track);
                return (
                  <li
                    key={`${i}-${track.title}`}
                    className={styles.track}
                    data-column-start={i === 0 || i === rows || undefined}
                    data-current={current || undefined}
                    data-reveal
                  >
                    <span className={styles.trackNumber}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.trackTitle}>
                      {href ? (
                        <Link className={styles.trackLink} href={href}>
                          {track.title}
                        </Link>
                      ) : (
                        <span aria-current={current ? 'page' : undefined}>
                          {track.title}
                        </span>
                      )}
                      {track.featuring && (
                        <span className={styles.trackAside}>
                          {fill(copy.featuring, {
                            names: track.featuring.join(', ')
                          })}
                        </span>
                      )}
                      {track.artist && track.artist !== release.artist && (
                        <span className={styles.trackAside}>
                          {track.artist}
                        </span>
                      )}
                    </span>
                    <span className={styles.trackTime}>
                      {track.duration ?? '—'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {more.length > 0 && (
          <section className={styles.more} aria-labelledby={moreId}>
            <div className={styles.sectionHead} data-reveal>
              <h2 id={moreId} className={styles.sectionLabel}>
                {isOneTrack(release) ? copy.moreSingles : copy.moreCollections}
              </h2>
            </div>
            <ul className={styles.moreGrid}>
              {more.map((r) => (
                <li key={r.slug} data-reveal>
                  <ReleaseCard
                    release={r}
                    forthcoming={forthcoming}
                    showArtist={false}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ArtworkViewer
        // The artwork is the release's, a track's page's too: the caption
        // names it. A track has no canvas of its own.
        release={{
          title: release.title,
          cover: release.cover,
          canvas: record.canvas,
          credits: release.credits
        }}
        copy={copy}
        open={viewer}
        originRef={artRef}
        // The page shows the same face, so it flies back into the right one.
        onFace={(f) => {
          setFace(f);
          setViewer(f);
        }}
        onClose={() => setViewer(null)}
      />
    </div>
  );
}
