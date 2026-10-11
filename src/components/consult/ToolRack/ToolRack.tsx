'use client';

import {
  useId,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type RefObject
} from 'react';
import { EqEditor } from '@/components/consult/EqEditor';
import { Slider, span } from '@/components/consult/Slider';
import {
  DEVICE_KINDS,
  DEVICE_LABEL,
  DYNAMICS_LABEL,
  DYNAMICS_MODES,
  MAX_DEVICES,
  RANGES,
  deviceTitle,
  formatDb,
  newDevice,
  newDynamics,
  summarizeDevice,
  type Chain,
  type Device,
  type DeviceKind,
  type Dynamics,
  type Width
} from '@/lib/consult/engine';
import styles from './ToolRack.module.scss';
import type { ToolRackProps } from './ToolRack.types';

// The tools, for whatever is picked: the whole song, or one section. They
// are a chain of devices, heard in order as a DAW's are: drag one in from
// the palette (or tap it, to add it at the end), drag them about to change
// the order, press one to set it, below. A chain starts with an EQ in it,
// and can take more. The before and after is by the play button
// (TrackStage), where it's heard.

/** What a drag carries: a kind of device from the palette, or one already in the chain. */
const NEW_DEVICE = 'application/x-consult-device';
const MOVE_DEVICE = 'application/x-consult-move';

const percent = (value: number) => `${Math.round(value * 100)}%`;
const ms = (seconds: number) => `${Math.round(seconds * 1000)} ms`;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** The chain with `id` moved to sit before the device `to` (counted as the chain was). */
function moved(devices: readonly Device[], id: string, to: number): Device[] {
  const from = devices.findIndex((device) => device.id === id);
  if (from < 0) return [...devices];
  const rest = devices.filter((device) => device.id !== id);
  const at = to > from ? to - 1 : to;
  return [...rest.slice(0, at), devices[from], ...rest.slice(at)];
}

/** Enter and Space press a role="button" as they would a button. */
const pressed = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') return false;
  event.preventDefault();
  return true;
};

