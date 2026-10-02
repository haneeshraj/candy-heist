'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NayaraPlanet } from '@/components/common/NayaraPlanet';
import { StarField } from '@/components/common/StarField';
import type { LoreChapterSummary, LoreCopy } from '@/content/lore/lore';
import { DEFAULT_PRESET } from '@/lib/planets/engine';
import { gsap } from '@/lib/animation/gsap';
import Orbit from './Orbit';
import styles from './LoreStage.module.scss';

interface LoreStageProps {
  /** The index's pose (right of the copy) or a chapter's (on the left). */
  layout: 'index' | 'reader';
  chapters: LoreChapterSummary[];
  copy: LoreCopy['index'];
  /** The chapter being read, or -1 on the index. */
  current?: number;
  /** On the index, the chapter previewed (it keeps the last one hovered). */
  selected?: number;
  onSelect?: (index: number) => void;
}

// The orrery behind the lore pages (desktop only): Nayara, the orbit of
// chapters round it, and the resonance rings. It pins to the screen while
// the page scrolls over it. The planet takes the look of the chapter
// hovered, or else of the one previewed or being read.
export default function LoreStage({
  layout,
  chapters,
  copy,
  current = -1,
  selected = 0,
  onSelect
}: LoreStageProps) {
  const planetRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  // With no chapter yet, the planet still stands, in its first look.
  const layers = useMemo(
    () =>
      chapters.length
        ? chapters.map(({ planet, render }) => ({ planet, render }))
        : [{ planet: DEFAULT_PRESET.spec }],
    [chapters]
  );
  const shown = current >= 0 ? current : selected;
  const look = hovered ?? shown;
  const caption = chapters[look];

  const select = (index: number | null) => {
    setHovered(index);
    if (index !== null) onSelect?.(index);
  };

  // Crossfades to the new look. The first render already shows the right
  // one, so nothing moves until the look changes.
  const firstLook = useRef(look);
  useEffect(() => {
    const planet = planetRef.current;
    if (!planet || firstLook.current === look) return;
    firstLook.current = -1;
    planet
      .querySelectorAll<SVGGElement>('[data-planet-look]')
      .forEach((layer) => {
        const index = Number(layer.dataset.planetLook);
        gsap.to(layer, {
          opacity: index === look ? 1 : 0,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: true
        });
      });
  }, [look]);

  return (
    // The track spans the whole page and clips to it, so the pinned stage
    // lets go at the page's end instead of staying over the footer.
    <div className={styles.track} data-layout={layout}>
      <div className={styles.stage} data-motion="stage">
        <StarField className={styles.stars} twinkle />
        <div className={styles.canvas}>
          <div ref={planetRef} className={styles.planet} data-motion="planet">
            <span className={styles.omunRing} data-motion="omun-ring" />
            {/* On the index, the Omun beats out on its own steady rhythm. */}
            {layout === 'index' && <span className={styles.heartbeat} />}
            {[0, 1, 2].map((i) => (
              <span key={i} className={styles.pulse} data-motion="pulse" />
            ))}
            <div className={styles.planetTurn} data-motion="planet-turn">
              <NayaraPlanet
                layers={layers}
                active={look}
                className={styles.planetDrawing}
              />
            </div>
          </div>
          <Orbit
            chapters={chapters}
            current={current}
            selected={hovered ?? selected}
            unwritten={copy.unwritten}
            chapterWord={copy.chapter}
            onSelect={select}
          />
          {layout === 'reader' && caption && (
            // Which node is which, while one is pointed at; else, this one.
            <p
              className={styles.caption}
              data-motion="caption"
              aria-hidden="true"
            >
              <span className={styles.captionNumeral}>
                {copy.chapter} {caption.numeral}
              </span>
              <span className={styles.captionTitle}>{caption.title}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
