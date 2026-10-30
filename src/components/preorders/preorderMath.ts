import type { OrderLine, PreorderOrder, PreorderPhase, PublicPreorder } from '@/content/preorders';

/** Most pieces in one order (the API's limit too). */
export const MAX_PIECES = 20;
export type Draft = Record<string, number>;
export const draftKey = (itemId: string, size: string) => `${itemId}\n${size}`;

export const piecesOf = (draft: Draft) => Object.values(draft).reduce((n, q) => n + q, 0);

/** The order's lines from a draft (kept in the pre-order's item order). */
export function linesOf(draft: Draft, preorder: { items: { itemId: string; sizes: string[] }[] }) {
  return preorder.items.flatMap((item) => (item.sizes.length ? item.sizes : ['']).map((size) => ({ itemId: item.itemId, size, qty: draft[draftKey(item.itemId, size)] ?? 0 }))).filter((l) => l.qty > 0);
}

/** Dollars, in cents, so adding doesn't drift. */
export const totalOf = (draft: Draft, preorder: PublicPreorder) =>
  linesOf(draft, preorder).reduce((n, l) => n + l.qty * Math.round((preorder.items.find((i) => i.itemId === l.itemId)?.price ?? 0) * 100), 0) / 100;

/** A draft holding an existing order's lines. */
export const draftOf = (lines: OrderLine[]): Draft => Object.fromEntries(lines.map((l) => [draftKey(l.itemId, l.size), l.qty]));

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
const daysBetween = (iso: string, now: number) => Math.ceil((Date.parse(iso) - now) / 86_400_000);

/** What a pre-order's phase means to a buyer. */
export function phaseLine(p: PublicPreorder, now = Date.now()): string {
  const by: Record<PreorderPhase, string> = {
    scheduled: `Orders open ${day(p.opensAt)}.`,
    open: (() => {
      const left = daysBetween(p.endsAt, now);
      return left <= 1 ? `Orders close today at ${new Date(p.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.` : `Orders close ${day(p.endsAt)} (${left} days left).`;
    })(),
    closing: 'Orders are closed.',
    closed: 'Orders are closed. The pieces are being made in one batch.',
    short: 'Orders are closed. It didn’t reach its minimum, and the organizer is deciding whether to go ahead.',
    production: 'Being made now.',
    shipped: `On its way to ${p.partner.name}.`,
    delivered: `Ready to pick up from ${p.partner.name}.`,
    confirmed: 'Handed out. Thank you!',
    cancelled: 'This pre-order was cancelled.',
  };
  return by[p.phase];
}

export const acceptsOrders = (p: PublicPreorder) => p.phase === 'open';

/** How much of the minimum is reached, 0 to 1. */
export const progressOf = (p: PublicPreorder) => Math.min(1, p.pieces / Math.max(1, p.minPieces));

/** What a buyer sees about the money on their order. */
export function moneyLine(o: PreorderOrder): string {
  if (o.status === 'cancelled') return o.balance < 0 ? `Cancelled. CLP will refund $${(-o.balance).toFixed(2)}.` : 'Cancelled. Nothing is owed.';
  if (o.balance > 0) return o.paid > 0 ? `Paid $${o.paid.toFixed(2)}. $${o.balance.toFixed(2)} still to pay.` : 'Not paid yet. CLP will arrange payment with you before your order is made.';
  if (o.balance < 0) return `Paid $${o.paid.toFixed(2)}. CLP will refund $${(-o.balance).toFixed(2)}.`;
  return `Paid $${o.paid.toFixed(2)}. Thank you!`;
}
