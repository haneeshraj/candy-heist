import type { RefObject } from 'react';

export interface FilterButtonProps {
  label: string;
  /** How many filters are on; shown as a count when there are any. */
  count: number;
  open: boolean;
  /** The tray's id. */
  controls: string;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}

export interface FilterTag {
  key: string;
  label: string;
  remove: () => void;
}

export interface FilterTagsProps {
  tags: FilterTag[];
  /** Names each tag's ×: "Remove {filter}". */
  remove: string;
  /** "8 of 14", after the tags. */
  count?: string;
}

export interface FilterChoice {
  value: string;
  label: string;
}

/** One of a few (radios), or any number (checkbox chips, none is all). */
export type FilterGroup =
  | {
      kind: 'one';
      legend: string;
      choices: FilterChoice[];
      value: string;
      onChange: (value: string) => void;
    }
  | {
      kind: 'many';
      legend: string;
      choices: FilterChoice[];
      values: string[];
      onChange: (values: string[]) => void;
    };

export interface FilterTrayProps {
  id: string;
  open: boolean;
  /** Names the tray's panel. */
  label: string;
  groups: FilterGroup[];
  /** "8 of 14 releases", read out as it changes. */
  count: string;
  clear: string;
  canClear: boolean;
  onClear: () => void;
  onClose: () => void;
}
