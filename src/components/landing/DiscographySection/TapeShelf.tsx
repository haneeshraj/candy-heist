'use client';

import { getImageProps } from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { releaseHref } from '@/content/discography/links';
import { SHELF_POOL } from '@/lib/shelf/shelf';
import { TAPE_HULL_CLIP, TAPE_SPRITE } from '@/lib/shelf/tapeSprite';
import styles from './DiscographySection.module.scss';
import type { TapeShelfProps } from './DiscographySection.types';
import {
  createTapeShelf,
  type ShelfCallbacks,
  type TapeShelfEngine
} from './tapeShelfEngine';

// The focused tape is 44% of the band on desktop, 64% on phones.
const TAPE_SIZES = '(min-width: 1024px) 44vw, 64vw';

// The 2.5D shelf: a fixed pool of tape links that tapeShelfEngine places,
// recycles and runs. On desktop the lifted tape opens its release and the
// others come forward when clicked; on phones the row only runs, so the
// whole thing is decorative there (inert, hidden from assistive tech).
export default function TapeShelf({
  releases,
  label,
  layout,
  interactive,
  reducedMotion,
  onFocus,
  children
}: TapeShelfProps) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const engineRef = useRef<TapeShelfEngine | null>(null);
  const callbacksRef = useRef<ShelfCallbacks>({ onFocus, onOpen: () => {} });

  // Optimised sources for every tape, set straight onto the recycled <img>s.
  const sources = useMemo(
    () =>
      releases.map((release) => {
        const { props } = getImageProps({
          src: release.tape,
          alt: '',
          width: TAPE_SPRITE.width,
          height: TAPE_SPRITE.height,
          sizes: TAPE_SIZES
        });
        return {
          src: props.src,
          srcSet: props.srcSet,
          sizes: props.sizes,
          href: releaseHref(release.slug),
          label: `${release.title}, ${release.artist}`
        };
      }),
    [releases]
  );

  useEffect(() => {
    callbacksRef.current = {
      onFocus,
      onOpen: (index) => router.push(sources[index].href)
    };
  });

  // One engine per catalogue; layout, interactivity and motion flow in below.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const engine = createTapeShelf({
      viewport,
      slots: slotRefs.current,
      sources,
      layout,
      interactive,
      reducedMotion,
      callbacks: () => callbacksRef.current
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources]);

  useEffect(() => engineRef.current?.setLayout(layout), [layout]);
  useEffect(
    () => engineRef.current?.setInteractive(interactive),
    [interactive]
  );
  useEffect(
    () => engineRef.current?.setReducedMotion(reducedMotion),
    [reducedMotion]
  );

  return (
    <div
      ref={viewportRef}
      className={styles.shelf}
      role={interactive ? 'group' : undefined}
      aria-roledescription={interactive ? 'carousel' : undefined}
      aria-label={interactive ? label : undefined}
      aria-hidden={interactive ? undefined : true}
      data-interactive={interactive}
    >
      {children}
      <div className={styles.stage} inert={!interactive}>
        {Array.from({ length: SHELF_POOL }, (_, i) => (
          <a
            key={i}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            className={styles.tape}
            tabIndex={-1}
            draggable={false}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- recycled imperatively; sources come from getImageProps */}
            <img
              className={styles.tapeImage}
              alt=""
              width={TAPE_SPRITE.width}
              height={TAPE_SPRITE.height}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <span
              className={styles.tapeHit}
              style={{ clipPath: TAPE_HULL_CLIP }}
            />
          </a>
        ))}
      </div>
      <span className={styles.shelfFadeTop} aria-hidden="true" />
      <span className={styles.shelfFadeBottom} aria-hidden="true" />
    </div>
  );
}
