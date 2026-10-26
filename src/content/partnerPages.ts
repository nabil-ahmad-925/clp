import config from './data/partnerConfig.json';
import type { Listing } from './listings';

/**
 * CLP Partner pages (clp-api partners-read/write): a partner's page at /partner/?p=<slug>, the directory of live
 * partners, the /partnerships/ list, the "Work with us" form, subscribers and verified reviews. Fetched in the browser
 * (the site is a static export; pages go live from the admin).
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

export const PARTNER_TYPES = config.types;
export const partnerType = (id?: string) => PARTNER_TYPES.find((t) => t.id === id) ?? PARTNER_TYPES[0];
export const PARTNER_SPORTS = config.sports;
export const COLLAB_TYPES = config.collabTypes;
export const collabLabel = (id: string) => COLLAB_TYPES.find((t) => t.id === id)?.label ?? 'Other';
export const PAGE_SECTIONS = config.sections;
/** The partner categories: each has its listing of partners (/portfolio/<category>-partners/). */
export const PARTNER_CATEGORIES = config.partnerCategories;
export const partnerCategoryHref = (id?: string) => PARTNER_CATEGORIES.find((c) => c.id === id)?.href;

/** A partner as a card (directory, Partnerships page, spotlight). */
export type PartnerCardData = {
  slug: string;
  type: string;
  name: string;
  short: string;
  mono: string;
  color: string;
  category: string;
  /** Its partner categories (PARTNER_CATEGORIES): the partner listings and listing pages it shows on. */
  partnerCategories: string[];
  area: string;
  sports: string[];
  logo: string;
  hero: string;
  about: string;
  rating: number | null;
  reviewCount: number;
  /** Where CLP put it on its categories' listings ({ <category>: 1… }, position 1 first); others follow. */
  positions?: Record<string, number>;
  /** The categories CLP features it on: first on those listings, marked "Featured". */
  featured?: string[];
  /** CLP's Feature star: the shop's first row and the home page's featured spots. */
  homeFeatured?: boolean;
  /** How many experiences it hosts (its published listings): the cards' "N Experiences". */
  experiences?: number;
};

/** Someone who runs the partner's sessions; CLP sets their checks (SafeSport, background check, CPR). */
export type PartnerTeamMember = { name: string; role: string; photo: string; bio?: string; instagram?: string; runs?: string[]; checks?: ('safesport' | 'background' | 'cpr')[] };
export const TEAM_CHECK_LABELS = { safesport: 'SafeSport trained', background: 'Background check', cpr: 'CPR & first aid' } as const;
/** A video on the Content tab, and where it plays from. */
/**
 * A video on the page's Content tab: its link, title, site and category (the albums' types: Events & Games, Behind the
 * Scenes, Highlights, Partnerships); `from`: the partner who posted it, on a page it was shared to.
 */
export type PartnerVideo = {
  id?: string;
  url: string;
  title: string;
  source: 'youtube' | 'instagram' | 'tiktok' | 'vimeo' | '';
  category?: string;
  from?: { name: string; slug: string };
  /** Its site's picture (TikTok, Vimeo, an imported YouTube video's). */
  thumb?: string;
};

export type PartnerPageData = PartnerCardData & {
  highlights: string[];
  stats: { value: string; label: string }[];
  photos: { src: string; caption: string }[];
  team: PartnerTeamMember[];
  videos?: PartnerVideo[];
  /** How much of the partner's colour the page uses ("off": CLP's black and gold), and their second colour. */
  colorMode?: 'little' | 'off';
  color2?: string;
  faq: { q: string; a: string }[];
  /** Press about them; one that is a CLP article carries its reading time (minutes). */
  press: { title: string; source: string; date: string; href: string; image: string; readingTime?: number }[];
  store: { title: string; sub: string };
  socials: { network: string; href: string }[];
  website: string;
  sections: { id: string; on: boolean }[];
  /** Who follows the page (its e-mail list). */
  followers: number;
  /** Opened with a preview link before the page is live. */
  preview: boolean;
  /** Its store on the shop: private (behind its password, until a date) or not, pick-up, and CLP's own (exclusive). */
  shop?: { private: boolean; until: string; pickup?: boolean; pickupNote?: string; exclusive?: boolean };
};

export type PartnerCollab = { id: string; title: string; brand: string; type: string; dates: string; description: string; image: string; link: string; live: boolean; createdAt: string };
/** A store product of the partner's (published and approved by CLP). */
export type PartnerProduct = {
  id: string;
  title: string;
  category: string;
  description: string;
  /** Its option groups ("Sizes", "Colors"), each with its own values; the shopper picks one in each (none: one size). */
  optionGroups: { kind: string; values: string[] }[];
  price: number;
  collection: string;
  /** The first photo (the card), and all of them. */
  image: string;
  images: string[];
  /** When the partner added it to their store (the "Newest" sort). */
  addedAt?: string;
};
/** A verified review: from a checked-in booking, or (`orderId`) a shop order. */
export type PartnerReviewData = { id: string; rating: number; text: string; name: string; badge: string; session: string; date: string; reply?: { text: string; at: string }; createdAt: string; orderId?: string };
export type PartnerArticle = { slug: string; path: string; title: string; excerpt: string; image: string; publishedAt: string; readingTime: number; categories: string[] };

