// An enquiry to book Candy Heist as a DJ, from an agency, a promoter or a
// venue: who's asking, then the event. Only the name, the email, the
// budget and what the event is are needed; the rest helps.

export interface DjEnquiry {
  name: string;
  /** Their role: "Booking agent", "Promoter". */
  title: string;
  email: string;
  phone: string;
  eventName: string;
  eventVenue: string;
  budget: string;
  /** The date, the crowd, the set, in their words. */
  about: string;
}

export type EnquiryField = keyof DjEnquiry;

export const REQUIRED_FIELDS = [
  'name',
  'email',
  'budget',
  'about'
] as const satisfies readonly EnquiryField[];

/** Page order: where focus goes first when several fields need a look. */
export const FIELD_ORDER: readonly EnquiryField[] = [
  'name',
  'title',
  'email',
  'phone',
  'eventName',
  'eventVenue',
  'budget',
  'about'
];

export const MAX_LENGTH: Record<EnquiryField, number> = {
  name: 120,
  title: 120,
  email: 254,
  phone: 40,
  eventName: 160,
  eventVenue: 160,
  budget: 80,
  about: 4000
};

export const isRequired = (field: EnquiryField) =>
  (REQUIRED_FIELDS as readonly EnquiryField[]).includes(field);

export const emptyEnquiry = (): DjEnquiry => ({
  name: '',
  title: '',
  email: '',
  phone: '',
  eventName: '',
  eventVenue: '',
  budget: '',
  about: ''
});
