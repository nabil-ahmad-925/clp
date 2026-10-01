import type { Cta, DirectoryItem } from './types';

/**
 * Directory cards added from the admin (clp-admin), stored in DynamoDB and served by the listings read API
 * (clp-api). The site is a static export, so they are fetched in the browser and shown next to the built-in cards.
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

/** Widgets the admin can add cards to (the sports' "Learn More" directories; keep in sync with clp-api WIDGETS). */
const LISTING_WIDGETS = new Set([45, 46, 47, 6, 37, 36, 41]);

type Listing = {
  id: string;
  /** The built-in card this listing replaces (listings imported from the site's own data). */
  sourceId?: string;
  title: string;
  subtitle: string;
  excerpt: string;
  bio: string;
  image: string;
  bioImage: string;
  tags: string[];
  buttons: Cta[];
  socials: { network: string; href: string }[];
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Plain-text bio -> paragraphs (blank line = new paragraph, single line break kept), escaped. */
const bioToHtml = (bio: string) =>
  bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** A card from the API; `fallbackImage` is the built-in card's image, used if its own is missing or fails to load. */
export type AddedItem = DirectoryItem & { sourceId?: string; fallbackImage?: string };

const toItem = (l: Listing): AddedItem => ({
  id: l.id,
  sourceId: l.sourceId,
  tags: l.tags,
  image: l.image,
  subtitle: l.subtitle,
  title: l.title,
  excerpt: l.excerpt,
  bio: l.bio,
  bioHtml: bioToHtml(l.bio),
  bioImage: l.bioImage || l.image || undefined,
  buttons: l.buttons.map((b) => ({ ...b, newTab: /^https?:/.test(b.href) })),
  socials: l.socials,
});

/** Whether a directory widget loads its cards from the listings API (the page shows a loader until it answers). */
export const listingsEnabled = (widgetId: number | undefined): widgetId is number =>
  Boolean(API_URL) && widgetId != null && LISTING_WIDGETS.has(widgetId);

/** After this long the page stops waiting and shows its built-in cards. */
const TIMEOUT_MS = 4000;

/** Filter groups as the API takes them: "a|b,c||d" (groups by "|", a group's values by ","). */
const encodeGroups = (groups: string[][]) => groups.map((g) => g.join(',')).join('|');

// Answers are kept per URL for the session (same filters again, or going back to a page, need no request), and a
// request in flight is shared (React's double effects).
const requests = new Map<string, Promise<unknown>>();
const answers = new Map<string, unknown>();

function get<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  let request = requests.get(url) as Promise<T> | undefined;
  if (!request) {
    request = fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`listings API ${res.status}`))))
      .then((data: T) => {
        answers.set(url, data);
        return data;
      });
    // Failures are not kept: the next call tries again.
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request;
}

const filtersParam = (groups: string[][]) => `filters=${encodeURIComponent(encodeGroups(groups))}`;
const listPath = (widgetId: number, groups: string[][], facets: number[]) =>
  `/listings?widget=${widgetId}&${filtersParam(groups)}${facets.length ? `&facets=${facets.join(',')}` : ''}`;

/** Per-option counts of one filter group, counted with the other groups applied. */
export type Facet = { total: number; counts: Record<string, number> };
export type ListingsResult = { items: AddedItem[]; total: number; facets: Record<number, Facet> };

type ListingsResponse = { items: Listing[]; total: number; facets?: Record<string, Facet> };
const toResult = (data: ListingsResponse): ListingsResult => ({
  items: data.items.map(toItem),
  total: data.total,
  facets: Object.fromEntries(Object.entries(data.facets ?? {}).map(([g, f]) => [Number(g), f])),
});

/**
 * Published listings of a widget matching the filter groups (any value of each non-empty group), filtered by the
 * API in DynamoDB, newest first; with the counts of the `facets` groups. Rejects when the API fails or is slow.
 */
export const queryListings = (widgetId: number, groups: string[][], facets: number[] = []) =>
  get<ListingsResponse>(listPath(widgetId, groups, facets)).then(toResult);

/** The answer of queryListings if this session already has it (shown at once, without loading). */
export function cachedListings(widgetId: number, groups: string[][], facets: number[] = []): ListingsResult | undefined {
  const data = answers.get(`${API_URL}${listPath(widgetId, groups, facets)}`) as ListingsResponse | undefined;
  return data && toResult(data);
}