export type PartnerPageResponse = {
  page: PartnerPageData;
  collabs: PartnerCollab[];
  products: PartnerProduct[];
  reviews: PartnerReviewData[];
  experiences: (Listing & { widgetId: string; listingType?: string })[];
  articles: PartnerArticle[];
};

export class PartnerApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** The API's code for it (NOT_CONFIRMED, EMAIL_EXISTS…), when it gave one. */
    public code?: string,
  ) {
    super(message);
  }
}

export async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new PartnerApiError(0, 'Partner pages aren’t available right now.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      ...init,
      headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...(init?.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new PartnerApiError(0, 'Could not reach CLP. Check your connection and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new PartnerApiError(res.status, body.error || 'Something went wrong. Please try again.', body.code);
  return body as T;
}

/** Waits before retrying a read the API turned away as busy (503/429: its Lambdas are at their concurrency limit). */
const BUSY_RETRIES_MS = [400, 1000, 2000];

/** A read, retried while the API is busy. */
export async function read<T>(path: string): Promise<T> {
  for (const wait of BUSY_RETRIES_MS) {
    try {
      return await call<T>(path);
    } catch (err) {
      if (!(err instanceof PartnerApiError) || (err.status !== 503 && err.status !== 429)) throw err;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return call<T>(path);
}

export const partnersEnabled = Boolean(API_URL);

/** A partner page with its tabs' content (a preview token opens one that isn't live yet). */
export const fetchPartnerPage = (slug: string, preview?: string | null) =>
  read<PartnerPageResponse>(`/partners/${encodeURIComponent(slug)}${preview ? `?preview=${encodeURIComponent(preview)}` : ''}`);

/** Live partners as cards (the directory), A to Z. */
export const fetchPartners = (params: { type?: string; sport?: string; q?: string } = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return read<{ items: PartnerCardData[] }>(`/partners${qs ? `?${qs}` : ''}`).then((r) => r.items);
};

/** The live partners, fetched once per visit and shared by every place that lists them. */
let livePartners: Promise<PartnerCardData[]> | null = null;
export const loadLivePartners = () => (livePartners ??= fetchPartners().catch(() => ((livePartners = null), [])));

export type LeadInput = { name: string; organization: string; email: string; onClp: boolean; collabType: string; idea: string; website?: string };
/** A "Work with us" idea, e-mailed to the partner and CLP. */
export const sendPartnerLead = (slug: string, lead: LeadInput) => call<{ sent: true }>(`/partners/${encodeURIComponent(slug)}/leads`, { method: 'POST', body: JSON.stringify(lead) });
/** Follows a page: its follower count after (the same e-mail counts once). */
export const subscribeToPartner = (slug: string, email: string) => call<{ subscribed: true; followers: number }>(`/partners/${encodeURIComponent(slug)}/subscribe`, { method: 'POST', body: JSON.stringify({ email }) });

export type ReviewEligibility = { canReview: boolean; reason?: 'not-partner' | 'reviewed' | 'not-checked-in'; review?: PartnerReviewData; partner?: { name: string; slug: string; mono: string; live: boolean } };
/** Whether the guest of a booking (their link's token) may review it. */
export const reviewEligibility = (bookingId: string, token: string) => read<ReviewEligibility>(`/reviews/${encodeURIComponent(bookingId)}?token=${encodeURIComponent(token)}`);
export const sendReview = (bookingId: string, token: string, rating: number, text: string) =>
  call<{ review: PartnerReviewData }>('/reviews', { method: 'POST', body: JSON.stringify({ bookingId, token, rating, text }) });

export type PartnerApplicationInput = {
  name: string;
  email: string;
  phone?: string;
  partnerType: string;
  organization: string;
  area: string;
  sports: string[];
  website?: string;
  message?: string;
};
/**
 * Applies to become a CLP Partner (clp-api partner-applications: the admin's sign-up page sends the same). No account is
 * made yet: once CLP approves it, the partner gets an e-mail with a temporary password and the sign-in link. `repeat`:
 * the address already has an application waiting (that one comes back). An address with an account gets 409.
 */
export const applyAsPartner = (input: PartnerApplicationInput) =>
  call<{ application: { id: string; email: string; status: string }; repeat?: boolean }>('/partner-applications', { method: 'POST', body: JSON.stringify(input) });

/** The admin, where approved partners sign in and manage their page. */
export const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://d2v5g3qu3uuuvq.cloudfront.net').replace(/\/$/, '');
export const partnerSignInHref = `${ADMIN_URL}/login/`;

/** The page's address on the site. */
export const partnerHref = (slug: string) => `/partner/?p=${encodeURIComponent(slug)}`;
