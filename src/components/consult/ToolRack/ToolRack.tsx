'use client';

import { useId, type ReactNode } from 'react';
import { EqEditor } from '@/components/consult/EqEditor';
import { Slider, span } from '@/components/consult/Slider';
import {
  DYNAMICS_LABEL,
  DYNAMICS_MODES,
  RANGES,
  SIDECHAIN_RATES,
  TOOL_LABEL,
  formatDb,
  newDynamics,
  newSaturation,
  newSidechain,
  newWidth,
  type Chain,
  type Dynamics,
  type Saturation,
  type Sidechain,
  type Width
} from '@/lib/consult/engine';
import styles from './ToolRack.module.scss';
import type { ToolRackProps } from './ToolRack.types';

// The tools, for whatever is picked: the whole song, or one section. The
// EQ is always there; the other four are added and taken away, and what
// isn't added isn't heard. "Without my tools" plays the track as it is,
// for the before and after.

const percent = (value: number) => `${Math.round(value * 100)}%`;
const ms = (seconds: number) => `${Math.round(seconds * 1000)} ms`;
const signedMs = (value: number) => `${value > 0 ? '+' : ''}${value} ms`;

export default function ToolRack({
  copy,
  targets,
  target,
  onTarget,
  chain,
  bpm,
  bypass,
  onBypass,
  analyserRef,
  playing,
  onChange
}: ToolRackProps) {
  const id = useId();
  const set = (change: Partial<Chain>) => onChange({ ...chain, ...change });

  return (
    <section className={styles.rack} aria-labelledby={`${id}-label`}>
      <div className={styles.head}>
        <h2 id={`${id}-label`} className={styles.label}>
          {copy.label}
        </h2>
        <button
          type="button"
          className={styles.bypass}
          aria-pressed={bypass}
          onClick={() => onBypass(!bypass)}
        >
          {bypass ? copy.bypassOn : copy.bypass}
        </button>
      </div>

      <div className={styles.targets} role="group" aria-label={copy.label}>
        {targets.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.target}
            aria-pressed={option.id === target}
            onClick={() => onTarget(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {targets.length === 1 ? (
        <p className={styles.hint}>{copy.noSection}</p>
      ) : null}

      <Tool name={TOOL_LABEL.eq}>
        <EqEditor
          // A new target is a new set of points: start from its first.
          key={target}
          copy={{ ...copy.eq, remove: copy.remove }}
          bands={chain.eq}
          analyserRef={analyserRef}
          playing={playing}
          onChange={(eq) => set({ eq })}
        />
      </Tool>

      <Tool
        name={TOOL_LABEL.saturation}
        on={chain.saturation !== null}
        add={copy.add}
        remove={copy.remove}
        onToggle={(on) => set({ saturation: on ? newSaturation() : null })}
      >
        {chain.saturation ? (
          <SaturationControls
            id={`${id}-sat`}
            copy={copy.saturation}
            value={chain.saturation}
            onChange={(saturation) => set({ saturation })}
          />
        ) : null}
      </Tool>

      <Tool
        name={TOOL_LABEL.sidechain}
        on={chain.sidechain !== null}
        add={copy.add}
        remove={copy.remove}
        onToggle={(on) => set({ sidechain: on ? newSidechain(bpm) : null })}
      >
        {chain.sidechain ? (
          <SidechainControls
            id={`${id}-sc`}
            copy={copy.sidechain}
            value={chain.sidechain}
            onChange={(sidechain) => set({ sidechain })}
          />
        ) : null}
      </Tool>

      <Tool
        name={TOOL_LABEL.width}
        on={chain.width !== null}
        add={copy.add}
        remove={copy.remove}
        onToggle={(on) => set({ width: on ? newWidth() : null })}
      >
        {chain.width ? (
          <WidthControls
            id={`${id}-width`}
            copy={copy.width}
            value={chain.width}
            onChange={(width) => set({ width })}
          />
        ) : null}
      </Tool>

      <Tool
        name={TOOL_LABEL.dynamics}
        on={chain.dynamics !== null}
        add={copy.add}
        remove={copy.remove}
        onToggle={(on) =>
          set({ dynamics: on ? newDynamics('compressor') : null })
        }
      >
        {chain.dynamics ? (
          <DynamicsControls
            id={`${id}-dyn`}
            copy={copy.dynamics}
            value={chain.dynamics}
            onChange={(dynamics) => set({ dynamics })}
          />
        ) : null}
      </Tool>
    </section>
  );
}

function Tool({
  name,
  on = true,
  add,
  remove,
  onToggle,
  children
}: {
  name: string;
  on?: boolean;
  add?: string;
  remove?: string;
  onToggle?: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.tool} data-on={on || undefined}>
      <div className={styles.toolHead}>
        <h3 className={styles.toolName}>{name}</h3>
        {onToggle ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => onToggle(!on)}
          >
            {on ? remove : `+ ${add}`}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

interface ControlsProps<T, C> {
  id: string;
  copy: C;
  value: T;
  onChange: (value: T) => void;
}

function SaturationControls({
  id,
  copy,
  value,
  onChange
}: ControlsProps<Saturation, ToolRackProps['copy']['saturation']>) {
  return (
    <div className={styles.controls}>
      <Slider
        id={`${id}-drive`}
        label={copy.drive}
        {...span(RANGES.drive)}
        value={value.drive}
        format={formatDb}
        onChange={(drive) => onChange({ ...value, drive })}
      />
      <Slider
        id={`${id}-mix`}
        label={copy.mix}
        {...span(RANGES.mix)}
        value={value.mix}
        format={percent}
        onChange={(mix) => onChange({ ...value, mix })}
      />
      <Slider
        id={`${id}-output`}
        label={copy.output}
        {...span(RANGES.output)}
        value={value.output}
        format={formatDb}
        onChange={(output) => onChange({ ...value, output })}
      />
    </div>
  );
}

function SidechainControls({
  id,
  copy,
  value,
  onChange
}: ControlsProps<Sidechain, ToolRackProps['copy']['sidechain']>) {
  return (
    <>
      <div className={styles.controls}>
        <Slider
          id={`${id}-bpm`}
          label={copy.bpm}
          {...span(RANGES.bpm)}
          step={0.5}
          value={value.bpm}
          format={(bpm) => `${Number(bpm.toFixed(1))} BPM`}
          onChange={(bpm) => onChange({ ...value, bpm })}
        />
        <div className={styles.choice}>
          <span className={styles.choiceLabel}>{copy.rate}</span>
          <div className={styles.chips} role="group" aria-label={copy.rate}>
            {SIDECHAIN_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                className={styles.chip}
                aria-pressed={value.rate === rate}
                onClick={() => onChange({ ...value, rate })}
              >
                {rate}
              </button>
            ))}
          </div>
        </div>
        <Slider
          id={`${id}-depth`}
          label={copy.depth}
          {...span(RANGES.depth)}
          value={value.depth}
          format={percent}
          onChange={(depth) => onChange({ ...value, depth })}
        />
        <Slider
          id={`${id}-release`}
          label={copy.release}
          {...span(RANGES.release)}
          value={value.release}
          format={percent}
          onChange={(release) => onChange({ ...value, release })}
        />
        <Slider
          id={`${id}-offset`}
          label={copy.offset}
          {...span(RANGES.offset)}
          value={value.offset}
          format={signedMs}
          onChange={(offset) => onChange({ ...value, offset })}
        />
      </div>
      <p className={styles.hint}>{copy.hint}</p>
    </>
  );
}

function WidthControls({
  id,
  copy,
  value,
  onChange
}: ControlsProps<Width, ToolRackProps['copy']['width']>) {
  return (
    <div className={styles.controls}>
      <Slider
        id={`${id}-width`}
        label={copy.width}
        {...span(RANGES.width)}
        value={value.width}
        format={percent}
        onChange={(width) => onChange({ width })}
      />
    </div>
  );
}

function DynamicsControls({
  id,
  copy,
  value,
  onChange
}: ControlsProps<Dynamics, ToolRackProps['copy']['dynamics']>) {
  const set = (change: Partial<Dynamics>) => onChange({ ...value, ...change });
  return (
    <>
      <div className={styles.choice}>
        <span className={styles.choiceLabel}>{copy.mode}</span>
        <div className={styles.chips} role="group" aria-label={copy.mode}>
          {DYNAMICS_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={styles.chip}
              aria-pressed={value.mode === mode}
              // A mode starts from its own settings: a limiter set like a
              // compressor is neither.
              onClick={() => value.mode !== mode && onChange(newDynamics(mode))}
            >
              {DYNAMICS_LABEL[mode]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <Slider
          id={`${id}-threshold`}
          label={copy.threshold}
          {...span(RANGES.threshold)}
          value={value.threshold}
          format={formatDb}
          onChange={(threshold) => set({ threshold })}
        />
        {value.mode === 'compressor' ? (
          <>
            <Slider
              id={`${id}-ratio`}
              label={copy.ratio}
              {...span(RANGES.ratio)}
              value={value.ratio}
              format={(ratio) => `${ratio.toFixed(1)}:1`}
              onChange={(ratio) => set({ ratio })}
            />
            <Slider
              id={`${id}-knee`}
              label={copy.knee}
              {...span(RANGES.knee)}
              value={value.knee}
              format={formatDb}
              onChange={(knee) => set({ knee })}
            />
            <Slider
              id={`${id}-attack`}
              label={copy.attack}
              {...span(RANGES.attack)}
              value={value.attack}
              format={ms}
              onChange={(attack) => set({ attack })}
            />
          </>
        ) : null}
        <Slider
          id={`${id}-release`}
          label={copy.release}
          {...span(RANGES.dynamicsRelease)}
          value={value.release}
          format={ms}
          onChange={(release) => set({ release })}
        />
        <Slider
          id={`${id}-makeup`}
          label={copy.makeup}
          {...span(RANGES.makeup)}
          value={value.makeup}
          format={formatDb}
          onChange={(makeup) => set({ makeup })}
        />
      </div>
      <p className={styles.hint}>{copy.hint}</p>
    </>
  );
}
