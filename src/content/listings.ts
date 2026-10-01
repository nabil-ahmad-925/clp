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
const listPath = (widgetId: number, groups: string[][], facets: number[], limit: number, cursor?: string) =>
  `/listings?widget=${widgetId}&${filtersParam(groups)}${facets.length ? `&facets=${facets.join(',')}` : ''}&limit=${limit}` +
  (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');

/** The API's largest page; widgets without "Load More" read every page of this size. */
export const MAX_PAGE = 100;

/** Per-option counts of one filter group, counted with the other groups applied. */
export type Facet = { total: number; counts: Record<string, number> };
/**
 * Listings loaded so far (one or more pages, newest first). `total` counts every match; `nextCursor` continues the
 * list (null: everything is loaded).
 */
export type ListingsResult = { items: AddedItem[]; total: number; facets: Record<number, Facet>; nextCursor: string | null; limit: number };

type ListingsResponse = { items: Listing[]; total?: number; facets?: Record<string, Facet>; nextCursor: string | null; limit: number };
const toResult = (data: ListingsResponse): ListingsResult => ({
  items: data.items.map(toItem),
  total: data.total ?? data.items.length,
  facets: Object.fromEntries(Object.entries(data.facets ?? {}).map(([g, f]) => [Number(g), f])),
  nextCursor: data.nextCursor ?? null,
  limit: data.limit,
});

/** Every page after the first one (widgets that show all their cards at once). */
async function rest(widgetId: number, groups: string[][], first: ListingsResult): Promise<ListingsResult> {
  let result = first;
  while (result.nextCursor) result = await moreListings(widgetId, groups, result);
  return result;
}

/**
 * The first page of a widget's published listings matching the filter groups (any value of each non-empty group),
 * filtered by the API in DynamoDB, newest first; with the total and the counts of the `facets` groups. `limit`
 * omitted: every page is loaded. Rejects when the API fails or is slow.
 */
export const queryListings = (widgetId: number, groups: string[][], facets: number[] = [], limit?: number) =>
  get<ListingsResponse>(listPath(widgetId, groups, facets, limit ?? MAX_PAGE))
    .then(toResult)
    .then((r) => (limit === undefined ? rest(widgetId, groups, r) : r));

/** `loaded` with the next page appended (the same filters; `limit` items, by default the first page's size). */
export async function moreListings(widgetId: number, groups: string[][], loaded: ListingsResult, limit = loaded.limit): Promise<ListingsResult> {
  if (!loaded.nextCursor) return loaded;
  const page = toResult(await get<ListingsResponse>(listPath(widgetId, groups, [], limit, loaded.nextCursor)));
  // A listing can't repeat across pages, but one added meanwhile must not show twice either.
  const seen = new Set(loaded.items.map((i) => i.id));
  return { ...loaded, items: [...loaded.items, ...page.items.filter((i) => !seen.has(i.id))], nextCursor: page.nextCursor };
}

/** The first page of queryListings if this session already has it (shown at once, without loading). */
export function cachedListings(widgetId: number, groups: string[][], facets: number[] = [], limit?: number): ListingsResult | undefined {
  const data = answers.get(`${API_URL}${listPath(widgetId, groups, facets, limit ?? MAX_PAGE)}`) as ListingsResponse | undefined;
  // Widgets that load every page can only use it when it was the only one.
  if (!data || (limit === undefined && data.nextCursor)) return undefined;
  return toResult(data);
}
