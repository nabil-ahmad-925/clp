import type { Cta, DirectoryFilter, DirectoryItem, Provider } from './types';

/**
 * Directory cards added from the admin (clp-admin), stored in DynamoDB and served by the listings read API
 * (clp-api). The site is a static export, so they are fetched in the browser and shown next to the built-in cards.
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

/** The site's two menus and the facilities directories; every directory widget is one of them (its listings' `listingType`). */
export type ListingType = 'experiences' | 'resources' | 'facilities' | 'services';

/**
 * Widgets the admin can add cards to, by listing type: the directories behind the sport pages' "Learn More" tiles
 * (keep in sync with clp-api WIDGET_TYPES and the admin's scripts/sync-widgets.mjs).
 */
const WIDGET_TYPES: Record<number, ListingType> = {
  45: 'experiences', // Advancement & Workshops
  46: 'experiences', // Branded Activations
  47: 'experiences', // Camps & Tournaments
  6: 'experiences', // Groups & Private Lessons
  37: 'experiences', // Leagues & Social Clubs
  41: 'experiences', // Trips & Retreats
  40: 'resources', // Dieting & Nutrition
  16: 'resources', // Injury Prevention & Recovery
  39: 'resources', // Mental Health & Resilience
  33: 'resources', // Strength & Conditioning
  10: 'facilities', // Facilities & Parks (Baseball & Softball)
  9: 'facilities', // Facilities & Parks (Basketball)
  42: 'facilities', // Facilities & Venues (Esports)
  8: 'facilities', // Facilities & Parks (Fútbol (Soccer))
  43: 'facilities', // Facilities & Clubs (Golfing)
  44: 'facilities', // Facilities & Parks (Pickleball)
  // The home page's service areas (ids of their own, see data/serviceDirectories.json).
  101: 'services', // Brand & Product Development
  102: 'services', // Content Creation & Licensing
  103: 'services', // Event & Project Management
  104: 'services', // Fundraising & Retailing
  105: 'services', // Nutrition & Performance Programming
  106: 'services', // Procurement & Logistics
  107: 'services', // Sports Tourism
};

/** Category names by widget, as the sport pages' tiles (and the admin) name them. */
const WIDGET_NAMES: Record<number, string> = {
  45: 'Advancement & Workshops',
  46: 'Branded Activations',
  47: 'Camps & Tournaments',
  6: 'Groups & Private Lessons',
  37: 'Leagues & Social Clubs',
  41: 'Trips & Retreats',
  40: 'Dieting & Nutrition',
  16: 'Injury Prevention & Recovery',
  39: 'Mental Health & Resilience',
  33: 'Strength & Conditioning',
  10: 'Facilities & Parks',
  9: 'Facilities & Parks',
  42: 'Facilities & Venues',
  8: 'Facilities & Parks',
  43: 'Facilities & Clubs',
  44: 'Facilities & Parks',
  101: 'Brand & Product Development',
  102: 'Content Creation & Licensing',
  103: 'Event & Project Management',
  104: 'Fundraising & Retailing',
  105: 'Nutrition & Performance Programming',
  106: 'Procurement & Logistics',
  107: 'Sports Tourism',
};

/** A directory's category name ("Advancement & Workshops"), when it is one of the listing categories. */
export const categoryName = (widgetId: number | undefined) => (widgetId != null ? WIDGET_NAMES[widgetId] : undefined);

