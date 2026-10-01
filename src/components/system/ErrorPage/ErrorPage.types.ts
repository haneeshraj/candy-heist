import type { SystemCopy } from '@/content/site/system';

export interface ErrorPageProps {
  copy: SystemCopy['error'];
  /** The error's reference in the server logs, when there is one. */
  digest?: string;
  /** Tries the page again. */
  onRetry: () => void;
}
