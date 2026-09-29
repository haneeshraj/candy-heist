import type { ContactPageContent } from '@/content/contact/contact';

export interface ContactHeroProps {
  /** The page's h1, which the form is labelled by. */
  headingId: string;
  label: ContactPageContent['label'];
  headline: ContactPageContent['headline'];
  intro: ContactPageContent['intro'];
}