/** The line under a listing page's heading, by category (the new design's listing page). */
const WIDGET_BLURBS: Record<number, string> = {
  45: 'Skill clinics, ID and showcase prep, coaching workshops and player development.',
  46: 'Brand-hosted pickups, pop-ups, fan events and sponsored experiences.',
  47: 'Day camps, ID camps and weekend tournaments from CLP partners and local programs.',
  6: 'Small-group sessions and one-on-one training with local coaches.',
  37: 'Pickup runs, rec leagues and social clubs for every level.',
  41: 'Travel programs, showcases and team retreats.',
  40: 'Sports dietitians, meal planning and fueling guides for players and parents.',
  16: 'Physical therapists, athletic trainers, recovery studios and prevention programs.',
  39: 'Sport psychologists, counselors and mindset programs for athletes and families.',
  33: 'Speed, strength and conditioning coaches, gyms and training plans.',
  10: 'Fields, courts and indoor spaces to book.',
  9: 'Fields, courts and indoor spaces to book.',
  8: 'Fields, courts and indoor spaces to book.',
  44: 'Fields, courts and indoor spaces to book.',
  43: 'Courses, ranges and clubs to play and practice.',
  42: 'Gaming centers, arenas and venues to play and compete.',
};

/** A listing category's line under the page heading. */
export const categoryBlurb = (widgetId: number | undefined) => (widgetId != null ? WIDGET_BLURBS[widgetId] : undefined);

/** Whether a directory widget is an Experiences or Resources category: its page uses the listing-page design. */
export const isListingWidget = (widgetId: number | undefined): widgetId is number =>
  widgetId != null && (WIDGET_TYPES[widgetId] === 'experiences' || WIDGET_TYPES[widgetId] === 'resources');

/** Whether a directory widget is a sport's facilities: its page uses the facilities design (Volunteering & Open Play). */
export const isFacilitiesWidget = (widgetId: number | undefined): widgetId is number => widgetId != null && WIDGET_TYPES[widgetId] === 'facilities';

/** A CLP partner in a listing page's spotlight (from the partner directory). */
export type SpotlightPartner = { name: string; href: string; image?: string; excerpt: string };

/**
 * What a listing page's directory shows besides its cards: its design (an Experiences or Resources category, or a
 * sport's facilities), its menu, category and the partner spotlight (none on facilities).
 */
export type ListingSetup = { kind: 'listing' | 'facilities'; section: 'experiences' | 'resources' | 'facilities'; category: string; partners: SpotlightPartner[] };

/** The sport a listing page's heading starts with, as the pages spell it ("Fútbol(Soccer)", "Baseball and Softball"…). */
const TITLE_SPORT = /^(Baseball (?:&|and) Softball|Basketball|Esports|Fútbol ?\(Soccer\)|Golf(?:ing)?|Pickleball)\s+(.+)$/;

/**
 * A listing page's heading as the hero shows it: the sport on one line and the category on the next ("Fútbol (Soccer)",
 * "Advancement & Workshops Nearby"), whatever the page data's own break; one line when no sport leads it.
 */
export const listingTitleLines = (title: string[]) => {
  const text = title.join(' ').replace(/\s+/g, ' ').trim();
  const m = text.match(TITLE_SPORT);
  return m ? [m[1].replace('Fútbol(', 'Fútbol (').replace(' and ', ' & '), m[2]] : [text];
};

/** The search field's placeholder of a directory: "Search Advancement & Workshops…", else "Search <fallback>…". */
export const searchPlaceholder = (widgetId: number | undefined, fallback?: string) => {
  const name = categoryName(widgetId) ?? fallback?.replace(/\s+nearby$/i, '').trim();
  return name ? `Search ${name}…` : 'Search camps, clinics, programs…';
};

/** The `type=` of a widget's requests: the API answers with listings of that type only. */
const typeParam = (widgetId: number) => (WIDGET_TYPES[widgetId] ? `&type=${WIDGET_TYPES[widgetId]}` : '');

type Listing = {
  id: string;
  provider?: Provider;
  /** The built-in card this listing replaces (listings imported from the site's own data). */
  sourceId?: string;
  title: string;
  subtitle: string;
  excerpt: string;
  bio: string;
  image: string;
  /** The popup photos, in order (up to 3). */
  bioImages: string[];
  tags: string[];
  priceMin?: number;
  priceMax?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  /** Spots per day (none: no limit) and what to bring (CLP Partner and Compete Like Pros listings). */
  capacity?: number;
  whatToBring?: string[];
  buttons: Cta[];
  socials: { network: string; href: string }[];
};

