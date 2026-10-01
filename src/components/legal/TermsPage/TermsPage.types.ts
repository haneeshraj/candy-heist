import type { TermsContent } from '@/content/site/terms';

export interface TermsPageProps {
  content: TermsContent;
  /** The booking address, where the terms name it. */
  email: string;
}