export default function ToolRack({
  copy,
  targets,
  target,
  onTarget,
  chain,
  analyserRef,
  playing,
  onChange
}: ToolRackProps) {
  const id = useId();
  // The device open below, for each place the tools go.
  const [openBy, setOpenBy] = useState<Record<string, string>>({});
  // Where a drag would land: before the device at this place, or at the end.
  const [dropAt, setDropAt] = useState<number | null>(null);

  const devices = chain.devices;
  const open =
    devices.find((device) => device.id === openBy[target]) ??
    devices[0] ??
    null;
  const full = devices.length >= MAX_DEVICES;

  const openDevice = (deviceId: string) =>
    setOpenBy((current) => ({ ...current, [target]: deviceId }));
  const setDevices = (next: Device[]) => onChange({ devices: next });

  function add(kind: DeviceKind, at = devices.length) {
    if (full) return;
    const device = newDevice(kind, newId());
    setDevices([...devices.slice(0, at), device, ...devices.slice(at)]);
    openDevice(device.id);
  }

  const replace = (device: Device) =>
    setDevices(devices.map((d) => (d.id === device.id ? device : d)));

  function remove(deviceId: string) {
    const index = devices.findIndex((device) => device.id === deviceId);
    const rest = devices.filter((device) => device.id !== deviceId);
    setDevices(rest);
    const neighbour = rest[Math.min(index, rest.length - 1)];
    if (neighbour) openDevice(neighbour.id);
  }

  const move = (deviceId: string, to: number) =>
    setDevices(moved(devices, deviceId, to));

  // ----------------------------------------------------------- dragging

  const carries = (event: DragEvent) =>
    event.dataTransfer.types.includes(NEW_DEVICE) ||
    event.dataTransfer.types.includes(MOVE_DEVICE);

  function over(event: DragEvent, at: number) {
    if (!carries(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
      MOVE_DEVICE
    )
      ? 'move'
      : 'copy';
    setDropAt(at);
  }

  /** Over a tile: before it from its left half, after it from its right. */
  function overTile(event: DragEvent<HTMLElement>, index: number) {
    const box = event.currentTarget.getBoundingClientRect();
    over(event, event.clientX < box.left + box.width / 2 ? index : index + 1);
  }

  function drop(event: DragEvent) {
    if (!carries(event)) return;
    event.preventDefault();
    const at = dropAt ?? devices.length;
    setDropAt(null);
    const moving = event.dataTransfer.getData(MOVE_DEVICE);
    const kind = event.dataTransfer.getData(NEW_DEVICE);
    if (moving) move(moving, at);
    else if ((DEVICE_KINDS as readonly string[]).includes(kind))
      add(kind as DeviceKind, at);
  }

  const index = open ? devices.indexOf(open) : -1;

  return (
    <section className={styles.rack} aria-labelledby={`${id}-label`}>
      <div className={styles.head}>
        <h2 id={`${id}-label`} className={styles.label}>
          {copy.label}
        </h2>
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

      <div className={styles.row}>
        <span className={styles.rowLabel}>{copy.devices.label}</span>
        <div
          className={styles.palette}
          role="group"
          aria-label={copy.devices.label}
        >
          {DEVICE_KINDS.map((kind) => (
            <div
              key={kind}
              role="button"
              tabIndex={full ? -1 : 0}
              aria-disabled={full || undefined}
              className={styles.paletteItem}
              draggable={!full}
              onDragStart={(event) => {
                event.dataTransfer.setData(NEW_DEVICE, kind);
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={() => setDropAt(null)}
              onClick={() => add(kind)}
              onKeyDown={(event) => {
                if (pressed(event)) add(kind);
              }}
            >
              <Grip />
              {DEVICE_LABEL[kind]}
            </div>
          ))}
        </div>
        <p className={styles.hint}>
          {full ? copy.devices.full : copy.devices.hint}
        </p>
      </div>

      <div className={styles.row}>
        <span id={`${id}-chain`} className={styles.rowLabel}>
          {copy.devices.chain}
        </span>
        <ol
          className={styles.chain}
          aria-labelledby={`${id}-chain`}
          onDragOver={(event) => over(event, dropAt ?? devices.length)}
          onDragLeave={(event) => {
            const into = event.relatedTarget;
            if (!(into instanceof Node) || !event.currentTarget.contains(into))
              setDropAt(null);
          }}
          onDrop={drop}
        >
          {devices.map((device, place) => {
            const title = deviceTitle(chain, device);
            const summary = device.on
              ? summarizeDevice(device)
              : copy.devices.off;
            return (
              <li
                key={device.id}
                className={styles.tile}
                data-open={device.id === open?.id || undefined}
                data-off={!device.on || undefined}
                data-drop={
                  dropAt === place
                    ? 'before'
                    : dropAt === devices.length && place === devices.length - 1
                      ? 'after'
                      : undefined
                }
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(MOVE_DEVICE, device.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDropAt(null)}
                onDragOver={(event) => overTile(event, place)}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={device.id === open?.id}
                  aria-label={`${title}, ${summary}`}
                  className={styles.tileOpen}
                  onClick={() => openDevice(device.id)}
                  onKeyDown={(event) => {
                    if (pressed(event)) openDevice(device.id);
                  }}
                >
                  <span className={styles.tileName}>{title}</span>
                  <span className={styles.tileSummary}>{summary}</span>
                </div>
                <button
                  type="button"
                  className={styles.light}
                  aria-pressed={device.on}
                  aria-label={`${title}: ${device.on ? copy.devices.on : copy.devices.off}`}
                  onClick={() => replace({ ...device, on: !device.on })}
                />
              </li>
            );
          })}
          {/* An empty chain is one place to drop on; after that, a tile's
              far half is the way to the end. */}
          {devices.length === 0 ? (
            <li
              className={styles.slot}
              data-drop={dropAt === 0 || undefined}
              onDragOver={(event) => over(event, 0)}
            >
              {copy.devices.empty}
            </li>
          ) : null}
        </ol>
      </div>

      {open ? (
        <DeviceView
          id={`${id}-${open.id}`}
          copy={copy}
          chain={chain}
          device={open}
          first={index === 0}
          last={index === devices.length - 1}
          analyserRef={analyserRef}
          playing={playing}
          onChange={replace}
          onEarlier={() => move(open.id, index - 1)}
          onLater={() => move(open.id, index + 2)}
          onRemove={() => remove(open.id)}
        />
      ) : null}
    </section>
  );
}

/** The six dots a thing is picked up by. */
function Grip() {
  return (
    <svg
      className={styles.grip}
      viewBox="0 0 6 10"
      width="6"
      height="10"
      aria-hidden="true"
    >
      {[1, 5, 9].map((y) =>
        [1, 5].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="currentColor" />
        ))
      )}
    </svg>
  );
}

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 8 10" width="8" height="10" aria-hidden="true">
      <path
        d={back ? 'M6 1 2 5l4 4' : 'M2 1l4 4-4 4'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

/** The device open below the chain: its name, its place and switch, and its controls. */
function DeviceView({
  id,
  copy,
  chain,
  device,
  first,
  last,
  analyserRef,
  playing,
  onChange,
  onEarlier,
  onLater,
  onRemove
}: {
  id: string;
  copy: ToolRackProps['copy'];
  chain: Chain;
  device: Device;
  first: boolean;
  last: boolean;
  analyserRef: RefObject<AnalyserNode | null>;
  playing: boolean;
  onChange: (device: Device) => void;
  onEarlier: () => void;
  onLater: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.view} data-off={!device.on || undefined}>
      <div className={styles.viewHead}>
        <h3 className={styles.viewName}>{deviceTitle(chain, device)}</h3>
        <div className={styles.viewActions}>
          <button
            type="button"
            className={styles.step}
            aria-label={copy.devices.earlier}
            disabled={first}
            onClick={onEarlier}
          >
            <Chevron back />
          </button>
          <button
            type="button"
            className={styles.step}
            aria-label={copy.devices.later}
            disabled={last}
            onClick={onLater}
          >
            <Chevron />
          </button>
          <button
            type="button"
            className={styles.switch}
            aria-pressed={device.on}
            onClick={() => onChange({ ...device, on: !device.on })}
          >
            {device.on ? copy.devices.on : copy.devices.off}
          </button>
          <button type="button" className={styles.target} onClick={onRemove}>
            {copy.remove}
          </button>
        </div>
      </div>

      <div className={styles.viewBody}>
        {device.kind === 'eq' ? (
          <EqEditor
            // Another device is another set of points: start from its first.
            key={device.id}
            copy={{ ...copy.eq, remove: copy.remove }}
            bands={device.bands}
            analyserRef={analyserRef}
            playing={playing}
            onChange={(bands) => onChange({ ...device, bands })}
          />
        ) : device.kind === 'width' ? (
          <WidthControls
            id={id}
            copy={copy.width}
            value={device.width}
            onChange={(width) => onChange({ ...device, width })}
          />
        ) : (
          <DynamicsControls
            id={id}
            copy={copy.dynamics}
            value={device.dynamics}
            onChange={(dynamics) => onChange({ ...device, dynamics })}
          />
        )}
      </div>
    </div>
  );
}

interface ControlsProps<T, C> {
  id: string;
  copy: C;
  value: T;
  onChange: (value: T) => void;
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
