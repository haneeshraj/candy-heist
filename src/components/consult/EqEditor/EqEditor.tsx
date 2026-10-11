'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent
} from 'react';
import { Slider, span } from '@/components/consult/Slider';
import {
  POINT_REACH,
  drawEqCurve,
  drawEqGrid,
  drawEqPoints,
  drawSpectrum,
  eqResponse,
  pointAt,
  type EqPalette
} from '@/lib/consult/audio';
import {
  CUT_SLOPES,
  EQ_BAND_LABEL,
  EQ_BAND_READS,
  EQ_BAND_TYPES,
  MAX_EQ_BANDS,
  RANGES,
  clampTo,
  formatDb,
  formatHz,
  frequencyForX,
  gainForY,
  newBand,
  viewFrequencies,
  xForFrequency,
  type EqBand,
  type EqBandType
} from '@/lib/consult/engine';
import BandIcon from './BandIcon';
import styles from './EqEditor.module.scss';
import type { EqEditorProps } from './EqEditor.types';

// The EQ, drawn as a producer reads one: frequency across, gain up and
// down, the track's spectrum moving behind it while it plays, and the
// curve the points make over it, asked of the very filters being heard.
// Press the picture to put a point there and drag it where it should go;
// press a point to pick it and drag it; scroll over it to widen or narrow
// it. Under the picture, the picked point's own controls, its kind as the
// shapes they make, which are the way in from the keyboard too.

const PALETTE: EqPalette = {
  grid: 'rgba(182, 158, 124, 0.12)',
  label: 'rgba(138, 128, 113, 0.9)',
  font: '500 9px "IBM Plex Mono", monospace',
  curve: '#d2a961',
  area: 'rgba(210, 169, 97, 0.12)',
  point: '#111011',
  pointActive: '#e3c286'
};
const SPECTRUM = {
  fill: 'rgba(182, 158, 124, 0.08)',
  line: 'rgba(182, 158, 124, 0.25)'
};

