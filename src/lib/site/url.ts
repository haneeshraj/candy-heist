// The site's own address, for what's read away from it: link previews,
// the sitemap, robots.txt. Set NEXT_PUBLIC_SITE_URL for each deployment
// (a preview build has its own); the fallback is the domain the booking
// email uses.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://candyheist.com'
).replace(/\/+$/, '');

/** An absolute address for a path on the site. */
export const absolute = (path: string) =>
  `${SITE_URL}${path === '/' ? '' : path}`;
