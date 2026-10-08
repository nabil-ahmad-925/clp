import taxonomy from './data/articleCategories.json';
import type { ArchivePost } from './categories';
import type { BlogPost, FilterPost, Link, Post, PostCard, PostNavLink } from './types';

/**
 * Blog articles written in the admin's Articles tab, stored by clp-api and fetched in the browser (the site is a
 * static export). The original posts were imported there too, so the post pages, category and author archives,
 * Updates & News and the category grids show the live articles, starting from the built-in copy while they load (and
 * keeping it if the API can't be reached).
 *
 * Categories are "<category>" and "<category>/<subcategory>" paths of data/articleCategories.json (the archives'
 * /category/<category>/<subcategory>/ addresses); authors are its author slugs (/author/<slug>/).
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');
/** After this long a request gives up (the page keeps what it shows, or offers to try again). */
const TIMEOUT_MS = 10_000;

/** `sport`: a sport subcategory's sport (the experience directories' sport filter value). */
export type ArticleSubcategory = { slug: string; name: string; sport?: string; featured?: boolean; page?: string };
/** `label`: the colours of the category's label on archive cards (the site's gold when none). */
export type ArticleCategory = { slug: string; name: string; label?: { color: string; background: string }; page?: string; subcategories: ArticleSubcategory[] };

export const ARTICLE_CATEGORIES = taxonomy.categories as ArticleCategory[];
const AUTHORS = taxonomy.authors;
/** The Writer filter's choices: the company's articles, those of partners, or of sponsors (the API's `writer`). */
export const ARTICLE_WRITERS = [
  { value: 'clp', label: 'Compete Like Pros' },
  { value: 'partners', label: 'CLP Partners' },
  { value: 'sponsor', label: 'Sponsor' },
];
/** The cities an article can be about (slugs as the experience directories' City filter values). */
export const ARTICLE_LOCATIONS: { slug: string; name: string }[] = taxonomy.locations;
/** A city's name ("New York City" for "new-york"). */
export const locationName = (slug: string) => ARTICLE_LOCATIONS.find((l) => l.slug === slug)?.name ?? slug;
/** An article's cities as shown ("Boston, Miami"; undefined when none). */
const locationsShown = (slugs: string[] = []) => slugs.map(locationName).join(', ') || undefined;

/** An article in a list (no body). `path` is its page: "/<slug>/" for the original posts, "/article/?slug=<slug>" for new ones. */
export type ArticleSummary = {
  slug: string;
  path: string;
  title: string;
  excerpt: string;
  image: string;
  categories: string[];
  /** An author slug (/author/<slug>/), or a partner's id for a partner's article. */
  author: string;
  /** Who wrote it, as shown: Compete Like Pros, or the partner's name. */
  authorName?: string;
  publishedAt: string;
  readingTime: number;
  /** The cities it is about (ARTICLE_LOCATIONS slugs). */
  locations?: string[];
};
export type Article = ArticleSummary & { html: string };
export type ArticlePageData = { item: Article; previous: ArticleSummary | null; next: ArticleSummary | null; related: ArticleSummary[] };

export const articlesEnabled = Boolean(API_URL);

/**
 * One numbered page of a list (items newest first). Asked with counts: 1, the filters' option counts, each with every
 * other filter applied: `counts` per sport, `lengths` per reading length and `places` per city slug (the search bar's
 * suggestions).
 */
export type ArticleList = {
  items: ArticleSummary[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  counts?: Record<string, number>;
  lengths?: Record<string, number>;
  places?: Record<string, number>;
  authors?: Record<string, number>;
};

/** The list orders: "Recommended" is newest first (the API's default, sent as no sort). */
export const ARTICLE_SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title: A to Z' },
  { value: 'title-desc', label: 'Title: Z to A' },
] as const;
export type ArticleSort = (typeof ARTICLE_SORTS)[number]['value'];

/** The Length filter's choices: reading time in minutes ("10" = 6 to 10; the API's LENGTHS). */
export const ARTICLE_LENGTHS = [
  { value: '5', label: 'Up to 5 min read' },
  { value: '10', label: '6–10 min read' },
  { value: '15', label: '11–15 min read' },
  { value: '20', label: '16–20 min read' },
  { value: 'more', label: 'Over 20 min read' },
];

/**
 * A page of published articles, newest first: of a category path, an author, some sports or reading lengths, a
 * location, matching search words, or all of them.
 */
export type ArticleQuery = { category?: string; author?: string; writer?: string; sports?: string[]; lengths?: string[]; loc?: string; q?: string };

/** The query string of a list request (sports and lengths comma-separated; empty values left out). */
const listQuery = ({ sports, lengths, ...rest }: ArticleQuery & { limit?: number; page?: number; counts?: 1; count?: 1 }) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) if (v !== undefined && v !== '') qs.set(k, String(v));
  if (sports?.length) qs.set('sport', sports.join(','));
  if (lengths?.length) qs.set('length', lengths.join(','));
  return qs;
};

export async function fetchArticles({ sort, ...options }: ArticleQuery & { limit?: number; page?: number; counts?: 1; sort?: ArticleSort } = {}) {
  if (!API_URL) throw new Error('NEXT_PUBLIC_LISTINGS_API_URL is not set');
  const qs = listQuery(options);
  if (sort && sort !== 'recommended') qs.set('sort', sort);
  const res = await fetch(`${API_URL}/articles?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Articles: ${res.status}`);
  return (await res.json()) as ArticleList;
}

