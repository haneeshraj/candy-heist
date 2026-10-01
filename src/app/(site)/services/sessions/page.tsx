import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { sessions } from '@/content/services/catalogue';
import { sessionsFlowContent } from '@/content/services/flows';
import { siteContact } from '@/content/site/contact';

export const metadata: Metadata = {
  title: 'Book a session · Candy Heist',
  description:
    'Production sessions and DJ lessons, one on one with Candy Heist on Discord or Google Meet. Pick a session, a time, and book it.'
};

// Booking a session. Everything happens client-side in BookingFlow; the
// copy and the sessions are handed over from here, so a server-side
// loader (Candy Haven's catalogue) can replace them later.
export default function SessionsRoute() {
  return (
    <main>
      <BookingFlow
        kind="session"
        content={sessionsFlowContent}
        items={sessions}
        contact={siteContact}
      />
    </main>
  );
}
