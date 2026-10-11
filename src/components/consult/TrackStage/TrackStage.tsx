'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent
} from 'react';
import { PauseIcon, PlayIcon } from '@/components/icons';
import { drawWaveform, type WaveformPalette } from '@/lib/consult/audio';
import { MIN_SECTION_SECONDS, formatClock } from '@/lib/consult/engine';
import styles from './TrackStage.module.scss';
import type { TrackStageProps } from './TrackStage.types';

// The track, the only large thing on the page: play, the clock, the
// before and after, and the waveform with the notes on it. Press the
// waveform to move the playhead; drag across it to mark out a section;
// press a note's pin or section to pick it. The arrow keys move the
// playhead too, five seconds a press.

const PALETTE: WaveformPalette = {
  low: [163, 43, 35],
  high: [210, 169, 97],
  rest: 0.32,
  played: 0.95,
  section: 'rgba(210, 169, 97, 0.1)',
  sectionActive: 'rgba(210, 169, 97, 0.24)',
  pin: 'rgba(210, 169, 97, 0.7)',
  pinActive: '#e3c286',
  marking: 'rgba(227, 194, 134, 0.2)',
  playhead: '#ddcfb2'
};

/** How far a press may wander before it's a drag, in CSS pixels. */
const DRAG_PX = 4;
/** How near a pin a press must land to pick it, in CSS pixels. */
const PIN_REACH = 7;
/** What one arrow key press moves the playhead by, in seconds. */
const KEY_STEP = 5;

export default function TrackStage({
  copy,
  waveform,
  duration,
  positionRef,
  second,
  playing,
  failed,
  notes,
  activeId,
  marking,
  bypass,
  canCompare,
  onBypass,
  onToggle,
  onSeek,
  onMark,
  onPick
}: TrackStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const press = useRef<{ x: number; at: number; dragging: boolean } | null>(
    null
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawWaveform(
      context,
      width,
      height,
      {
        data: waveform,
        duration,
        position: positionRef.current,
        notes,
        active: activeId,
        marking
      },
      PALETTE
    );
  }, [waveform, duration, positionRef, notes, activeId, marking]);

  // Drawn whenever what it shows changes, every frame while it plays, and
  // again when its box changes size.
  useEffect(() => {
    draw();
    if (!playing) return;
    let frame = requestAnimationFrame(function loop() {
      draw();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [draw, playing, second]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  const timeAt = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - box.left) / Math.max(1, box.width);
    return Math.min(Math.max(fraction, 0), 1) * duration;
  };

  function down(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { x: event.clientX, at: timeAt(event), dragging: false };
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    const held = press.current;
    if (!held) return;
    if (!held.dragging && Math.abs(event.clientX - held.x) < DRAG_PX) return;
    held.dragging = true;
    onMark({ from: held.at, to: timeAt(event) });
  }

  function up(event: PointerEvent<HTMLCanvasElement>) {
    const held = press.current;
    press.current = null;
    if (!held) return;
    const at = timeAt(event);
    if (held.dragging) {
      const from = Math.min(held.at, at);
      const to = Math.max(held.at, at);
      onMark(to - from >= MIN_SECTION_SECONDS ? { from, to } : null);
      return;
    }
    onMark(null);
    // A press near a pin picks its note; one inside a section, the
    // section's (the shortest, where they overlap); either way the
    // playhead moves there too.
    const box = event.currentTarget.getBoundingClientRect();
    const reach = (PIN_REACH / Math.max(1, box.width)) * duration;
    const pin = notes.find(
      (note) => note.end === null && Math.abs(note.at - at) <= reach
    );
    const section = notes
      .filter((note) => note.end !== null && at >= note.at && at < note.end)
      .sort((a, b) => (a.end ?? 0) - a.at - ((b.end ?? 0) - b.at))[0];
    const picked = pin ?? section;
    if (picked) onPick(picked.id);
    onSeek(pin ? pin.at : at);
  }

  function key(event: KeyboardEvent<HTMLCanvasElement>) {
    const step =
      event.key === 'ArrowRight'
        ? KEY_STEP
        : event.key === 'ArrowLeft'
          ? -KEY_STEP
          : 0;
    if (step) {
      event.preventDefault();
      onSeek(positionRef.current + step);
    } else if (event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <section className={styles.stage}>
      <div className={styles.transport}>
        <button
          type="button"
          className={styles.play}
          onClick={onToggle}
          disabled={failed}
          aria-label={playing ? copy.pause : copy.play}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <p className={styles.clock}>
          <span>{formatClock(second)}</span>
          <span className={styles.clockTotal}> / {formatClock(duration)}</span>
        </p>
        {/* The before and after: the same track, with his tools and without. */}
        <div
          className={styles.compare}
          role="group"
          aria-label={copy.compare}
          title={canCompare ? undefined : copy.compareHint}
        >
          <button
            type="button"
            className={styles.option}
            aria-pressed={canCompare && bypass}
            disabled={!canCompare}
            onClick={() => onBypass(true)}
          >
            {copy.asItIs}
          </button>
          <button
            type="button"
            className={styles.option}
            aria-pressed={canCompare && !bypass}
            disabled={!canCompare}
            onClick={() => onBypass(false)}
          >
            {copy.withTools}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.waveform}
        role="slider"
        tabIndex={0}
        aria-label={copy.hint}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={second}
        aria-valuetext={formatClock(second)}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          press.current = null;
        }}
        onKeyDown={key}
      />
      <p className={styles.hint} data-failed={failed || undefined}>
        {failed ? copy.unplayable : copy.hint}
      </p>
    </section>
  );
}
