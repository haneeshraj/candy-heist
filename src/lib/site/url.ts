// The site's own address, for what's read away from it: link previews,
// the sitemap, robots.txt. Read on the server only.
//
// NEXT_PUBLIC_SITE_URL sets it outright. In development it's the local
// server. On Vercel it's the address Vercel gives the deployment, as Next
// itself would pick: a preview its own, production the project's
// production domain (the .vercel.app one for now; attach the bought
// domain in Vercel and it's that, with nothing to change here). Anywhere
// else, like a local production build, the local server again.

export function siteOrigin(env: NodeJS.ProcessEnv = process.env) {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  const local = `http://localhost:${env.PORT || 3000}`;
  if (env.NODE_ENV === 'development') return local;
  const preview =
    env.VERCEL_ENV === 'preview' && (env.VERCEL_BRANCH_URL || env.VERCEL_URL);
  if (preview) return `https://${preview}`;
  if (env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return local;
}

export const SITE_URL = siteOrigin().replace(/\/+$/, '');

/** An absolute address for a path on the site. */
export const absolute = (path: string) =>
  `${SITE_URL}${path === '/' ? '' : path}`;
