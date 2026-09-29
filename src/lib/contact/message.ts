// A message from the contact page: one shape for every kind of request (a
// booking, a collaboration, a question), so the subject and the message
// carry the difference. The additional details are optional and sit behind
// a toggle on the page, but they're always part of the message.

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone: string;
  organisation: string;
  date: string;
  location: string;
  budget: string;
  links: string;
}

export type ContactField = keyof ContactMessage;

export const REQUIRED_FIELDS = [
  'name',
  'email',
  'subject',
  'message'
] as const satisfies readonly ContactField[];

/** Behind the "Additional details" toggle. */
export const DETAIL_FIELDS = [
  'phone',
  'organisation',
  'date',
  'location',
  'budget',
  'links'
] as const satisfies readonly ContactField[];

/** Page order: where focus goes first when several fields need a look. */
export const FIELD_ORDER: readonly ContactField[] = [
  ...REQUIRED_FIELDS,
  ...DETAIL_FIELDS
];

export const MAX_LENGTH: Record<ContactField, number> = {
  name: 120,
  email: 254,
  subject: 160,
  message: 4000,
  phone: 40,
  organisation: 160,
  date: 80,
  location: 120,
  budget: 80,
  links: 500
};

export const isDetailField = (field: ContactField) =>
  (DETAIL_FIELDS as readonly ContactField[]).includes(field);

export const emptyMessage = (): ContactMessage => ({
  name: '',
  email: '',
  subject: '',
  message: '',
  phone: '',
  organisation: '',
  date: '',
  location: '',
  budget: '',
  links: ''
});