/**
 * The When filter's months. A dated listing is in a month when its days overlap it (the month's next one: from today in
 * the current month, next year's when already past); a month-only listing (no dates) by its month tag. As the listings
 * API works it out (days are US Eastern).
 */
const MONTH_TAGS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The days of a month's next occurrence, or null when the value is no month. */
function monthRange(value: string) {
  const m = MONTH_TAGS.indexOf(value);
  if (m < 0) return null;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const year = Number(today.slice(0, 4));
  const current = Number(today.slice(5, 7)) - 1;
  const y = m < current ? year + 1 : year;
  return { from: m === current ? today : iso(new Date(Date.UTC(y, m, 1))), to: iso(new Date(Date.UTC(y, m + 1, 0))) };
}

/**
 * The Available time filter, with a directory's Date filter: parts of the day, matched by a listing's start time (as the
 * listings API does: clp-api shared/listings.mjs TIME_SLOTS).
 */
const TIME_SLOTS: Record<string, [string, string][]> = {
  'time-morning': [['05:00', '12:00']],
  'time-afternoon': [['12:00', '17:00']],
  'time-evening': [['17:00', '21:00']],
  // Over midnight.
  'time-night': [
    ['21:00', '24:00'],
    ['00:00', '05:00'],
  ],
};
export const START_TIME_FILTER: DirectoryFilter = {
  key: 'starttime',
  label: 'Start Time',
  options: [
    { value: 'time-morning', label: 'Morning (5 AM – 12 PM)' },
    { value: 'time-afternoon', label: 'Afternoon (12 PM – 5 PM)' },
    { value: 'time-evening', label: 'Evening (5 PM – 9 PM)' },
    { value: 'time-night', label: 'Night (9 PM – 5 AM)' },
  ],
};

/** Groups & Private Lessons and Leagues & Social Clubs (the other experiences say "Start Time"); facilities all say "Available Time". */
const AVAILABLE_TIME_WIDGETS = [6, 37];

/** The time filter of a directory: titled "Available Time" for those, "Start Time" for the rest. */
export function startTimeFilterFor(widgetId: number | undefined): DirectoryFilter {
  const available = widgetId != null && (AVAILABLE_TIME_WIDGETS.includes(widgetId) || WIDGET_TYPES[widgetId] === 'facilities');
  return available ? { ...START_TIME_FILTER, label: 'Available Time' } : START_TIME_FILTER;
}

/** Whether a card has a filter value: one of its tags, a part of the day it starts in (Available time), or (a month) one its dates fall in. */
export function hasValue(item: { tags: string[]; startDate?: string; endDate?: string; startTime?: string }, value: string) {
  const slot = TIME_SLOTS[value];
  if (slot) return Boolean(item.startTime) && slot.some(([from, to]) => item.startTime! >= from && item.startTime! < to);
  const month = item.startDate ? monthRange(value) : null;
  if (!month) return item.tags.includes(value);
  return item.startDate! <= month.to && (item.endDate ?? item.startDate!) >= month.from;
}

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
  provider: l.provider,
  sourceId: l.sourceId,
  tags: l.tags,
  priceMin: l.priceMin,
  priceMax: l.priceMax,
  startDate: l.startDate,
  endDate: l.endDate,
  startTime: l.startTime,
  endTime: l.endTime,
  capacity: l.capacity,
  whatToBring: l.whatToBring,
  image: l.image,
  subtitle: l.subtitle,
  title: l.title,
  excerpt: l.excerpt,
  bio: l.bio,
  bioHtml: bioToHtml(l.bio),
  // Without popup photos of its own, the popup shows the card image.
  bioImages: l.bioImages.length ? l.bioImages : l.image ? [l.image] : undefined,
  buttons: l.buttons.map((b) => ({ ...b, newTab: /^https?:/.test(b.href) })),
  socials: l.socials,
});

