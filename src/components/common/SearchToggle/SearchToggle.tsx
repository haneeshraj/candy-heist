'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CloseIcon, SearchIcon } from '@/components/icons';
import styles from './SearchToggle.module.scss';
import type { SearchToggleProps } from './SearchToggle.types';

// A search that waits to be asked: a lens until it's clicked, then a box
// that grows open with the cursor in it. Typing alone changes nothing; the
// Search button (or Enter) runs it, and × clears it and folds it away. It
// stays open while a search is on, so the words are always in view.
export default function SearchToggle({
  copy,
  value,
  onSearch,
  className
}: SearchToggleProps) {
  const inputId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Set by a click: opening puts the cursor in the box, closing hands
  // focus back to the lens.
  const moveFocus = useRef(false);
  const [open, setOpen] = useState(value !== '');
  const [draft, setDraft] = useState(value);
  // A search changed from outside (cleared with the filters, a link): the
  // box follows it.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
    if (value !== '') setOpen(true);
  }

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (open ? inputRef : toggleRef).current?.focus();
  }, [open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(draft.trim());
  }

  function close() {
    setDraft('');
    setOpen(false);
    moveFocus.current = true;
    if (value !== '') onSearch('');
  }

  return (
    <div
      className={[styles.search, className].filter(Boolean).join(' ')}
      data-open={open}
    >
      {open ? (
        <form
          role="search"
          className={styles.box}
          aria-label={copy.label}
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && value === '') close();
          }}
        >
          <label htmlFor={inputId} className={styles.srOnly}>
            {copy.label}
          </label>
          <SearchIcon className={styles.lens} />
          <input
            id={inputId}
            className={styles.input}
            type="search"
            name="q"
            value={draft}
            placeholder={copy.placeholder}
            autoComplete="off"
            enterKeyHint="search"
            maxLength={120}
            ref={inputRef}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className={styles.submit}>
            {copy.submit}
          </button>
          <button
            type="button"
            className={styles.close}
            aria-label={copy.clear}
            onClick={close}
          >
            <CloseIcon className={styles.closeGlyph} />
          </button>
        </form>
      ) : (
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-label={copy.open}
          onClick={() => {
            moveFocus.current = true;
            setOpen(true);
          }}
        >
          <SearchIcon className={styles.toggleGlyph} />
        </button>
      )}
    </div>
  );
}
