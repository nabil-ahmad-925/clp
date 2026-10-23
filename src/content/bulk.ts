import catalog from './data/bulkCatalog.json';
import { cartId } from './cart';
import { call, read } from './partnerPages';
import { partnerCall } from './partnerSession';

/**
 * Bulk & Operations (the shop's /shop/?view=bulk): CLP's catalog of team kits, staff gear, event supplies, inflatables,
 * awards and promo, made to order and quoted direct from manufacturing; and the design studio's library (templates,
 * patterns, fonts, colours). Guests request quotes (kept with this browser's cart id); signed-in partners design in
 * the studio, save designs, request quotes or order (clp-api orders Lambda /my/designs).
 */
export type Shape = 'tee' | 'jacket' | 'sock' | 'bib' | 'tent' | 'flag' | 'arch' | 'medal' | 'bottle' | 'tote' | 'cap' | 'spark';
export type BulkStyle = { name: string; note: string; min: number };
export type BulkItem = {
  id: string;
  category: string;
  shape: Shape;
  name: string;
  description: string;
  material: string;
  decoration: string[];
  sizes: string;
  min: number;
  unit: string;
  lead: string;
  badge: string;
  stock: boolean;
  styles: BulkStyle[];
  colors?: string[];
};
export type BulkCategory = { id: string; icon: string; label: string; short: string };

export const BULK_CATEGORIES = catalog.categories as BulkCategory[];
export const BULK_ITEMS = catalog.items as BulkItem[];
export const CUSTOM_ITEM = catalog.custom as BulkItem;
export const DECORATIONS = catalog.decorations;
export const PRIORITIES = catalog.priorities;
export const VIEWS = catalog.views as unknown as Record<Shape, [string, string][]>;
export const LOCATIONS = catalog.locations as unknown as Record<Shape, [string, string][]>;
export const ADDONS = catalog.addons as unknown as Partial<Record<Shape, [string, string, string][]>>;
export const TEMPLATES = catalog.templates as unknown as { label: string; base: string; accent: string; pattern: string; shapes: 'all' | Shape[] }[];
export const PATTERNS = catalog.patterns;
export const PLACES = catalog.places;
export const FONTS = catalog.fonts;
export const PALETTE = catalog.palette;
export const SPECIALTY = catalog.specialty as unknown as [string, string][];
export const PMS = catalog.pms as Record<string, string>;
export const COLOR_NAMES = catalog.colorNames as Record<string, string>;

export const bulkItem = (id: string) => (id === 'custom' ? CUSTOM_ITEM : BULK_ITEMS.find((it) => it.id === id));
export const categoryOf = (id: string) => BULK_CATEGORIES.find((c) => c.id === id);
export const isApparel = (shape: Shape) => shape === 'tee' || shape === 'jacket';

/** The longest lead time in weeks ("3–4 weeks" -> 4). */
export const leadWeeks = (lead: string) => Math.max(0, ...(lead.match(/[0-9]+/g) ?? ['0']).map(Number));

/** The decoration rule the studio shows for an item. */
export function decorationRule(item: BulkItem) {
  const d = item.decoration.join(' ').toLowerCase();
  if (d.includes('knit')) return 'Knit-in: up to 6 yarn colors · bold shapes knit best';
  if (d.includes('sublimation')) return 'Sublimation: unlimited colors, edge to edge';
  if (d.includes('embroider')) return 'Embroidery: up to 12 thread colors · no tiny text';
  if (d.includes('screen')) return 'Screen print: priced per ink color';
  if (d.includes('die-cast')) return 'Die-cast: raised metal finish · ribbon full color';
  return 'Full-color print: photo quality';
}

/** How wide (inches) a logo prints on an item at its placement, for the artwork's DPI check. */
export function printInches(shape: Shape, place: string) {
  if (isApparel(shape)) return ({ chest: 4, center: 10, full: 12 } as Record<string, number>)[place] ?? 10;
  return ({ sock: 3, bib: 8, cap: 4, bottle: 3, tote: 10, medal: 2, tent: 40, flag: 24, arch: 60 } as Record<string, number>)[shape] ?? 10;
}

// --- Requests ----------------------------------------------------------------------------------------------------