/** The directories' Sport filter (each sport page presets it to its sport). */
export const SPORT_FILTER = 'extra-one';

/** A directory widget's listing type (the site menu it is under), or undefined for widgets without listings. */
export const listingTypeOf = (widgetId: number): ListingType | undefined => WIDGET_TYPES[widgetId];

/** Whether a directory widget loads its cards from the listings API (the page shows a loader until it answers). */
export const listingsEnabled = (widgetId: number | undefined): widgetId is number =>
  Boolean(API_URL) && widgetId != null && Object.hasOwn(WIDGET_TYPES, widgetId);

/** After this long the page stops waiting and shows its built-in cards. */
const TIMEOUT_MS = 4000;
/**
 * A directory page's first load waits longer (a cold API answers slowly, and its first answer brings every filter's
 * counts): giving up early would show the built-in cards instead of the page's real listings.
 */
export const FIRST_LOAD_TIMEOUT_MS = 15_000;

/** Filter groups as the API takes them: "a|b,c||d" (groups by "|", a group's values by ","). */
const encodeGroups = (groups: string[][]) => groups.map((g) => g.join(',')).join('|');

/** One GET of the listings API. Nothing is cached: every call asks the API (the browser too: no-store). */
function get<T>(path: string, timeoutMs = TIMEOUT_MS): Promise<T> {
  return fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) }).then((res) =>
    res.ok ? (res.json() as Promise<T>) : Promise.reject(new Error(`listings API ${res.status}`)),
  );
}

const filtersParam = (groups: string[][]) => `filters=${encodeURIComponent(encodeGroups(groups))}`;

/** The API's orders: newest first (the directory's "Recommended"), by price-range tags, or by next month from now. */
export type ListingsSort = 'recommended' | 'price-asc' | 'price-desc' | 'soonest';

/**
 * How a list is asked for besides its filter groups: `q` searches the title, subtitle and excerpt (every word must be
 * found), `loc` a place among the tags (a city or destination starting with it), `sort` orders it, `providers` keeps
 * the listings of those providers (any of them). The API ignores case and accents.
 */
export type ListingsOptions = { q?: string; loc?: string; sort?: ListingsSort; providers?: Provider[]; timeoutMs?: number };

/** The search, location and provider of a request (lists and counts alike). */
const searchParam = ({ q, loc, providers }: ListingsOptions = {}) =>
  (q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : '') +
  (loc?.trim() ? `&loc=${encodeURIComponent(loc.trim())}` : '') +
  (providers?.length ? `&provider=${providers.join(',')}` : '');

const listPath = (widgetId: number, groups: string[][], facets: number[], limit: number, cursor?: string, options: ListingsOptions = {}) =>
  `/listings?widget=${widgetId}${typeParam(widgetId)}&${filtersParam(groups)}${facets.length ? `&facets=${facets.join(',')}` : ''}&limit=${limit}` +
  searchParam(options) +
  (options.sort && options.sort !== 'recommended' ? `&sort=${options.sort}` : '') +
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
async function rest(widgetId: number, groups: string[][], first: ListingsResult, options?: ListingsOptions): Promise<ListingsResult> {
  let result = first;
  while (result.nextCursor) result = await moreListings(widgetId, groups, result, undefined, options);
  return result;
}

/**
 * The first page of a widget's published listings matching the filter groups (any value of each non-empty group),
 * filtered (and searched, see ListingsOptions) by the API in DynamoDB, newest first; with the total and the counts of
 * the `facets` groups. `limit` omitted: every page is loaded. Rejects when the API fails or is slow.
 */
