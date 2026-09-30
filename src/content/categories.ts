// Blog category archives (/category/<slug>/), from the original site.
import type { PostCard } from './types';
import { upload } from './site';

export type CategoryArchive = { slug: string; meta: { title: string; description: string }; title: string; posts: PostCard[] };

export const categoryArchives: CategoryArchive[] = [
  {
    slug: 'event-project-management',
    meta: { title: 'Event / Project Management - Compete Like Pros™', description: '' },
    title: 'Event / Project Management',
    posts: [
      {
        title: 'Best Sports Branding Strategies to Elevate Your Athletic Identity',
        href: '/best-sports-branding-strategies-to-elevate-your-athletic-identity/',
        image: upload('/2025/07/sports-content-digiday.webp'),
        author: 'Compete Like Pros',
        date: 'January 21, 2025',
      },
    ],
  },
];

export const getCategoryArchive = (slug: string) => categoryArchives.find((c) => c.slug === slug);
