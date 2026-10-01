export interface SearchToggleCopy {
  /** Names the lens that opens the box. */
  open: string;
  /** Names the box and its input. */
  label: string;
  placeholder: string;
  /** The button that runs the search. */
  submit: string;
  /** Names × : clears the search and folds the box away. */
  clear: string;
}

export interface SearchToggleProps {
  copy: SearchToggleCopy;
  /** The search that's on; '' for none. */
  value: string;
  /** Called with the trimmed words when searched, '' when cleared. */
  onSearch: (query: string) => void;
  className?: string;
}
