import 'server-only';
import type { PostCard } from './types';
import { pageStore } from './data';
import archives from './data/archives.json';

/**
 * Blog archives from the original site, keyed by path: category pages (/category/<parent>/<child>/)
 * and author pages (/author/<name>/, /author/<name>/page/2/).
 */
export type CategoryArchive = {
  path: string;
  meta: { title: string; description: string };
  /** Small label above the title: "Category" or "All Posts By". */
  subheader: string;
  title: string;
  posts: ArchivePost[];
  /** Page links under the grid (only archives with more than one page); the current page has no href, a gap ("…")
   *  stands for the pages left out of a long list. */
  pagination?: { label: string; href?: string; kind: 'prev' | 'page' | 'gap' | 'next' }[];
};

/** Category label shown above a card's title (Salient's "meta-category" button); colours set per category. */
export type ArchiveCategory = { label: string; href: string; color?: string; background?: string };

export type ArchivePost = PostCard & { categories?: ArchiveCategory[] };

const store = pageStore<CategoryArchive>(archives as Record<string, Omit<CategoryArchive, 'path'>>);

export const getArchive = store.get;

/** Archive paths under a section ("category" or "author"), as path segments for a catch-all route. */
export const archiveParams = (section: 'category' | 'author') =>
  store.paths.filter((p) => p.startsWith(`/${section}/`)).map((p) => ({ path: p.split('/').filter(Boolean).slice(1) }));
