'use client';

import { useId } from 'react';
import {
  MAX_NOTE,
  chainIsEmpty,
  deviceIsNeutral,
  formatClock,
  formatSpan
} from '@/lib/consult/engine';
import { fill } from '@/lib/text/fill';
import styles from './NoteList.module.scss';
import type { NoteListProps } from './NoteList.types';

// What the producer says about the track, in the order it plays: a note
// at a moment, or a section he marked out on the waveform. A section can
// carry tools; "Tools" picks it in the rack beside this. Pressing a note's
// time plays the track from there.
export default function NoteList({
  copy,
  notes,
  activeId,
  marking,
  position,
  full,
  onAddMoment,
  onAddSection,
  onText,
  onRemove,
  onPick,
  onTools
}: NoteListProps) {
  const id = useId();
  const sorted = [...notes].sort((a, b) => a.at - b.at);

  return (
    <section className={styles.notes} aria-labelledby={`${id}-label`}>
      <div className={styles.head}>
        <h2 id={`${id}-label`} className={styles.label}>
          {copy.label}
        </h2>
        <div className={styles.adds}>
          <button
            type="button"
            className={styles.add}
            disabled={full}
            onClick={onAddMoment}
          >
            + {fill(copy.addMoment, { time: formatClock(position) })}
          </button>
          {marking ? (
            <button
              type="button"
              className={styles.add}
              data-marking
              disabled={full}
              onClick={onAddSection}
            >
              +{' '}
              {fill(copy.addSection, {
                span: formatSpan(marking.from, marking.to)
              })}
            </button>
          ) : null}
        </div>
      </div>
      {full ? <p className={styles.hint}>{copy.full}</p> : null}

      {sorted.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        <ol className={styles.list}>
          {sorted.map((note) => {
            // The devices doing something to the sound: an EQ with no
            // points yet doesn't count.
            const tools = (note.chain?.devices ?? []).filter(
              (device) => !deviceIsNeutral(device)
            );
            return (
              <li
                key={note.id}
                className={styles.note}
                data-active={note.id === activeId || undefined}
              >
                <div className={styles.noteHead}>
                  <button
                    type="button"
                    className={styles.time}
                    title={copy.play}
                    onClick={() => onPick(note.id)}
                  >
                    {formatSpan(note.at, note.end)}
                  </button>
                  <div className={styles.noteActions}>
                    {note.end !== null ? (
                      <button
                        type="button"
                        className={styles.action}
                        data-on={!chainIsEmpty(note.chain) || undefined}
                        onClick={() => onTools(note.id)}
                      >
                        {copy.tools}
                        {tools.length
                          ? ` · ${fill(copy.toolsCount, { count: tools.length })}`
                          : ''}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => onRemove(note.id)}
                    >
                      {copy.remove}
                    </button>
                  </div>
                </div>
                <textarea
                  className={styles.text}
                  rows={2}
                  maxLength={MAX_NOTE}
                  placeholder={copy.placeholder}
                  aria-label={`${copy.label} ${formatSpan(note.at, note.end)}`}
                  value={note.text}
                  onChange={(event) => onText(note.id, event.target.value)}
                  onFocus={() => onPick(note.id, false)}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