export const queryListings = (widgetId: number, groups: string[][], facets: number[] = [], limit?: number, options?: ListingsOptions) =>
  get<ListingsResponse>(listPath(widgetId, groups, facets, limit ?? MAX_PAGE, undefined, options), options?.timeoutMs)
    .then(toResult)
    .then((r) => (limit === undefined ? rest(widgetId, groups, r, options) : r));

/**
 * How many published listings match the filter groups and search (the "Show N results" of a filter panel), counted by
 * the API.
 */
/** An option added in the admin to a directory's filter (e.g. a new Service), next to the page's own ones. */
export type AddedOption = { key: string; value: string; label: string };

/** The options added in the admin to a directory's filters. */
export const addedOptions = (widgetId: number) => get<{ options: AddedOption[] }>(`/filter-options?widget=${widgetId}`).then((r) => r.options);

export const countListings = (widgetId: number, groups: string[][], options?: ListingsOptions) =>
  get<{ total: number }>(`/listings?widget=${widgetId}${typeParam(widgetId)}&${filtersParam(groups)}${searchParam(options)}&count=1`).then(
    (r) => r.total,
  );

/**
 * One page of listings after `cursor` (the `nextCursor` of the page before it), with the same filters, search and sort
 * as the first page: `nextCursor` continues to the page after (null: it's the last one).
 */
export const listingsPage = (widgetId: number, groups: string[][], cursor: string, limit: number, options?: ListingsOptions) =>
  get<ListingsResponse>(listPath(widgetId, groups, [], limit, cursor, options)).then((data) => {
    const page = toResult(data);
    return { items: page.items, nextCursor: page.nextCursor };
  });

/** `loaded` with the next page appended (the same filters, search and sort; `limit` items, by default the first page's size). */
export async function moreListings(
  widgetId: number,
  groups: string[][],
  loaded: ListingsResult,
  limit = loaded.limit,
  options?: ListingsOptions,
): Promise<ListingsResult> {
  if (!loaded.nextCursor) return loaded;
  const page = toResult(await get<ListingsResponse>(listPath(widgetId, groups, [], limit, loaded.nextCursor, options)));
  // A listing can't repeat across pages, but one added meanwhile must not show twice either.
  const seen = new Set(loaded.items.map((i) => i.id));
  return { ...loaded, items: [...loaded.items, ...page.items.filter((i) => !seen.has(i.id))], nextCursor: page.nextCursor };
}

// --- Booking requests ("Book Now"; the bookings API, clp-api src/bookings.mjs) ---------------------------------------

/** Whether a listing is booked on CLP ("Book Now"): CLP's own and its partners' listings. Others link out. */
export const isBookable = (item: { provider?: Provider }) => item.provider === 'partner' || item.provider === 'clp';

/** A listing's age rule from its Age tags, as the bookings API reads it: adults only (18+ / 21+), kids only, or all. */
export type AgePolicy = { kind: 'adult'; minAge: number } | { kind: 'youth' } | { kind: 'all' };
export function agePolicy(tags: string[]): AgePolicy {
  const adult = tags.includes('adults-21') ? 21 : tags.includes('adults-18') ? 18 : null;
  const youth = tags.some((t) => ['toddlers-2-4', 'youth-5-12', 'teens-13-17'].includes(t));
  if (adult && !youth) return { kind: 'adult', minAge: adult };
  if (youth && !adult) return { kind: 'youth' };
  return { kind: 'all' };
}

export type BookingRequest = {
  widgetId: number;
  listingId: string;
  /** The day ("YYYY-MM-DD"). */
  date: string;
  adults: number;
  kids: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  waiver: boolean;
  guardian?: boolean;
  ageConfirmed?: boolean;
  /** Left empty by people (a field they don't see). */
  website?: string;
};
/** A booking as its guest sees it (the "Book Now" answer, and their booking page). */
export type BookingConfirmation = {
  id: string;
  listingTitle: string;
  listingSubtitle?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  adults: number;
  kids: number;
  people: number;
  pricePer?: number;
  total?: number;
  name: string;
  email: string;
  status: 'requested' | 'confirmed' | 'cancelled';
  cancelledBy?: 'guest' | 'host';
  /** The last day it can be cancelled for free ("YYYY-MM-DD"), and whether the guest can cancel it now. */
  cancelBy: string;
  canCancel: boolean;
  /** Where to go (confirmed bookings): the exact address and check-in instructions, private to booked guests. */
  address?: string;
  checkInInstructions?: string;
};

