// Where a release's pages are. Kept apart from the catalogue, so a client
// component can link to a release without taking the catalogue with it.

export const releaseHref = (slug: string) => `/discography/${slug}`;

/** The release's share link page: to play it, or before it's out, to pre-save it. */
export const shareHref = (slug: string) => `/listen/${slug}`;
