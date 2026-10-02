import type { NextConfig } from 'next';

// Commissions and sessions became one page, "Book me as a music producer";
// old links follow, and their ?session= or ?commission= still opens the
// item.
const PRODUCER = '/services/producer';

/**
 * Where release covers are online: the Supabase project's public buckets
 * (lib/storage/covers.ts), and nowhere else next/image will fetch from.
 * Without the project set, the covers are all the placeholder, on the site.
 */
function coverPatterns(): URL[] {
  const project = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!project || !URL.canParse(project)) return [];
  return [new URL('/storage/v1/object/public/**', project)];
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  // The tape template is read from disk when a cover arrives
  // (lib/shelf/tapeFromCover.ts), so it ships with that route.
  outputFileTracingIncludes: {
    '/api/haven/releases/**': ['./src/lib/shelf/tape-template/**']
  },
  images: {
    remotePatterns: coverPatterns()
  },
  redirects() {
    return ['/sessions', '/services/sessions', '/services/commissions'].map(
      (source) => ({ source, destination: PRODUCER, permanent: true })
    );
  }
};

export default nextConfig;
