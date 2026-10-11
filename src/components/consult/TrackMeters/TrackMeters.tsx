'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  drawImager,
  drawScope,
  type ImagerPalette,
  type Loudness,
  type MeterReading,
  type ScopePalette
} from '@/lib/consult/audio';
import styles from './TrackMeters.module.scss';
import type { TrackMetersProps } from './TrackMeters.types';

// Three readings of what's heard, under the waveform: loudness in LUFS
// (short-term large, momentary and integrated beside it, and a bar marked
// at the -14 streaming services play to), an oscilloscope, and a stereo
// imager with the two sides' correlation under it. Drawn every frame while
// the track plays, held where they were when it stops.

const SCOPE: ScopePalette = {
  grid: 'rgba(182, 158, 124, 0.14)',
  left: '#d2a961',
  right: 'rgba(221, 207, 178, 0.45)'
};
const IMAGER: ImagerPalette = {
  grid: 'rgba(182, 158, 124, 0.18)',
  dot: 'rgba(210, 169, 97, 0.55)',
  bar: 'rgba(182, 158, 124, 0.12)',
  barValue: '#d2a961',
  barWarning: '#db7a6f'
};

/** The bar's span, in LUFS, and where it marks. */
const FLOOR = -36;
const CEILING = 0;
const TARGET = -14;
/** How often the numbers are rewritten, in ms: often enough to read, not to blur. */
const NUMBERS_MS = 100;

const SILENT: Loudness = {
  momentary: -Infinity,
  shortTerm: -Infinity,
  integrated: -Infinity
};

const lufs = (value: number) =>
  Number.isFinite(value) ? value.toFixed(1) : '—';

const share = (value: number) =>
  Number.isFinite(value)
    ? Math.min(1, Math.max(0, (value - FLOOR) / (CEILING - FLOOR)))
    : 0;

/** A canvas sized to its box at the screen's density; its context, ready to draw on. */
function prepare(canvas: HTMLCanvasElement | null) {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return null;
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

export default function TrackMeters({
  copy,
  metersRef,
  playing
}: TrackMetersProps) {
  const scopeRef = useRef<HTMLCanvasElement | null>(null);
  const imagerRef = useRef<HTMLCanvasElement | null>(null);
  // The last reading drawn: what a canvas redraws when its box changes.
  const lastRef = useRef<MeterReading | null>(null);
  const [loudness, setLoudness] = useState<Loudness>(SILENT);

  const draw = useCallback((reading: MeterReading | null) => {
    const scope = prepare(scopeRef.current);
    const imager = prepare(imagerRef.current);
    const left = reading?.left ?? new Float32Array(2);
    const right = reading?.right ?? new Float32Array(2);
    if (scope)
      drawScope(scope.context, scope.width, scope.height, left, right, SCOPE);
    if (imager)
      drawImager(
        imager.context,
        imager.width,
        imager.height,
        left,
        right,
        reading?.correlation ?? NaN,
        IMAGER
      );
  }, []);

  // Every frame while it plays. Stopped, the pictures keep their last frame.
  useEffect(() => {
    if (!playing) return;
    let last = 0;
    let frame = requestAnimationFrame(function loop(time) {
      const reading = metersRef.current?.read(true) ?? null;
      lastRef.current = reading;
      draw(reading);
      if (reading && time - last >= NUMBERS_MS) {
        last = time;
        setLoudness(reading.loudness);
      }
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [draw, metersRef, playing]);

  useEffect(() => {
    draw(lastRef.current);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => draw(lastRef.current));
    for (const canvas of [scopeRef.current, imagerRef.current])
      if (canvas) observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div className={styles.meters}>
      <div className={styles.cell} data-cell="loudness">
        <p className={styles.label}>
          {copy.loudness} <span className={styles.unit}>{copy.unit}</span>
        </p>
        <p className={styles.big} aria-live="off">
          <span className={styles.key}>{copy.shortTerm}</span>
          {lufs(loudness.shortTerm)}
        </p>
        <div className={styles.small}>
          <span>
            <span className={styles.key}>{copy.momentary}</span>
            {lufs(loudness.momentary)}
          </span>
          <button
            type="button"
            className={styles.reset}
            title={copy.reset}
            aria-label={`${copy.integrated} ${lufs(loudness.integrated)}. ${copy.reset}`}
            onClick={() => {
              metersRef.current?.reset();
              setLoudness((current) => ({
                ...current,
                integrated: -Infinity
              }));
            }}
          >
            <span className={styles.key}>{copy.integrated}</span>
            {lufs(loudness.integrated)}
          </button>
        </div>
        <div className={styles.bar} aria-hidden="true">
          <span
            className={styles.fill}
            style={{ width: `${share(loudness.shortTerm) * 100}%` }}
          />
          <span
            className={styles.target}
            style={{ left: `${share(TARGET) * 100}%` }}
          />
        </div>
      </div>
      <div className={styles.cell} data-cell="scope">
        <p className={styles.label}>{copy.scope}</p>
        <canvas ref={scopeRef} className={styles.canvas} aria-hidden="true" />
      </div>
      <div className={styles.cell} data-cell="stereo">
        <p className={styles.label}>
          {copy.stereo}
          <span className={styles.unit}>{copy.correlation}</span>
        </p>
        <canvas ref={imagerRef} className={styles.canvas} aria-hidden="true" />
      </div>
    </div>
  );
}
