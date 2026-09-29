import type { ReactNode } from 'react';
import type { Release } from '@/content/discography/releases';
import type { DiscographyContent } from '@/content/home/discography';
import type { ShelfLayout } from '@/lib/shelf/shelf';

export interface DiscographySectionProps {
  content: DiscographyContent;
}

export interface TapeShelfProps {
  releases: Release[];
  /** Accessible name of the shelf when it's interactive. */
  label: string;
  layout: ShelfLayout;
  /** Desktop: drag, keys and clicks. Phones: the row only runs. */
  interactive: boolean;
  reducedMotion: boolean;
  /** The release nearest the focus changed (index into `releases`). */
  onFocus: (index: number) => void;
  /** Drawn behind the tapes (the monumental title). */
  children?: ReactNode;
}

export interface ShelfReleaseProps {
  release: Release;
}
