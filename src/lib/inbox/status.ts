// Where a message or an enquiry stands. Set by Candy Haven; the site only
// ever files one as new.

export const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const ENQUIRY_STATUSES = [
  'new',
  'in_talks',
  'confirmed',
  'declined',
  'archived'
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const isMessageStatus = (value: unknown): value is MessageStatus =>
  (MESSAGE_STATUSES as readonly unknown[]).includes(value);

export const isEnquiryStatus = (value: unknown): value is EnquiryStatus =>
  (ENQUIRY_STATUSES as readonly unknown[]).includes(value);