/** A new booking (booked at once) and the token of the guest's own page (/booking/?id=…&token=…). */
export type NewBooking = { booking: BookingConfirmation; token: string };

/** The free-cancellation deadline's time on its last day (as the bookings API counts days, in US Eastern time). */
export const CANCEL_TIME = '11:59 PM ET';

/** The guest's own booking page (see or cancel it). */
export const bookingPageHref = (id: string, token: string) => `/booking/?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;

/** Google Maps directions to an address. */
export const directionsHref = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Books a day; rejects with the API's message (e.g. "Pick one of the listed dates."). */
export async function requestBooking(request: BookingRequest): Promise<NewBooking> {
  if (!API_URL) throw new Error('Booking isn’t available right now.');
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || (res.status === 429 ? 'Too many requests. Please try again in a minute.' : 'Could not send your request. Please try again.'));
  return { booking: body.booking as BookingConfirmation, token: body.token as string };
}

// --- Listing claims ("Claim this listing" on Community listings; the claims API, clp-api src/claims.mjs) -------------

export type ClaimRequest = {
  widgetId: number;
  listingId: string;
  name: string;
  email: string;
  organization: string;
  /** One of CLAIM_ROLES. */
  role: string;
  phone?: string;
  website?: string;
  message?: string;
  authorized: boolean;
};
export type ClaimConfirmation = { id: string; status: string; listingTitle: string; email: string; createdAt: string };

/**
 * Sends a claim: the API keeps it and e-mails the listing's owner and CLP. Claiming the same listing again within a
 * day answers with the first claim. Rejects with the API's message (e.g. "Enter a valid work email.").
 */
export async function requestClaim(request: ClaimRequest): Promise<ClaimConfirmation> {
  if (!API_URL) throw new Error('Claiming isn’t available right now.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/claims`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('Could not send your claim. Check your connection and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || (res.status === 429 ? 'Too many claims. Please try again in an hour.' : 'Could not send your claim. Please try again.'));
  return body.claim as ClaimConfirmation;
}

/** Spots left each day (null capacity: no limit). Never throws: without an answer, no limit is shown. */
export async function fetchAvailability(widgetId: number, listingId: string, dates: string[]): Promise<{ capacity: number | null; left: Record<string, number> }> {
  if (!API_URL || dates.length === 0) return { capacity: null, left: {} };
  try {
    const qs = new URLSearchParams({ widget: String(widgetId), listing: listingId, dates: dates.slice(0, 62).join(',') });
    const res = await fetch(`${API_URL}/bookings/availability?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { capacity: null, left: {} };
    return await res.json();
  } catch {
    return { capacity: null, left: {} };
  }
}

/** The guest's booking, by the link in their e-mails; null when the link isn't valid. */
export async function fetchGuestBooking(id: string, token: string): Promise<BookingConfirmation | null> {
  if (!API_URL) throw new Error('Bookings aren’t available right now.');
  const res = await fetch(`${API_URL}/bookings/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Could not load your booking. Please try again.');
  return body.booking as BookingConfirmation;
}

/** The guest cancels their booking (free up to 2 days before); rejects with the API's message (e.g. too late). */
export async function cancelGuestBooking(id: string, token: string): Promise<BookingConfirmation> {
  if (!API_URL) throw new Error('Bookings aren’t available right now.');
  const res = await fetch(`${API_URL}/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Could not cancel your booking. Please try again.');
  return body.booking as BookingConfirmation;
}
