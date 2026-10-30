import { call, read } from './partnerPages';

/**
 * Buying from a CLP Partner's pre-order (clp-api src/shared/preorders-public.mjs): the page at /pre-order/?c=<id> and
 * a buyer's own order at /pre-order/?o=<id>&t=<secret>. Nothing is paid on the site: CLP arranges payment.
 */
export type PreorderPhase = 'scheduled' | 'open' | 'closing' | 'closed' | 'short' | 'production' | 'shipped' | 'delivered' | 'confirmed' | 'cancelled';
export type PublicItem = { itemId: string; name: string; price: number; mockup: string; sizes: string[] };
export type PublicPreorder = {
  id: string;
  name: string;
  partner: { name: string; slug: string };
  phase: PreorderPhase;
  opensAt: string;
  endsAt: string;
  event: string;
  eventDate: string;
  minPieces: number;
  pieces: number;
  items: PublicItem[];
};
export type OrderLine = { itemId: string; name: string; size: string; qty: number; price: number; total: number };
export type PreorderOrder = {
  id: string;
  number: string;
  name: string;
  email: string;
  phone: string;
  lines: OrderLine[];
  pieces: number;
  total: number;
  status: 'active' | 'cancelled';
  createdAt: string;
  paid: number;
  /** More than 0: still to pay. Less than 0: CLP owes it back. */
  balance: number;
  canChange: boolean;
  preorder: PublicPreorder;
};
export type OrderInput = { name: string; email: string; phone?: string; lines: { itemId: string; size?: string; qty: number }[] };

const enc = encodeURIComponent;
const withSecret = (id: string, token: string) => `/preorder-orders/${enc(id)}?t=${enc(token)}`;

export const getPreorder = (id: string) => read<{ preorder: PublicPreorder }>(`/preorders/${enc(id)}`).then((r) => r.preorder);
export const placeOrder = (id: string, input: OrderInput) =>
  call<{ order: PreorderOrder; token: string }>(`/preorders/${enc(id)}/orders`, { method: 'POST', body: JSON.stringify(input) });
export const getOrder = (id: string, token: string) => read<{ order: PreorderOrder }>(withSecret(id, token)).then((r) => r.order);
export const changeOrder = (id: string, token: string, input: OrderInput) =>
  call<{ order: PreorderOrder }>(withSecret(id, token), { method: 'PUT', body: JSON.stringify(input) }).then((r) => r.order);
export const cancelOrder = (id: string, token: string) => call<{ order: PreorderOrder }>(withSecret(id, token), { method: 'DELETE' }).then((r) => r.order);

/** The link to a pre-order, to share. */
export const preorderHref = (id: string) => `/pre-order/?c=${enc(id)}`;
export const orderHref = (id: string, token: string) => `/pre-order/?o=${enc(id)}&t=${enc(token)}`;
