import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/site';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${base}/sitemap.xml` };
}
