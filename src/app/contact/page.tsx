import type { Metadata } from 'next';
import { ContactPage } from '@/components/contact/ContactPage';
import { contactPageContent } from '@/content/contact/contact';

export const metadata: Metadata = {
  title: 'Contact · Candy Heist',
  description:
    'Bookings, collaborations, productions or just a question: send Candy Heist a message.'
};

// The contact page. The form runs client-side in ContactPage; the copy is
// handed over from here so a server-side loader can replace it later.
export default function ContactRoute() {
  return (
    <main>
      <ContactPage content={contactPageContent} />
    </main>
  );
}
