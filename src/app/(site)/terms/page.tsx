import type { Metadata } from 'next';
import { TermsPage } from '@/components/legal/TermsPage';
import { siteContact } from '@/content/site/contact';
import { termsContent } from '@/content/site/terms';

export const metadata: Metadata = termsContent.meta;

// The terms for what's booked and paid for on the site. The copy is handed
// over from here so a server-side loader can replace it later.
export default function TermsRoute() {
  return (
    <main>
      <TermsPage content={termsContent} email={siteContact.email} />
    </main>
  );
}
