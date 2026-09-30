'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { chapterHref, type LoreChapterSummary } from '@/content/lore/lore';
import { toRoman } from '@/lib/text/roman';
import { MOTE_RINGS } from './motes';
import styles from './LoreStage.module.scss';

interface OrbitProps {
  chapters: LoreChapterSummary[];
  /** The chapter being read, or -1 on the index. */
  current: number;
  /** The chapter hovered or focused, or previewed on the index. */
  selected: number;
  unwritten: string;
  chapterWord: string;
  onSelect: (index: number | null) => void;
}

// How long the pointer rests on a node before it takes the preview, so
// crossing one on the way somewhere else (to READ CHAPTER, say) doesn't.
const HOVER_INTENT_MS = 200;

// How far the ring is turned: while a chapter is read, it sits at the top.
export function orbitTurn(current: number, count: number) {
  return current > 0 ? -(current / (count + 1)) * 360 : 0;
}

// A node's place: spaced evenly round the ring from the top, one per
// chapter plus the one still being written, so a new chapter re-spaces it.
export function nodeAngle(index: number, count: number, turn = 0) {
  return -90 + (index / (count + 1)) * 360 + turn;
}

function place(angle: number): CSSProperties {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    // Rounded, so the server's and the browser's strings agree.
    left: `${(50 + 50 * cos).toFixed(4)}%`,
    top: `${(50 + 50 * sin).toFixed(4)}%`,
    '--node-dx': cos.toFixed(3),
    '--node-dy': sin.toFixed(3)
  } as CSSProperties;
}

// Where a label sits against its node: out along the ring's normal,
// aligned away from the centre.
function side(angle: number) {
  const cos = Math.cos((angle * Math.PI) / 180);
  return Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'right' : 'left';
}

// Figma "Lore A · 1 Chapters": the orbit round Nayara, a node per chapter
// (read gold, the current one crimson, the rest open) and a dashed one
// for the chapter still to come. Each node links to its chapter; resting
// the pointer on one, or focusing it, previews it.
export default function Orbit({
  chapters,
  current,
  selected,
  unwritten,
  chapterWord,
  onSelect
}: OrbitProps) {
  const count = chapters.length;
  const turn = orbitTurn(current, count);
  const next = nodeAngle(count, count, turn);

  const intentRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(intentRef.current), []);
  const dwell = (i: number) => {
    window.clearTimeout(intentRef.current);
    intentRef.current = window.setTimeout(() => onSelect(i), HOVER_INTENT_MS);
  };
  const leave = () => {
    window.clearTimeout(intentRef.current);
    onSelect(null);
  };

  return (
    <div className={styles.orbit} data-motion="orbit">
      {/* The dust, turning at its steady rates whatever the scroll does. */}
      <div className={styles.motes} data-motion="motes" aria-hidden="true">
        {MOTE_RINGS.map((ring, i) => (
          <svg
            key={i}
            className={styles.moteRing}
            viewBox="-450 -450 900 900"
            focusable="false"
            data-reverse={ring.reverse || undefined}
            style={{ animationDuration: `${ring.period}s` }}
          >
            {ring.motes.map((mote, j) => (
              <circle
                key={j}
                cx={mote.cx}
                cy={mote.cy}
                r={mote.r}
                fillOpacity={mote.opacity}
              />
            ))}
          </svg>
        ))}
      </div>
      <svg
        className={styles.ring}
        viewBox="0 0 600 600"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className={styles.ringLine}
          cx="300"
          cy="300"
          r="299.5"
          pathLength={1}
          data-motion="orbit-ring"
        />
        {/* The chapters read, clockwise from the first one's node. */}
        <circle
          className={styles.arc}
          cx="300"
          cy="300"
          r="299.5"
          pathLength={1}
          style={{ rotate: `${(-90 + turn).toFixed(3)}deg` }}
          data-motion="orbit-arc"
        />
      </svg>

      <ol className={styles.nodes}>
        {chapters.map((chapter, i) => {
          const angle = nodeAngle(i, count, turn);
          const state =
            i < current
              ? 'read'
              : i === current || (current < 0 && i === selected)
                ? 'current'
                : 'future';
          return (
            <li
              key={chapter.slug}
              className={styles.node}
              style={place(angle)}
              data-state={state}
              data-side={side(angle)}
              data-selected={i === selected || undefined}
              data-motion="node"
            >
              <Link
                className={styles.nodeLink}
                href={chapterHref(chapter.slug)}
                aria-current={i === current ? 'page' : undefined}
                onMouseEnter={() => dwell(i)}
                onMouseLeave={leave}
                onFocus={() => onSelect(i)}
                onBlur={leave}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.nodeLabel} data-motion="node-label">
                  <span className={styles.nodeNumeral}>
                    <span className={styles.srOnly}>{chapterWord} </span>
                    {chapter.numeral}
                  </span>
                  <span className={styles.nodeTitle}>{chapter.title}</span>
                </span>
              </Link>
            </li>
          );
        })}
        <li
          className={styles.node}
          style={place(next)}
          data-state="next"
          data-side={side(next)}
          data-motion="node"
          aria-hidden="true"
        >
          <span className={styles.nodeLink}>
            <span className={styles.dot} />
            <span className={styles.nodeLabel} data-motion="node-label">
              {/* The numeral the next chapter will take. */}
              <span className={styles.nodeNumeral}>{toRoman(count + 1)}</span>
              <span className={styles.nodeUnwritten}>{unwritten}</span>
            </span>
          </span>
        </li>
      </ol>
    </div>
  );
}
