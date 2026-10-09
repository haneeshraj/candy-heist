// The two kinds of service, and the glyphs a service can carry. Kept on
// their own, with nothing else, so the browse controls in the browser can
// list the kinds without bringing the catalogue's checks along.

export const SERVICE_ICONS = ['production', 'dj', 'feedback', 'mix'] as const;
export const SERVICE_KINDS = ['commission', 'session'] as const;

export type ServiceKind = (typeof SERVICE_KINDS)[number];
export type ServiceIcon = (typeof SERVICE_ICONS)[number];