export type BulkKind = 'saved' | 'quote' | 'order';
export type StudioDesign = {
  base: string;
  accent: string;
  pattern: string;
  trim: boolean;
  logoOn: boolean;
  logo: string;
  place: string;
  logoScale: number;
  dx: number;
  dy: number;
  text: string;
  font: string;
  textColor: string;
  textPlace: string;
  textScale: number;
  playerName: string;
  playerNumber: string;
  numberColor: string;
  numberFont: string;
  locations: string[];
  style: number;
};
export type BulkRequest = {
  id: string;
  itemId: string;
  itemName: string;
  kind: BulkKind;
  styles: { name: string; qty: number }[];
  qty: number;
  mode: 'logo' | 'design';
  brief: string;
  priorities: string[];
  addons: string[];
  design: StudioDesign | null;
  mockup: string;
  status: string;
  createdAt: string;
  contact?: { name: string; organization: string; email: string; inHands: string; message: string; logoLink: string; deliverTo?: string } | null;
  /** Its reference (R-1A2B3C), as CLP's e-mails give it. */
  ref?: string;
  /** CLP's quote: per piece, total, when it's ready, how long the quote holds. */
  quote?: { unitPrice: number; total: number; qty: number; lead: string; validUntil: string; sentAt: string };
  /** CLP's artwork check: sent back with a note, or approved; "resubmitted" once they sent a new file. */
  art?: { state: 'approved' | 'changes' | 'resubmitted'; note: string; at: string; reply?: string };
  /** What they said about the quote: asked for changes, or declined it. */
  reply?: { kind: 'changes' | 'declined'; note: string; at: string };
  approvedAt?: string;
  shipping?: { boxes: { carrier: string; number: string }[]; shippedAt: string };
};
/** What a requester does with their quote request or order (My quote requests). */
export type RequestAction = 'approve-quote' | 'ask-changes' | 'decline' | 'new-artwork';
export type RequestActionInput = { note?: string; logo?: string; link?: string };
export type BulkInput = Omit<BulkRequest, 'id' | 'itemName' | 'status' | 'createdAt' | 'design' | 'mockup' | 'brief' | 'addons' | 'mode' | 'contact'> & {
  mode?: 'logo' | 'design';
  brief?: string;
  addons?: string[];
  design?: StudioDesign | null;
  mockup?: string;
  contact?: BulkRequest['contact'];
};

/** A guest's quote requests (this browser's) and sending one. */
export const guestRequests = () => read<{ items: BulkRequest[] }>(`/cart/${cartId()}/bulk`).then((r) => r.items);
export const sendGuestQuote = (input: BulkInput) => call<{ item: BulkRequest }>(`/cart/${cartId()}/bulk`, { method: 'POST', body: JSON.stringify(input) }).then((r) => r.item);
/** Keeps an image for a guest's quote (their logo or its mockup, a PNG, JPG or WebP data URL) and answers its address. */
export const uploadGuestImage = (image: string) =>
  call<{ url: string }>(`/cart/${cartId()}/images`, { method: 'POST', body: JSON.stringify({ image }) }).then((r) => r.url);

/** A guest approves or declines their quote, asks for changes, or sends new artwork. */
export const guestRequestAction = (id: string, action: RequestAction, input: RequestActionInput = {}) =>
  call<{ item: BulkRequest }>(`/cart/${cartId()}/bulk/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action, ...input }) }).then((r) => r.item);

/** A signed-in partner's designs, quote requests and orders. */
export const myDesigns = () => partnerCall<{ items: BulkRequest[] }>('/my/designs').then((r) => r.items);
export const createDesign = (input: BulkInput) => partnerCall<{ item: BulkRequest }>('/my/designs', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.item);
export const updateDesign = (id: string, input: BulkInput) =>
  partnerCall<{ item: BulkRequest }>(`/my/designs/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }).then((r) => r.item);
/** A partner approves or declines their quote, asks for changes, or sends new artwork. */
export const designAction = (id: string, action: RequestAction, input: RequestActionInput = {}) =>
  partnerCall<{ item: BulkRequest }>(`/my/designs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action, ...input }) }).then((r) => r.item);
export const deleteDesign = (id: string) => partnerCall<{ deleted: true }>(`/my/designs/${encodeURIComponent(id)}`, { method: 'DELETE' });
