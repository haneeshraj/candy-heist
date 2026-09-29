import type { ContactFormCopy } from '@/content/contact/contact';
import type { SentMessage } from '@/lib/contact/sendMessage';

export interface ContactFormProps {
  copy: ContactFormCopy;
  /** The page heading the form is named by. */
  labelledBy: string;
  /** Called once the message has gone. */
  onSent: (sent: SentMessage) => void;
}
