'use client';

import { useId } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import styles from './Filters.module.scss';
import type { FilterGroup, FilterTrayProps } from './Filters.types';

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

function Group({ group }: { group: FilterGroup }) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLabel}>{group.legend}</legend>
      {group.kind === 'one' ? (
        <div className={styles.radios}>
          {group.choices.map((choice) => (
            <label
              key={choice.value}
              className={styles.radio}
              data-on={choice.value === group.value}
            >
              <input
                className={styles.srOnly}
                type="radio"
                name={name}
                value={choice.value}
                checked={choice.value === group.value}
                onChange={() => group.onChange(choice.value)}
              />
              <span className={styles.radioDot} aria-hidden="true" />
              {choice.label}
            </label>
          ))}
        </div>
      ) : (
        <div className={styles.chips}>
          {group.choices.map((choice) => (
            <label
              key={choice.value}
              className={styles.chip}
              data-on={group.values.includes(choice.value)}
            >
              <input
                className={styles.srOnly}
                type="checkbox"
                checked={group.values.includes(choice.value)}
                onChange={() =>
                  group.onChange(toggle(group.values, choice.value))
                }
              />
              {choice.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

// Figma "Filter & sort tray": opened from the bar, it drops in under it
// and pushes the list down; every choice applies as it's made, so the list
// changes under the reader's hand. A sort is one of a few; a filter is any
// number of its choices (none is all). Escape shuts it.
export default function FilterTray({
  id,
  open,
  label,
  groups,
  count,
  clear,
  canClear,
  onClear,
  onClose
}: FilterTrayProps) {
  return (
    <div
      id={id}
      className={styles.tray}
      data-open={open}
      inert={!open}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className={styles.trayClip}>
        <div
          className={styles.trayPanel}
          data-groups={groups.length}
          role="group"
          aria-label={label}
        >
          {groups.map((group) => (
            <Group key={group.legend} group={group} />
          ))}

          <div className={styles.trayFoot}>
            <p className={styles.trayCount} aria-live="polite">
              {count}
            </p>
            <SigilChip
              variant="ghost"
              size="sm"
              icon={null}
              disabled={!canClear}
              onClick={onClear}
            >
              {clear}
            </SigilChip>
          </div>
        </div>
      </div>
    </div>
  );
}
