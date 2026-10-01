import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site/url';

// Every page may be read; the sitemap says where they all are.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
