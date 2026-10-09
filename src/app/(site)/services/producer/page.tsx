import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { producerFlowContent } from '@/content/services/flows';
import { getServices } from '@/content/services/getServices';
import { siteContact } from '@/content/site/contact';

export const metadata: Metadata = {
  title: 'Book me as a music producer · Candy Heist',
  description:
    'Mixing, mastering and beat production by Candy Heist, or one on one sessions on Discord or Google Meet. Pick a service and book it.'
};

// "Book me as a music producer": commissions and 1-1 sessions in one list.
// Everything happens client-side in BookingFlow; the copy, the services and
// the hours are handed over from here, Candy Haven's once it has published
// (getServices), so a publish shows on the next visit.
export default async function ProducerRoute() {
  const { items, hours } = await getServices();
  return (
    <main>
      <BookingFlow
        content={producerFlowContent}
        items={items}
        hours={hours}
        contact={siteContact}
      />
    </main>
  );
}
