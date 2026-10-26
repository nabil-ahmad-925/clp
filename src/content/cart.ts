import { call, read } from './partnerPages';
import { partnerCall } from './partnerSession';

/**
 * The partner stores' cart (clp-api src/cart.mjs). The cart lives in the API: this browser keeps only its id (128 random
 * bits, the only key to it), and every line comes back priced by the store. Paying goes through Stripe's checkout
 * (CLP's account) once online payment is on; until then an order is placed unpaid and CLP arranges the payment.
 */
export type CartLine = { key: string; slug: string; productId: string; title: string; option: string; qty: number; price: number; image: string; coveredQty?: number; unitCharge?: number; lineCharge?: number };
export type Amounts = { subtotal: number; covered: number; discount: number; shipping: number; tax: number; total: number };
export type AppliedCode = { code: string; kind: 'percent' | 'team'; label: string; slug: string; team: string };
export type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** With the codes and delivery asked for (see getCart). */
  totals?: Amounts;
  stores?: { slug: string; name: string; amounts: Amounts; pickupNote: string }[];
  allCovered?: boolean;
  codes?: AppliedCode[];
  badCodes?: string[];
  /** Every store in the cart offers pick-up. */
  pickup?: boolean;
  payments: 'online' | 'offline';
  removed?: number;
};
export type ShippingAddress = { line1: string; line2?: string; city: string; state: string; postalCode: string; country?: string };
export type Delivery = 'ship' | 'pickup';
export type CheckoutInput = {
  slug?: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  delivery: Delivery;
  shipping?: ShippingAddress;
  codes?: string[];
  claimant?: { name: string; role: string };
  marketing?: boolean;
};
export type ShopOrder = {
  id: string;
  number: string;
  status: 'new' | 'shipped' | 'done' | 'cancelled';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'expired';
  partner: { name: string; slug: string };
  lines: { productId: string; title: string; option: string; qty: number; price: number; image: string; coveredQty?: number }[];
  total: number;
  amounts?: Amounts;
  delivery?: Delivery;
  pickupNote?: string;
  codes?: AppliedCode[];
  claimant?: { name: string; role: string };
  shipping: ShippingAddress | null;
  createdAt: string;
  paidAt?: string;
};

const ID_KEY = 'clp-cart-id';
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
let sessionId: string | undefined;

/** This browser's cart id (made on first use): a guest's own, or the signed-in account's (see switchCartId). */
export function cartId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id || !/^[0-9a-f]{32}$/.test(id)) {
      id = randomId();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked: a cart for this visit only.
    return (sessionId ??= randomId());
  }
}

/** The cart this browser uses from now on: the account's once signed in (clp-api POST /my/cart), a new one once signed out. */
export function switchCartId(id: string = randomId()) {
  try {
    localStorage.setItem(ID_KEY, id);
  } catch {
    sessionId = id;
  }
}

/** Signing in: this browser's cart joins the account's, and this browser uses the account's from then on. */
export async function joinAccountCart() {
  const { cartId: mine } = await partnerCall<{ cartId: string }>('/my/cart', { method: 'POST', body: JSON.stringify({ cartId: cartId() }) });
  switchCartId(mine);
}

const path = (rest = '') => `/cart/${cartId()}${rest}`;
const slugQuery = (slug?: string) => (slug ? `?slug=${encodeURIComponent(slug)}` : '');

/** Pricing the cart: the codes typed and the delivery (pick-up when every store offers it). */
export type Pricing = { codes?: string[]; delivery?: Delivery };
const pricingQuery = (slug?: string, p: Pricing = {}) => {
  const qs = new URLSearchParams({ ...(slug ? { slug } : {}), ...(p.codes?.length ? { codes: p.codes.join(',') } : {}), ...(p.delivery === 'pickup' ? { delivery: 'pickup' } : {}) }).toString();
  return qs ? `?${qs}` : '';
};

/** The codes the shopper applied, kept for this visit (a partner page's cart and the checkout share them). */
const CODES_KEY = 'clp-cart-codes';
export const readCodes = (): string[] => {
  try {
    const codes: unknown = JSON.parse(sessionStorage.getItem(CODES_KEY) ?? '[]');
    return Array.isArray(codes) ? codes.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
};
export const keepCodes = (codes: string[]) => {
  try {
    sessionStorage.setItem(CODES_KEY, JSON.stringify(codes));
  } catch {
    // Storage blocked: the codes last as long as this page.
  }
};

export const getCart = (slug?: string, pricing?: Pricing) => read<{ cart: Cart }>(path(pricingQuery(slug, pricing))).then((r) => r.cart);
/**
 * Adds a product (a private store's needs the invite key the shop got when it was unlocked) and answers the whole cart,
 * every store's lines (the shop's badge and drawer), not only this store's.
 */
export const addToCart = (slug: string, productId: string, choices: Record<string, string>, qty: number, key?: string) =>
  call<{ cart: Cart }>(path('/items'), { method: 'POST', body: JSON.stringify({ slug, productId, choices, qty, ...(key ? { key } : {}) }) }).then((r) => r.cart);
export const setLineQty = (key: string, qty: number, slug?: string) =>
  call<{ cart: Cart }>(path(`/items/${encodeURIComponent(key)}${slugQuery(slug)}`), { method: 'PATCH', body: JSON.stringify({ qty }) }).then((r) => r.cart);
export const removeLine = (key: string, slug?: string) => call<{ cart: Cart }>(path(`/items/${encodeURIComponent(key)}${slugQuery(slug)}`), { method: 'DELETE' }).then((r) => r.cart);
export type CheckoutInfo = { id: string; number: string; amounts: Amounts; createdAt: string };
/** Submits the cart (or one store's part): one order per store, paid together. */
export const checkout = (input: CheckoutInput) =>
  call<{ checkout: CheckoutInfo; orders: ShopOrder[]; token: string; payUrl: string | null; cart: Cart }>(path('/checkout'), { method: 'POST', body: JSON.stringify(input) });
export const getOrder = (id: string, token: string) => read<{ order: ShopOrder }>(`/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`).then((r) => r.order);
export const getCheckout = (id: string, token: string) =>
  read<{ checkout: CheckoutInfo; orders: ShopOrder[] }>(`/checkouts/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`);

export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** The confirmation page of a checkout (its secret link). */
export const checkoutDoneHref = (id: string, token: string) => `/checkout/done/?checkout=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
/** The order confirmation page of an order from before checkouts (its secret link). */
export const orderHref = (id: string, token: string) => `/checkout/done/?order=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
/** The checkout page: the whole cart, or one store's part. */
export const checkoutHref = (slug?: string) => (slug ? `/checkout/?store=${encodeURIComponent(slug)}` : '/checkout/');

/** Tells every cart badge on the page that the cart changed. */
export const CART_EVENT = 'clp-cart-changed';
export const cartChanged = (cart: Cart) => window.dispatchEvent(new CustomEvent<Cart>(CART_EVENT, { detail: cart }));