/** How many published articles match (the filter panel's "Show N results"). */
export async function countArticles(query: ArticleQuery) {
  if (!API_URL) throw new Error('NEXT_PUBLIC_LISTINGS_API_URL is not set');
  const qs = listQuery({ ...query, count: 1 as const });
  const res = await fetch(`${API_URL}/articles?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Articles: ${res.status}`);
  return ((await res.json()) as { total: number }).total;
}

/** One published article with its page's links; null when there is none of that slug (deleted or unpublished). */
export async function fetchArticle(slug: string): Promise<ArticlePageData | null> {
  if (!API_URL) throw new Error('NEXT_PUBLIC_LISTINGS_API_URL is not set');
  const res = await fetch(`${API_URL}/articles/${encodeURIComponent(slug)}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    // Only the API's own answer means there is no such article (not, say, a gateway without the route).
    const body = await res.json().catch(() => ({}));
    if (body.code === 'NOT_FOUND' || body.code === 'INVALID_SLUG') return null;
    throw new Error(`Article: ${res.status}`);
  }
  return (await res.json()) as ArticlePageData;
}

// --- Shown as -------------------------------------------------------------------------------------------------------

/** "June 26, 2026" for "2026-06-26". */
export const articleDate = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Who wrote an article: an author of the taxonomy (with their archive), or a partner (by name, no archive). */
export const authorOf = (a: Pick<ArticleSummary, 'author' | 'authorName'>) => {
  const author = AUTHORS.find((x) => x.slug === a.author);
  return author ? { name: author.name, href: `/author/${author.slug}/` } : { name: a.authorName || 'Compete Like Pros' };
};

/** A category path's name and archive ("Basketball", /category/strategy-and-insights/basketball-strategy-insights/). */
export function categoryLink(path: string): Link | null {
  const [top, sub] = path.split('/');
  const category = ARTICLE_CATEGORIES.find((c) => c.slug === top);
  if (!category) return null;
  if (!sub) return { label: category.name, href: `/category/${top}/` };
  const subcategory = category.subcategories.find((s) => s.slug === sub);
  return subcategory ? { label: subcategory.featured ? `Featured – ${category.name}` : subcategory.name, href: `/category/${top}/${sub}/` } : null;
}

/** The most specific category links of an article (a category is left out when one of its subcategories is there). */
export const categoryLinks = (paths: string[]) =>
  paths
    .filter((p) => p.includes('/') || !paths.some((q) => q.startsWith(`${p}/`)))
    .map(categoryLink)
    .filter((l): l is Link => l !== null);

/** The search field's placeholder of an article list: "Search Strategy and Insights articles…". */
export function articleSearchPlaceholder(source: string | undefined) {
  const [top, sub] = source?.split('/') ?? [];
  const category = ARTICLE_CATEGORIES.find((c) => c.slug === top);
  const name = sub ? category?.subcategories.find((s) => s.slug === sub)?.name : category?.name;
  return name ? `Search ${name} articles…` : 'Search articles…';
}

/** The category path of an archive address ("/category/a/b/" -> "a/b"), or null for other pages. */
export const categoryOfArchive = (archivePath: string) => {
  const m = archivePath.match(/^\/category\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/$/);
  return m ? (m[2] ? `${m[1]}/${m[2]}` : m[1]) : null;
};

export const toPostCard = (a: ArticleSummary): PostCard => ({ title: a.title, href: a.path, image: a.image, author: authorOf(a).name, date: articleDate(a.publishedAt) });

/** An archive card: as toPostCard, with the labels of the article's categories (top level) over it. */
export const toArchivePost = (a: ArticleSummary): ArchivePost => ({
  ...toPostCard(a),
  categories: ARTICLE_CATEGORIES.filter((c) => a.categories.includes(c.slug)).map((c) => ({
    label: c.name,
    href: `/category/${c.slug}/`,
    ...(c.label ? { color: c.label.color, background: c.label.background } : {}),
  })),
});

export const toPost = (a: ArticleSummary): Post => ({ title: a.title, href: a.path, image: a.image, alt: a.title, date: articleDate(a.publishedAt) });

const navLink = (a: ArticleSummary | null, label: string): PostNavLink | undefined => (a ? { label, title: a.title, href: a.path, image: a.image } : undefined);

/** A card of the category grid (PostFilter); its `categories` are category paths. */
export function toFilterPost(a: ArticleSummary): FilterPost {
  const day = new Date(`${a.publishedAt}T00:00:00Z`);
  return {
    id: a.slug,
    categories: a.categories,
    day: String(day.getUTCDate()).padStart(2, '0'),
    month: day.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
    image: a.image,
    imageAlt: a.title,
    imageWidth: 300,
    imageHeight: 169,
    title: a.title,
    href: a.path,
    // The cards clip it to three lines.
    excerpt: a.excerpt,
    comments: '0 Comments',
    readingTime: `${a.readingTime} min read`,
    location: locationsShown(a.locations),
  };
}

/** The post page's data from a live article. */
export function toBlogPost({ item, previous, next, related }: ArticlePageData): BlogPost {
  return {
    path: item.path,
    meta: { title: `${item.title} - Compete Like Pros™`, description: item.excerpt },
    hero: {
      title: item.title,
      image: item.image,
      categories: categoryLinks(item.categories),
      author: authorOf(item),
      date: articleDate(item.publishedAt),
      location: locationsShown(item.locations),
      comments: { label: 'No Comments', href: '#respond' },
      readingTime: `${item.readingTime} min read`,
    },
    html: item.html,
    previous: navLink(previous, 'Previous Post'),
    next: navLink(next, 'Next Post'),
    related: { title: 'You May Also Like', posts: related.map(toPostCard) },
  };
}
