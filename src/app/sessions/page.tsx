import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { bookingContent } from '@/content/booking/booking';
import { services } from '@/content/sessions/services';

export const metadata: Metadata = {
  title: 'Book a session · Candy Heist',
  description:
    'Production sessions, DJ lessons, project feedback and mix & master, one on one with Candy Heist. Pick a session, a time, and book it.'
};

// The booking page. Everything happens client-side in BookingFlow; the copy
// and the services are handed over from here so a server-side loader can
// replace them later.
export default function SessionsPage() {
  return (
    <main>
      <BookingFlow content={bookingContent} services={services} />
    </main>
  );
}
