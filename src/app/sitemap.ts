import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/site';
import { sportPages } from '@/content/sports';
import { servicePages } from '@/content/services';
import { legalPages } from '@/content/legal';

const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/experiences/',
    '/resources/',
    '/updates/',
    '/about-us/',
    '/partnerships/',
    '/our-expectations/',
    ...sportPages.map((p) => `/${p.section}/${p.slug}/`),
    ...servicePages.map((p) => `/${p.slug}/`),
    ...legalPages.map((p) => `/${p.slug}/`),
  ];
  return paths.map((path) => ({ url: `${base}${path}`, changeFrequency: 'weekly', priority: path === '/' ? 1 : 0.7 }));
}
