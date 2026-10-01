import type { Metadata } from 'next';
import { DjEnquiry } from '@/components/services/DjEnquiry';
import { djEnquiryContent } from '@/content/services/djEnquiry';
import { siteContact } from '@/content/site/contact';

export const metadata: Metadata = djEnquiryContent.meta;

// "Book me as a DJ": an enquiry for agencies, promoters and venues. The
// copy is handed over from here so a server-side loader can replace it
// later.
export default function DjRoute() {
  return (
    <main>
      <DjEnquiry content={djEnquiryContent} contact={siteContact} />
    </main>
  );
}
