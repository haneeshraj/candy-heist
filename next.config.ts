import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Sessions moved under Services; old links (and their ?session=…) follow.
  redirects() {
    return [
      {
        source: '/sessions',
        destination: '/services/sessions',
        permanent: true
      }
    ];
  }
};

export default nextConfig;
