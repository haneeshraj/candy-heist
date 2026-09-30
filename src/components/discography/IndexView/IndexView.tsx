'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, type FocusEvent } from 'react';
import { ArrowIcon } from '@/components/icons';
import type { DiscographyCopy } from '@/content/discography/discography';
import { releaseHref } from '@/content/discography/links';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { yearOf } from '@/lib/discography/catalogue';
import { KIND_LABEL } from '@/lib/discography/format';
import { artistLine, type ReleaseSummary } from '@/lib/discography/summary';
import styles from './IndexView.module.scss';

interface IndexViewProps {
  copy: DiscographyCopy['page'];
  releases: ReleaseSummary[];
}

const pad = (n: number) => String(n).padStart(2, '0');

// Figma "Discography — Index view": the catalogue set as type, a title a
// row. The release pointed at (or focused) shows its cover beside its row;
// on phones each row carries a small cover instead.
export default function IndexView({ copy, releases }: IndexViewProps) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<{ index: number; top: number } | null>(
    null
  );
  useScrollReveal(listRef);

  // The cover rides level with the middle of its row.
  const show = (index: number, row: HTMLElement) => {
    const size = previewRef.current?.offsetHeight ?? 0;
    setActive({ index, top: row.offsetTop + row.offsetHeight / 2 - size / 2 });
  };
  const hideOnBlur = (event: FocusEvent<HTMLOListElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
      setActive(null);
  };
  const current = active ? releases[active.index] : undefined;

  return (
    <div className={styles.index}>
      <ol
        ref={listRef}
        className={styles.list}
        onPointerLeave={() => setActive(null)}
        onBlur={hideOnBlur}
      >
        {releases.map((release, i) => {
          const year = yearOf(release);
          return (
            <li
              key={release.slug}
              className={styles.row}
              data-reveal
              data-active={active?.index === i || undefined}
              onPointerEnter={(event) => show(i, event.currentTarget)}
            >
              <Link
                className={styles.link}
                href={releaseHref(release.slug)}
                onFocus={(event) =>
                  show(i, event.currentTarget.parentElement as HTMLElement)
                }
              >
                <span className={styles.number}>{pad(i + 1)}</span>
                <span className={styles.thumb}>
                  <Image src={release.cover.src} alt="" fill sizes="56px" />
                </span>
                <span className={styles.title}>{release.title}</span>
                <span className={styles.artist}>{artistLine(release)}</span>
                <span className={styles.facts}>
                  <span>{KIND_LABEL[release.kind].one}</span>
                  <span
                    className={styles.when}
                    data-forthcoming={release.forthcoming || undefined}
                  >
                    {release.forthcoming ? copy.forthcoming : (year ?? '')}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div
        ref={previewRef}
        className={styles.preview}
        data-shown={Boolean(current)}
        style={{ top: active?.top ?? 0 }}
        aria-hidden="true"
      >
        {current && (
          <Image
            key={current.slug}
            src={current.cover.src}
            alt=""
            fill
            sizes="280px"
            className={styles.previewImage}
          />
        )}
        <span className={styles.previewRing}>
          <ArrowIcon />
        </span>
      </div>
    </div>
  );
}
