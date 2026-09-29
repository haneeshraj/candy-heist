export interface VideoChapter {
  /** Start, in seconds. */
  at: number;
  label: string;
}

export interface VideoCaptions {
  src: string;
  srcLang: string;
  label: string;
}

export interface VideoPlayerProps {
  /** The video file. Leave it null until there is one: the poster shows and play is disabled. */
  src: string | null;
  poster: string;
  posterAlt: string;
  /** Small gilt line over the title, top left. */
  eyebrow: string;
  title: string;
  /** Shown on the badge and the play label before the metadata loads, e.g. "2:14". */
  duration: string;
  /** Splits the scrub bar and names the current part. */
  chapters?: VideoChapter[];
  captions?: VideoCaptions;
  /** Label under the disabled play button while there's no `src`. */
  unavailableLabel: string;
  /** Label under the play button. @default `Watch the intro · ${duration}` */
  playLabel?: string;
  /** `sizes` for the poster image. @default '100vw' */
  sizes?: string;
  /** Loads the poster eagerly, for a player above the fold. */
  priority?: boolean;
  /**
   * Fills the parent's height instead of keeping 16:9: the poster covers
   * it, and the video crops to it (or letterboxes on a portrait screen).
   * @default false
   */
  fill?: boolean;
  className?: string;
}
