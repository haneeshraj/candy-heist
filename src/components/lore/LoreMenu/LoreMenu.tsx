'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import {
  chapterHref,
  type LoreChapterSummary,
  type LoreCopy
} from '@/content/lore/lore';
import { toRoman } from '@/lib/text/roman';
import styles from './LoreMenu.module.scss';

interface LoreMenuProps {
  copy: LoreCopy['menu'];
  chapters: LoreChapterSummary[];
  /** The chapter being read. */
  current: number;
}

// The orbit in miniature: a dot per chapter and one for the next.
function MiniOrbit({ count, current }: { count: number; current: number }) {
  return (
    <svg className={styles.mini} viewBox="0 0 72 72" aria-hidden="true">
      <circle className={styles.miniRing} cx="36" cy="36" r="30" />
      {Array.from({ length: count + 1 }, (_, i) => {
        const a = ((-90 + (i / (count + 1)) * 360) * Math.PI) / 180;
        const state =
          i === count
            ? 'next'
            : i < current
              ? 'read'
              : i === current
                ? 'current'
                : 'future';
        return (
          <circle
            key={i}
            className={styles.miniNode}
            data-state={state}
            cx={(36 + 30 * Math.cos(a)).toFixed(2)}
            cy={(36 + 30 * Math.sin(a)).toFixed(2)}
            r={state === 'current' ? 3.2 : 2.4}
          />
        );
      })}
    </svg>
  );
}

// Figma "Lore A · 5": on a chapter, a small orbit pinned top right shows
// where you are, and opens the list of chapters to go to any of them.
export default function LoreMenu({ copy, chapters, current }: LoreMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const count = chapters.length;

  // Escape or a click elsewhere closes it; Escape hands focus back.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      const menu = toggleRef.current?.parentElement;
      if (menu && !menu.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const position = copy.position
    .replace('{current}', toRoman(current + 1))
    .replace('{total}', toRoman(count));

  return (
    // The track spans the page, so the menu lets go at its end instead of
    // staying over the footer.
    <div className={styles.track}>
      <div className={styles.menu}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((was) => !was)}
        >
          <span className={styles.position} aria-hidden="true">
            {position}
          </span>
          <MiniOrbit count={count} current={current} />
          <span className={styles.srOnly}>{open ? copy.close : copy.open}</span>
        </button>

        <nav
          id={panelId}
          className={styles.panel}
          data-open={open}
          aria-label={copy.open}
          hidden={!open}
        >
          <p className={styles.panelLabel}>{copy.open}</p>
          <ol className={styles.list}>
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  className={styles.link}
                  href={chapterHref(chapter.slug)}
                  aria-current={chapter.index === current ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.linkNumeral}>{chapter.numeral}</span>
                  <span className={styles.linkTitle}>{chapter.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