/** Columns the curve is worked out at. */
const CURVE_POINTS = 320;
/** A slider for frequency moves along the picture's own log axis, in thousandths. */
const FREQUENCY_STEPS = 1000;
/** An arrow key moves the picked point a 48th of the picture across, or half a dB. */
const KEY_STEPS = 48;
const KEY_GAIN = 0.5;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function EqEditor({
  copy,
  bands,
  analyserRef,
  playing,
  onChange
}: EqEditorProps) {
  const baseId = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragging = useRef<string | null>(null);
  const [picked, setPicked] = useState<string | null>(bands[0]?.id ?? null);
  const selected = bands.find((band) => band.id === picked) ?? null;

  const frequencies = useMemo(() => viewFrequencies(CURVE_POINTS), []);
  const response = useMemo(
    () =>
      typeof OfflineAudioContext === 'undefined'
        ? new Float32Array(CURVE_POINTS)
        : eqResponse(bands, frequencies),
    [bands, frequencies]
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
    context.clearRect(0, 0, width, height);
    drawEqGrid(context, width, height, PALETTE);
    const analyser = analyserRef.current;
    if (analyser) {
      const bins = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins);
      drawSpectrum(
        context,
        width,
        height,
        bins,
        analyser.context.sampleRate,
        SPECTRUM
      );
    }
    drawEqCurve(context, width, height, response, PALETTE);
    drawEqPoints(context, width, height, bands, picked, PALETTE);
  }, [analyserRef, response, bands, picked]);

  useEffect(() => {
    draw();
    if (!playing) return;
    let frame = requestAnimationFrame(function loop() {
      draw();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [draw, playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  const update = useCallback(
    (id: string, change: Partial<EqBand>) =>
      onChange(
        bands.map((band) => (band.id === id ? { ...band, ...change } : band))
      ),
    [bands, onChange]
  );

  // Scrolling over the picture widens or narrows the picked point. A wheel
  // listener React adds is passive and can't stop the page scrolling, so
  // this one is added by hand.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selected || !EQ_BAND_READS[selected.type].q) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const q = selected.q * (event.deltaY > 0 ? 0.9 : 1.1);
      update(selected.id, { q: clampTo(RANGES.q, q) });
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, [selected, update]);

  const local = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      width: box.width,
      height: box.height
    };
  };

  /** A new point, picked; null when the EQ holds as many as it can. */
  function add(type: EqBandType, frequency?: number, gain = 0) {
    if (bands.length >= MAX_EQ_BANDS) return null;
    const band = {
      ...newBand(newId(), type, frequency),
      gain: EQ_BAND_READS[type].gain ? clampTo(RANGES.gain, gain) : 0
    };
    onChange([...bands, band]);
    setPicked(band.id);
    return band;
  }

  // A press on a point takes it; anywhere else puts a bell there and takes
  // that, so one press and a drag makes and places a point.
  function down(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    const { x, y, width, height } = local(event);
    const near = bands
      .map((band) => {
        const point = pointAt(band, width, height);
        return { band, distance: Math.hypot(point.x - x, point.y - y) };
      })
      .filter(({ distance }) => distance <= POINT_REACH)
      .sort((a, b) => a.distance - b.distance)[0];
    const taken =
      near?.band ??
      add(
        'bell',
        clampTo(RANGES.frequency, frequencyForX(x, width)),
        gainForY(y, height)
      );
    if (!taken) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = taken.id;
    setPicked(taken.id);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    const id = dragging.current;
    const band = bands.find((b) => b.id === id);
    if (!id || !band) return;
    const { x, y, width, height } = local(event);
    update(id, {
      frequency: clampTo(RANGES.frequency, frequencyForX(x, width)),
      ...(EQ_BAND_READS[band.type].gain
        ? { gain: clampTo(RANGES.gain, gainForY(y, height)) }
        : {})
    });
  }

  function remove(id: string) {
    const rest = bands.filter((band) => band.id !== id);
    onChange(rest);
    setPicked(rest.at(-1)?.id ?? null);
  }

  // From the keyboard: Enter puts a point in the middle, the arrows move
  // the picked one, Delete takes it away.
  function key(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      add('bell');
      return;
    }
    if (!selected) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove(selected.id);
      return;
    }
    const across =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const up = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    if (!across && !up) return;
    event.preventDefault();
    if (across) {
      const at = xForFrequency(selected.frequency, KEY_STEPS) + across;
      update(selected.id, {
        frequency: clampTo(RANGES.frequency, frequencyForX(at, KEY_STEPS))
      });
    } else if (EQ_BAND_READS[selected.type].gain) {
      update(selected.id, {
        gain: clampTo(RANGES.gain, selected.gain + up * KEY_GAIN)
      });
    }
  }

  const full = bands.length >= MAX_EQ_BANDS;
  const reads = selected ? EQ_BAND_READS[selected.type] : null;

  return (
    <div className={styles.eq}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        aria-label={copy.hint}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => {
          dragging.current = null;
        }}
        onPointerCancel={() => {
          dragging.current = null;
        }}
        onKeyDown={key}
      />
      <p className={styles.hint}>{full ? copy.full : copy.hint}</p>

      {bands.length ? (
        <div className={styles.points} role="group" aria-label={copy.points}>
          {bands.map((band, i) => (
            <button
              key={band.id}
              type="button"
              className={styles.point}
              aria-pressed={band.id === picked}
              onClick={() => setPicked(band.id)}
            >
              {i + 1} · {EQ_BAND_LABEL[band.type]} {formatHz(band.frequency)}
            </button>
          ))}
        </div>
      ) : null}

      {selected && reads ? (
        <div className={styles.controls}>
          <div className={styles.kindField}>
            <span id={`${baseId}-kind`} className={styles.fieldLabel}>
              {copy.type}
            </span>
            <div
              className={styles.kinds}
              role="radiogroup"
              aria-labelledby={`${baseId}-kind`}
            >
              {EQ_BAND_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected.type === type}
                  aria-label={EQ_BAND_LABEL[type]}
                  title={EQ_BAND_LABEL[type]}
                  className={styles.kind}
                  onClick={() => update(selected.id, { type })}
                >
                  <BandIcon type={type} />
                </button>
              ))}
            </div>
          </div>
          <Slider
            id={`${baseId}-frequency`}
            label={copy.frequency}
            min={0}
            max={FREQUENCY_STEPS}
            step={1}
            value={Math.round(
              xForFrequency(selected.frequency, FREQUENCY_STEPS)
            )}
            format={() => formatHz(selected.frequency)}
            onChange={(steps) =>
              update(selected.id, {
                frequency: clampTo(
                  RANGES.frequency,
                  frequencyForX(steps, FREQUENCY_STEPS)
                )
              })
            }
          />
          {reads.gain ? (
            <Slider
              id={`${baseId}-gain`}
              label={copy.gain}
              {...span(RANGES.gain)}
              value={selected.gain}
              format={formatDb}
              onChange={(gain) => update(selected.id, { gain })}
            />
          ) : null}
          {reads.q ? (
            <Slider
              id={`${baseId}-q`}
              label={copy.q}
              {...span(RANGES.q)}
              value={selected.q}
              format={(q) => q.toFixed(2)}
              onChange={(q) => update(selected.id, { q })}
            />
          ) : null}
          {reads.slope ? (
            <div className={styles.field}>
              <span id={`${baseId}-slope`} className={styles.fieldLabel}>
                {copy.slope}
              </span>
              <div
                className={styles.slopes}
                role="radiogroup"
                aria-labelledby={`${baseId}-slope`}
              >
                {CUT_SLOPES.map((slope) => (
                  <button
                    key={slope}
                    type="button"
                    role="radio"
                    aria-checked={selected.slope === slope}
                    className={styles.slope}
                    onClick={() => update(selected.id, { slope })}
                  >
                    {slope} dB/oct
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className={styles.remove}
            onClick={() => remove(selected.id)}
          >
            {copy.remove}
          </button>
        </div>
      ) : null}
    </div>
  );
}
