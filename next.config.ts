import type { NextConfig } from 'next';

// Commissions and sessions became one page, "Book me as a music producer";
// old links follow, and their ?session= or ?commission= still opens the
// item.
const PRODUCER = '/services/producer';

const nextConfig: NextConfig = {
  reactCompiler: true,
  redirects() {
    return ['/sessions', '/services/sessions', '/services/commissions'].map(
      (source) => ({ source, destination: PRODUCER, permanent: true })
    );
  }
};

export default nextConfig;
