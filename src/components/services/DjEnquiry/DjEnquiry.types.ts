import type { DjEnquiryContent } from '@/content/services/djEnquiry';
import type { SentEnquiry } from '@/lib/enquiry/sendEnquiry';

/** Candy's own email and Discord. */
interface Contact {
  email: string;
  discord: string;
}

export interface DjEnquiryProps {
  content: DjEnquiryContent;
  contact: Contact;
}

export interface EnquiryFormProps {
  copy: DjEnquiryContent['form'];
  /** The heading the form is named by. */
  labelledBy: string;
  /** Called once the enquiry has gone. */
  onSent: (sent: SentEnquiry) => void;
}

export interface EnquirySentProps {
  copy: DjEnquiryContent['sent'];
  sent: SentEnquiry;
  contact: Contact;
}
