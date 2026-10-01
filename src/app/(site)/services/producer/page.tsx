import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { catalogue } from '@/content/services/catalogue';
import { producerFlowContent } from '@/content/services/flows';
import { siteContact } from '@/content/site/contact';

export const metadata: Metadata = {
  title: 'Book me as a music producer · Candy Heist',
  description:
    'Mixing, mastering and beat production by Candy Heist, or one on one sessions on Discord or Google Meet. Pick a service and book it.'
};

// "Book me as a music producer": commissions and 1-1 sessions in one list.
// Everything happens client-side in BookingFlow; the copy and the items
// are handed over from here, so a server-side loader (Candy Haven's
// catalogue) can replace them later.
export default function ProducerRoute() {
  return (
    <main>
      <BookingFlow
        content={producerFlowContent}
        items={catalogue}
        contact={siteContact}
      />
    </main>
  );
}
