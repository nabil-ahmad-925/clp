import config from './data/wholesaleConfig.json';
import { call, read } from './partnerPages';
import { partnerCall } from './partnerSession';
import { SHAPES, frontSpotOf, type LogoSpot, type WsAsset } from './wsDrawing';

export { GICON, LOCN, METALS, SHAPES, WS_FONTS, isLightColor, type WsAsset, type WsShape } from './wsDrawing';

/**
 * Wholesale (/shop/?view=bulk): the catalog (from the API, see loadWholesale), its mockup drawings and the design
 * studio's library. Prices are "from" prices per piece with one print spot. The sample brand assets stay until brand
 * assets come from the partner's brand kit.
 */

/** Each print spot's name. */
export const APPAREL = ['tee', 'hood', 'polo', 'jersey', 'jacket', 'pinnie'];
export const SIZED = [...APPAREL, 'short'];
export const SIZES = ['YS', 'YM', 'YL', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export type WsSource = 'brand' | 'direct' | 'dist';
export const SRC: Record<WsSource, string> = Object.fromEntries(config.sources.map((s) => [s.id, s.label])) as Record<WsSource, string>;
/** A catalog product as the site gets it (clp-api GET /wholesale/catalog; CLP manages them in Manufacturing › Catalog & suppliers). */
export type WsItem = {
  id: string;
  name: string;
  cat: string;
  src: WsSource;
  brand: string;
  shape: string;
  deco: string[];
  /** The item colours to pick from (#RRGGBB; none: the studio's colours). */
  colors: string[];
  /** Its sizes (none: one size). */
  sizes: string[];
  /** in: in stock, mto: made to order. */
  stock: 'in' | 'mto';
  min: number;
  lead: string;
  /** From this price per piece (one print spot). */
  price: number;
  /** Pieces in stock (0 when made to order). */
  avail: number;
  desc: string;
  photos: string[];
  /** Where the logo goes on its first photo (none: the drawing's print spot). */
  logoSpot?: LogoSpot;
  /** Its back photo, and where the logo goes on it (none: the back's print spot). */
  backPhoto?: string;
  backSpot?: LogoSpot;
  /** Back-ordered at the supplier: back about this date (YYYY-MM-DD). */
  back?: string;
  /** How partners can sell it to their members (none: wholesale only), and its suggested and lowest retail price. */
  programs: WsProgram[];
  retail?: number;
  retailMin?: number;
};
export type WsProgram = 'pod' | 'pre';
/** The programs partners sell with: print on demand (25% of each sale) and pre-order (50%). */
export const PROGRAMS = config.programs as { id: WsProgram; label: string; share: number; blurb: string; note: string }[];
export const programOf = (id: WsProgram) => PROGRAMS.find((p) => p.id === id)!;

/**
 * "Sell to members": the item with the partner's artwork as a print-on-demand product in their store (CLP checks the
 * artwork, then they publish it in My store). `mockup`: the item's mockup, uploaded.
 */
export const sellInMyStore = (input: { itemId: string; program: WsProgram; price: number; mockup: string; color: string; logo: string; spots: string[] }) =>
  partnerCall<{ item: { id: string; approval: string; status: string } }>('/my/partner/store/wholesale', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.item);
/** The catalog: its items, the categories and brands they use (the filters), and whether back-ordered items take "Notify me". */
export type WsCatalog = { items: WsItem[]; categories: string[]; brands: string[]; notify: boolean };
/** Its main print spot: the one its photo shows (CLP's logo spot), else the drawing's first. */
export const firstLoc = (it: WsItem) => (it.photos[0] ? frontSpotOf(it).loc : Object.keys(SHAPES[it.shape]?.P ?? SHAPES.tee.P)[0]);

let catalog: Promise<WsCatalog> | null = null;
/** The live catalog (read once a visit; a failed read is tried again next time). */
export const loadWholesale = () =>
  (catalog ??= read<WsCatalog>('/wholesale/catalog')
    // Fields every item has on the site (an item without programs is wholesale only).
    .then((c) => ({ ...c, items: c.items.map((i) => ({ ...i, colors: i.colors ?? [], sizes: i.sizes ?? [], photos: i.photos ?? [], programs: i.programs ?? [] })) }))
    .catch((err) => {
      catalog = null;
      throw err;
    }));
/** A signed-in account's favorite folders and saved items (a member's or a partner's; a guest's stay in their browser). */
export type WsFavorites = { folders: { id: string; name: string }[]; favs: Record<string, string[]> };
export const getMyFavorites = () => partnerCall<WsFavorites>('/my/wholesale/favorites');
export const saveMyFavorites = (f: WsFavorites) => partnerCall<WsFavorites>('/my/wholesale/favorites', { method: 'PUT', body: JSON.stringify(f) });

/** "Notify me" when a back-ordered item is back. */
export const notifyWhenBack = (id: string, email: string) => call<{ waiting: true }>(`/wholesale/products/${encodeURIComponent(id)}/notify`, { method: 'POST', body: JSON.stringify({ email }) });

export const WS_DECOS = config.decorations;
/** The three ways in (Shop by brand, Made for you, In stock fast): [source, kicker, line]. */
export const WS_SOURCES: [WsSource, string, string][] = config.sources.map((s) => [s.id as WsSource, s.kicker, s.blurb]);

export const WS_ASSETS: WsAsset[] = [
  { id: 'crest', name: 'AFC crest', kind: 'badge', mono: 'AFC', bg: '#7A1F2B', status: 'ok' },
  { id: 'word', name: 'Wordmark', kind: 'word', word: 'Alana’s FC', status: 'ok' },
  { id: 'ten', name: '10-year badge', kind: 'badge', mono: '10', bg: '#B8913F', status: 'new' },
  { id: 'mono', name: 'Crest · one color', kind: 'badge', mono: 'AFC', bg: '#111111', status: 'ok' },
  { id: 'pd', name: 'Pro Day 2026', kind: 'badge', mono: 'PD', bg: '#0B2A5B', status: 'ok' },
  { id: 'spon', name: 'Sponsor · [Brand]', kind: 'word', word: '[Brand]', status: 'ok' },
  { id: 'init', name: 'AFC monogram', kind: 'badge', mono: 'A', bg: '#DCBD7D', status: 'ok' },
];
export const SAMPLE_ASSET_IDS = WS_ASSETS.map((a) => a.id);
export const ASSET_STATUS: Record<WsAsset['status'], [string, string, string]> = {
  ok: ['✓ Approved', '#1E7A45', '#E7F3EC'],
  review: ['In review', '#8A6F33', '#FBF3E2'],
  new: ['Needs approval', '#B03A2E', '#FBEAE8'],
};
/** The sample brand kit's owner (the board's partner). */
export const WS_KIT_OWNER = 'Alana’s Fútbol Club';

export const WS_COLORS: [string, string][] = [
  ['#7A1F2B', 'Maroon'],
  ['#111111', 'Black'],
  ['#F4F4F2', 'White'],
  ['#DCBD7D', 'Gold'],
  ['#8C8C8C', 'Grey'],
  ['#1B3A6B', 'Navy'],
];
/** An item's colours to pick from, named: its own (from the catalog), else the studio's. */
export const colorsOf = (i: WsItem): [string, string][] =>
  i.colors.length ? i.colors.map((c) => [c, WS_COLORS.find(([x]) => x.toUpperCase() === c.toUpperCase())?.[1] ?? c] as [string, string]) : WS_COLORS;
/** The colour an item shows in: the one in use across Wholesale when the item comes in it, else its first. */
export const colorFor = (i: WsItem, inUse: string) => {
  const list = colorsOf(i);
  return list.some(([c]) => c.toUpperCase() === inUse.toUpperCase()) ? inUse : list[0][0];
};
export const TEXT_COLORS: [string, string][] = [
  ['#FFFFFF', 'White'],
  ['#111111', 'Black'],
  ['#DCBD7D', 'Gold'],
  ['#7A1F2B', 'Maroon'],
  ['#1B3A6B', 'Navy'],
];
export const DEFAULT_ROSTER = 'RIVERA, 10\nCHEN, 7\nOKAFOR, 4\nMURPHY, 9\nSILVA, 11\nPATEL, 3';

export const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** The card's tag: the brand, CLP direct, or a distributor partner. */
export const tagOf = (i: WsItem): [string, boolean] => (i.src === 'brand' ? [i.brand.toUpperCase(), false] : i.src === 'direct' ? ['CLP DIRECT', true] : ['DISTRIBUTOR PARTNER', false]);
/** A back-in-stock date as the cards say it ("Nov 2"). */
export const backDay = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : iso);
/** Stock, as the card says it, and its dot's colour. */
export const stockOf = (i: WsItem): [string, string] =>
  i.back ? [`Back-ordered · back about ${backDay(i.back)}`, '#B03A2E'] : i.stock === 'in' ? [`In stock · ships in ${i.lead}`, '#1E7A45'] : [`Made to order · ${i.lead}`, '#C9A44C'];
/** Who makes and quotes it. */
export const handlerOf = (i: WsItem) => (i.src === 'direct' ? 'a CLP maker partner' : 'the CLP team');
/** Quantity breaks: the minimum, then about 5× and 10× (48 and 144 for apparel-size minimums), 8% and 15% off. */
export const breaksOf = (i: WsItem): [number, number][] => {
  const t2 = i.min < 12 ? i.min * 5 : 48;
  const t3 = i.min < 12 ? i.min * 10 : 144;
  return [
    [i.min, 1],
    [t2, 0.92],
    [t3, 0.85],
  ];
};
export const tierOf = (i: WsItem, total: number) => {
  const [, b2, b3] = breaksOf(i);
  return total >= b3[0] ? b3[1] : total >= b2[0] ? b2[1] : 1;
};
/** The order's amount: the price at its quantity break, each extra print spot about 12% more. */
export const amountOf = (i: WsItem, total: number, spots: number) => i.price * tierOf(i, total) * (1 + Math.max(0, spots - 1) * 0.12) * total;
