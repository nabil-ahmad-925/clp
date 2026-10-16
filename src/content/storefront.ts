import { PARTNER_SPORTS, PARTNER_TYPES, call, read, type PartnerCardData, type PartnerProduct } from './partnerPages';

/**
 * The shop (/shop/): every live partner's store and products (clp-api partners-read GET /partners?products=1),
 * fetched once per visit. A store is a live partner whose page shows its Shop and has products for sale. A private
 * store (a password-protected drop) lists without its products: they open with its password or invite link (see
 * unlockStore). CLP's own store is the shop's CLP Exclusives.
 */
export type ShopProduct = PartnerProduct & { slug: string; sport?: string };
export type StoreShop = {
  private: boolean;
  until: string;
  pickup: boolean;
  pickupNote: string;
  fundraiser: { goal: number; endsAt: string; raised: number; supporters: number } | null;
  exclusive: boolean;
};
export type ShopStore = PartnerCardData & { shop: StoreShop; productCount: number; products: ShopProduct[] };
export type ShopData = { stores: ShopStore[]; products: ShopProduct[] };

const NO_SHOP: StoreShop = { private: false, until: '', pickup: false, pickupNote: '', fundraiser: null, exclusive: false };

let shop: Promise<ShopData> | null = null;
export const loadShop = () =>
  (shop ??= read<{ items: (PartnerCardData & { shop?: StoreShop; productCount?: number })[]; products?: ShopProduct[] }>('/partners?products=1')
    .then(({ items, products = [] }) => ({
      stores: items
        .filter((p) => p.shop)
        .map((p) => ({ ...p, shop: p.shop ?? NO_SHOP, productCount: p.productCount ?? 0, products: products.filter((x) => x.slug === p.slug) }))
        .filter((s) => s.productCount > 0),
      products,
    }))
    .catch((err) => {
      shop = null;
      throw err;
    }));

/** Partner stores (not CLP's own) and CLP's exclusives. */
export const partnerStores = (stores: ShopStore[]) => stores.filter((s) => !s.shop.exclusive);
export const exclusiveStores = (stores: ShopStore[]) => stores.filter((s) => s.shop.exclusive);
export const isExclusive = (p: ShopProduct, stores: ShopStore[]) => Boolean(stores.find((s) => s.slug === p.slug)?.shop.exclusive);

/** How long a product is "NEW" after it's added. */
const NEW_DAYS = 30;
export const isNewProduct = (p: ShopProduct) => Boolean(p.addedAt) && Date.now() - Date.parse(p.addedAt!) < NEW_DAYS * 86_400_000;

/**
 * The shop's store groups (the design's chips and menu columns), each gathering partner types: athletes, clubs and
 * teams (with coaches and trainers), schools, organizations (with brands, agencies and nutritionists) and creators.
 */
export const SHOP_GROUPS = [
  { id: 'athletes', label: 'Athletes', types: ['athlete'] },
  { id: 'clubs', label: 'Clubs & Teams', types: ['club', 'coach', 'sc'] },
  { id: 'schools', label: 'Schools', types: ['school'] },
  { id: 'orgs', label: 'Organizations', types: ['org', 'brand', 'agency', 'agent', 'nutrition'] },
  { id: 'creators', label: 'Creators', types: ['creator', 'writer', 'analyst'] },
] as const;
export type ShopGroup = (typeof SHOP_GROUPS)[number];
export const groupOf = (type: string) => SHOP_GROUPS.find((g) => (g.types as readonly string[]).includes(type)) ?? SHOP_GROUPS[3];
export const groupById = (id: string) => SHOP_GROUPS.find((g) => g.id === id);
/** "Clubs" for a tile's line (the design drops " & Teams"). */
export const groupShort = (g: ShopGroup) => g.label.replace(' & Teams', '');
/** The stores of a group (partner stores only, never CLP's own). */
/** A group's stores (every store for ''), CLP's featured ones (its Feature star) first. */
export const storesIn = (stores: ShopStore[], group: string) =>
  partnerStores(stores)
    .filter((s) => !group || groupOf(s.type).id === group)
    .sort((a, b) => Number(Boolean(b.homeFeatured)) - Number(Boolean(a.homeFeatured)));
/** The partner type's own label, kept for search. */
export const typeLabel = (type: string) => PARTNER_TYPES.find((t) => t.id === type)?.label ?? '';
export const sportLabel = (id: string) => PARTNER_SPORTS.find((s) => s.id === id)?.label ?? id;
/** A sport's short mark on the exclusives' sport tiles. */
const SPORT_MARKS: Record<string, string> = { 'baseball-softball': 'BSB', basketball: 'BKB', esports: 'ESP', 'futbol-soccer': 'SOC', golfing: 'GLF', pickleball: 'PKL' };
export const sportMark = (id: string) => SPORT_MARKS[id] ?? id.slice(0, 3).toUpperCase();

/** A colour name or code the browser can paint ("Navy", "Forest Green", "#7A1F2B"), as CSS writes it. */
export const paint = (c: string) => c.replace(/\s+/g, '');
export const canPaint = (c: string) => typeof CSS !== 'undefined' && CSS.supports('color', paint(c));

/** A product's colour swatches (in the browser): its Colors values that can be painted, four at most. */
export const swatches = (p: PartnerProduct) => (p.optionGroups.find((g) => g.kind === 'Colors')?.values ?? []).filter(canPaint).slice(0, 4);

/** "Mar 3" from "2026-03-03". */
export const shortDate = (day: string) => (day ? new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');

// --- Private stores ---------------------------------------------------------------------------------------------

const KEYS = 'clp-store-keys';
const readKeys = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(KEYS) ?? '{}') ?? {};
  } catch {
    return {};
  }
};
/** The invite key this browser holds for a private store ('' when it hasn't unlocked it). */
export const storeKey = (slug: string) => readKeys()[slug] ?? '';
const keepKey = (slug: string, key: string) => {
  try {
    localStorage.setItem(KEYS, JSON.stringify({ ...readKeys(), [slug]: key }));
  } catch {
    // Storage blocked: unlocked for this page only.
  }
};
export const forgetKey = (slug: string) => {
  try {
    const keys = readKeys();
    delete keys[slug];
    localStorage.setItem(KEYS, JSON.stringify(keys));
  } catch {
    // Nothing kept.
  }
};

/** A private store's products, for its password or invite key (kept in this browser to stay unlocked). */
export async function unlockStore(slug: string, secret: { password?: string; key?: string }) {
  const r = await call<{ products: ShopProduct[]; key: string }>(`/partners/${encodeURIComponent(slug)}/unlock`, { method: 'POST', body: JSON.stringify(secret) });
  keepKey(slug, r.key);
  return r.products;
}

/** The shop's addresses: its home, a view (?view=partners | new | search | exclusives | bulk | studio | checkout), a store, a product. */
export const shopHref = (params: Record<string, string | undefined> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return `/shop/${qs ? `?${qs}` : ''}`;
};
export const storeHref = (slug: string) => shopHref({ store: slug });
export const productHref = (slug: string, id: string) => shopHref({ store: slug, product: id });
