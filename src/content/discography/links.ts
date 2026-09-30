// Where a release's pages are. Kept apart from the catalogue, so a client
// component can link to a release without taking the catalogue with it.

export const releaseHref = (slug: string) => `/discography/${slug}`;

/** The page of one track on a release (see Track's slug). */
export const trackHref = (release: string, track: string) =>
  `/discography/${release}/${track}`;

/** The release's share link page: to play it, or before it's out, to pre-save it. */
export const shareHref = (slug: string) => `/listen/${slug}`;

/** The same, for one track on a release. */
export const trackShareHref = (release: string, track: string) =>
  `/listen/${release}/${track}`;
