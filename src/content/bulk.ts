import catalog from './data/bulkCatalog.json';
import { cartId } from './cart';
import { PartnerApiError, call, read } from './partnerPages';
import { partnerCall } from './partnerSession';
import type { Address } from './address';
import type { ClientSourcing, SourcingInput } from './sourcing';

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
  /** Who and where: `address` is the full delivery address (content/address.ts); older requests have `deliverTo` text. */
  contact?: { name: string; organization: string; email: string; inHands: string; message: string; logoLink: string; deliverTo?: string; address?: Address | null } | null;
  /** When production finished (the maker's finished-goods photos): the balance is paid, then it ships. */
  producedAt?: string;
  /** Its reference (R-1A2B3C), as CLP's e-mails give it. */
  ref?: string;
  /** A "Can't Find It?" request (content/sourcing.ts): what we're finding for them and its 3 steps. */
  sourcing?: ClientSourcing | null;
  /** CLP's quote: per piece, total, when it's ready, how long the quote holds. */
  quote?: { unitPrice: number; total: number; qty: number; lead: string; validUntil: string; sentAt: string };
  /** CLP's artwork check: sent back with a note, or approved; "resubmitted" once they sent a new file. */
  art?: { state: 'approved' | 'changes' | 'resubmitted'; note: string; at: string; reply?: string };
  /** What they said about the quote: asked for changes, or declined it. */
  reply?: { kind: 'changes' | 'declined'; note: string; at: string };
  approvedAt?: string;
  /** After the quote: the 50% deposit due and what CLP received, a verified buyer's PO, and the proof to approve. */
  /** The money (clp-api shared/bulk-payments.mjs): total, 50% deposit, paid, waiting for CLP, left; what can be paid now. */
  money?: PayMoney;
  /** How it travels and the shipping price CLP sent (freight, duties and handling as one number, part of the total). */
  shipment?: { mode?: 'ground' | 'air' | 'sea' | 'express'; price?: { amount: number; note: string; sentAt: string } };
  payOptions?: PayOption[];
  payments?: Payment[];
  /** The production files it needs (a vector logo, a stitch file for embroidery, a print-ready file for sublimation). */
  files?: Partial<Record<FileKey, ProductionFile>>;
  /** CLP still has to choose how it's made (the item lists methods that need different files). */
  needsMethod?: boolean;
  methods?: string[];
  /** CLP's payment details, only while something can be paid. */
  payTo?: PayTo;
  po?: { number: string };
  /** The proof: its file, what it shows (color, placement, size, method), where it stands, their change. */
  /** The proof: every file of it (pictures, PDFs, links), our note, where it stands and what it shows. */
  proof?: { files?: ProofFile[]; url?: string; note: string; sentAt: string; state: 'sent' | 'changes' | 'approved'; details?: { color: string; placement: string; size: string; method: string }; reply?: { note: string; at: string }; approvedAt?: string };
  /** The proofs sent before it, newest first: their files, where each stood and the change asked. */
  proofHistory?: { files?: ProofFile[]; url?: string; note: string; sentAt: string; state: 'sent' | 'changes' | 'approved'; reply?: { note: string; at: string } }[];
  /** Its shipment (clp-api shared/bulk-shipping.mjs): boxes, when it should arrive, the tracking corrected, its delivery. */
  shipping?: { boxes: { carrier: string; number: string; status?: 'shipped' | 'out' | 'delivered'; outAt?: string; deliveredAt?: string }[]; shippedAt: string; eta?: string; etaWas?: string; delayedAt?: string; trackingAt?: string; deliveredAt?: string; deliveredBy?: 'clp' | 'client' };
  /** Opens its tracking page (/track/), made when it ships. */
  trackKey?: string;
  /** Who they sent their upload link to (Send to My Designer, clp-api shared/upload-link.mjs). */
  designer?: { email: string; at: string; note?: string } | null;
  /** Paid artwork services we offered on their files, and their answers (clp-api shared/file-services.mjs). */
  services?: { id: string; kind: string; label: string; fileKey: FileKey; price: number; note?: string; status: 'offered' | 'accepted' | 'declined' | 'cancelled'; at: string; decidedAt?: string; askedBy?: 'client' }[];
  /** The two checkpoints: their files cleared for manufacturing, and their proof approved (clp-api shared/client-history.mjs). */
  checkpoints?: { files: { cleared: boolean; at?: string }; proof: { approved: boolean; at?: string } };
  /** Their own history of the order, newest first: what they and we did, with dates. */
  history?: { at: string; text: string }[];
  /** They let CLP make technical fixes to their files without asking (vectorizing, background, resolution, digitizing). */
  fileAuth?: { technical: boolean; at: string };
  /** Photos and samples from the workshop CLP shared, or asks them to approve (clp-api shared/bulk-samples.mjs). */
  samples?: RequestSample[];
};
/** A proof from the workshop (before production, or the finished order): its files, CLP's note, where it stands, their change. */
/** One file of a proof (a picture, a PDF, a link to more). */
export type ProofFile = { url: string; name: string; image: boolean };
/** A proof's files: its list, or an API before the list's single `url` (clp-api shared/proof-files.mjs proofFilesOf). */
export const proofFilesOf = (p?: { files?: ProofFile[]; url?: string } | null): ProofFile[] =>
  p?.files?.length ? p.files : p?.url ? [{ url: p.url, name: 'Proof', image: /\.(jpe?g|png|svg|webp)$/i.test(p.url.split(/[?#]/)[0] ?? '') }] : [];
export type RequestSample = {
  id: string;
  kind: 'proof' | 'sample' | 'finished';
  files: { url: string; name: string; image: boolean }[];
  status: 'shared' | 'waiting' | 'approved' | 'changes';
  note: string;
  at: string;
  reply?: { note: string; at: string };
  decidedAt?: string;
};
/** What a requester does with their quote request or order (My quote requests). */
export type RequestAction = 'approve-quote' | 'ask-changes' | 'decline' | 'new-artwork' | 'approve-proof' | 'proof-changes' | 'submit-payment' | 'add-file' | 'approve-sample' | 'sample-changes' | 'approve-file-change' | 'decline-file-change' | 'authorize-fixes' | 'accept-service' | 'decline-service' | 'confirm-delivered' | 'ask-clp-make' | 'send-to-designer';
export type RequestActionInput = { note?: string; logo?: string; link?: string; kind?: PayKind; method?: PayMethod; reference?: string; sentOn?: string; fileKey?: FileKey; name?: string; data?: string; text?: string; sampleId?: string; on?: boolean; serviceId?: string; email?: string };
/** A production file category (clp-api shared/file-specs.mjs), or one CLP asked for (`ask-…`). */
export type FileKey = 'vector' | 'png' | 'small' | `ask-${string}` | 'stitch' | 'threads' | 'inks' | 'yarns' | 'print' | 'roster' | 'mockup' | 'back' | 'logos' | 'fonts' | 'refs';
/** What an uploaded file really is (clp-api shared/file-info.mjs): vector or raster, pixel size and DPI, too small to print well. */
export type FileInfo = { kind: 'vector' | 'raster' | 'other'; width?: number; height?: number; dpi?: number; low?: boolean };
/**
 * A production file category the order needs (clp-api shared/file-specs.mjs): its name, what it takes (files of these
 * types, or text like thread colors), whether it's required or takes several, where it stands, CLP's note, what was sent.
 */
export type ProductionFile = {
  label: string;
  /** When CLP asked them for it (Request a File, clp-api shared/file-asks.mjs). */
  asked?: string;
  hint: string;
  type: 'file' | 'text';
  accept?: string[];
  required: boolean;
  multiple?: boolean;
  /** CLP can make it for them (Have CLP Do It, at CLP's fee). */
  clpMakes?: boolean;
  /** client: our change waits on their approval · declined: they asked us for another change (clp-api shared/file-review.mjs). */
  status: 'missing' | 'review' | 'approved' | 'changes' | 'clp' | 'optional' | 'client' | 'declined';
  note: string;
  /** Why we asked for a new file (with status changes). */
  reason?: 'vector' | 'resolution' | 'color' | 'background' | 'info' | 'other';
  /** Their note asking us for another change (with status declined). */
  reply?: { note: string; at: string };
  /** Every version, oldest first (none is ever overwritten): ours say what we changed and did, and who approved it. */
  versions: { url?: string; text?: string; name: string; at: string; by: 'client' | 'clp'; change?: 'as-sent' | 'format' | 'technical' | 'design'; done?: string; clientApproval?: { by: 'client' | 'clp'; at: string }; info?: FileInfo }[];
};
export type PayKind = 'deposit' | 'full' | 'balance';
/** How the client pays (no card until the payment provider is connected). */
export type PayMethod = 'bank' | 'zelle' | 'check';
export type PayOption = { kind: PayKind; amount: number };
export type PayMoney = { total: number; deposit: number; paid: number; pending: number; balance: number; depositMet: boolean };
export type Payment = { id: string; kind: PayKind; amount: number; method: string; reference: string; sentOn?: string; note?: string; status: 'submitted' | 'confirmed' | 'rejected'; at: string; confirmedAt?: string; reviewNote?: string };
export type PayTo = { payee: string; bank: string; zelle: string; checks: string; note: string };
export type BulkInput = Omit<BulkRequest, 'id' | 'itemName' | 'status' | 'createdAt' | 'design' | 'mockup' | 'brief' | 'addons' | 'mode' | 'contact' | 'sourcing'> & {
  mode?: 'logo' | 'design';
  brief?: string;
  addons?: string[];
  design?: StudioDesign | null;
  mockup?: string;
  contact?: BulkRequest['contact'];
  /** Asks CLP to find it (content/sourcing.ts): it's sent as the custom item. */
  sourcing?: SourcingInput;
};

/** A guest's quote requests (this browser's) and sending one. */
export const guestRequests = () => read<{ items: BulkRequest[] }>(`/cart/${cartId()}/bulk`).then((r) => r.items);
// 30 s: a quote with a long design on a slow connection (never retried: it would be sent twice).
export const sendGuestQuote = (input: BulkInput) => call<{ item: BulkRequest }>(`/cart/${cartId()}/bulk`, { method: 'POST', body: JSON.stringify(input), timeoutMs: 30_000 }).then((r) => r.item);
/** Keeps an image for a guest's quote (their logo or its mockup, a PNG, JPG or WebP data URL) and answers its address. */
// An upload may take a while on a slow connection (60 s), and is tried once more when the connection drops (a second
// copy of an image is harmless): before, a 15 s limit cut it off and the whole quote failed ("Could not reach CLP").
export async function uploadGuestImage(image: string): Promise<string> {
  const once = () => call<{ url: string }>(`/cart/${cartId()}/images`, { method: 'POST', body: JSON.stringify({ image }), timeoutMs: 60_000 }).then((r) => r.url);
  try {
    return await once();
  } catch (err) {
    if (!(err instanceof PartnerApiError) || err.status !== 0) throw err;
    try {
      return await once();
    } catch (again) {
      if (again instanceof PartnerApiError && again.status === 0) throw new PartnerApiError(0, 'Your image didn’t upload: the connection is slow or dropped. Try again, or send it after your request from Quote Requests.');
      throw again;
    }
  }
}

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
