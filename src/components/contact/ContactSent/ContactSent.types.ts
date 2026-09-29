import type { ContactSentCopy } from '@/content/contact/contact';
import type { SiteContact } from '@/content/site/contact';
import type { SentMessage } from '@/lib/contact/sendMessage';

export interface ContactSentProps {
  copy: ContactSentCopy;
  /** Who the message was from, for the thanks and the reply address. */
  sent: SentMessage;
  /** For anything about a date that's close. */
  phone: SiteContact['phone'];
  /** Back to an empty form. */
  onAgain: () => void;
}
