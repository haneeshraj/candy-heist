import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { commissions } from '@/content/services/catalogue';
import { commissionsFlowContent } from '@/content/services/flows';
import { siteContact } from '@/content/site/contact';

export const metadata: Metadata = {
  title: 'Start a commission · Candy Heist',
  description:
    'Mixing, mastering and beat production by Candy Heist, finished to release standard. Pick a commission and pay upfront.'
};

// Starting a commission. Everything happens client-side in BookingFlow;
// the copy and the commissions are handed over from here, so a
// server-side loader (Candy Haven's catalogue) can replace them later.
export default function CommissionsRoute() {
  return (
    <main>
      <BookingFlow
        kind="commission"
        content={commissionsFlowContent}
        items={commissions}
        contact={siteContact}
      />
    </main>
  );
}
