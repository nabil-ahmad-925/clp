import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/site';

// Generated at build time (required for the static export).
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${base}/sitemap.xml` };
}
