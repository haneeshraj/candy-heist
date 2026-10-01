import type { SystemCopy } from '@/content/site/system';

export interface NotFoundPageProps {
  copy: SystemCopy['notFound'];
}

export interface GoldVortexProps {
  className?: string;
  /** Names the turning mark for assistive tech. */
  label: string;
}
