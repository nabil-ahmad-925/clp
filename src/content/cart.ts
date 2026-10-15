import { call, read } from './partnerPages';

/**
 * The partner stores' cart (clp-api src/cart.mjs). The cart lives in the API: this browser keeps only its id (128 random
 * bits, the only key to it), and every line comes back priced by the store. Paying goes through Stripe's checkout
 * (CLP's account) once online payment is on; until then an order is placed unpaid and CLP arranges the payment.
 */
export type CartLine = { key: string; slug: string; productId: string; title: string; option: string; qty: number; price: number; image: string };
export type Cart = { lines: CartLine[]; count: number; subtotal: number; payments: 'online' | 'offline'; removed?: number };
export type ShippingAddress = { line1: string; line2?: string; city: string; state: string; postalCode: string; country?: string };
export type CheckoutInput = { slug: string; name: string; email: string; phone?: string; note?: string; shipping: ShippingAddress };
export type ShopOrder = {
  id: string;
  number: string;
  status: 'new' | 'shipped' | 'done' | 'cancelled';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'expired';
  partner: { name: string; slug: string };
  lines: { productId: string; title: string; option: string; qty: number; price: number; image: string }[];
  total: number;
  shipping: ShippingAddress;
  createdAt: string;
  paidAt?: string;
};

const ID_KEY = 'clp-cart-id';
/** This browser's cart id (made on first use). */
export function cartId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id || !/^[0-9a-f]{32}$/.test(id)) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked: a cart for this visit only.
    return (sessionId ??= Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''));
  }
}
let sessionId: string | undefined;

const path = (rest = '') => `/cart/${cartId()}${rest}`;
const slugQuery = (slug?: string) => (slug ? `?slug=${encodeURIComponent(slug)}` : '');

export const getCart = (slug?: string) => read<{ cart: Cart }>(path(slugQuery(slug))).then((r) => r.cart);
export const addToCart = (slug: string, productId: string, choices: Record<string, string>, qty: number) =>
  call<{ cart: Cart }>(path(`/items${slugQuery(slug)}`), { method: 'POST', body: JSON.stringify({ slug, productId, choices, qty }) }).then((r) => r.cart);
export const setLineQty = (key: string, qty: number, slug?: string) =>
  call<{ cart: Cart }>(path(`/items/${encodeURIComponent(key)}${slugQuery(slug)}`), { method: 'PATCH', body: JSON.stringify({ qty }) }).then((r) => r.cart);
export const removeLine = (key: string, slug?: string) => call<{ cart: Cart }>(path(`/items/${encodeURIComponent(key)}${slugQuery(slug)}`), { method: 'DELETE' }).then((r) => r.cart);
export const checkout = (input: CheckoutInput) =>
  call<{ order: ShopOrder; token: string; payUrl: string | null; cart: Cart }>(path('/checkout'), { method: 'POST', body: JSON.stringify(input) });
export const getOrder = (id: string, token: string) => read<{ order: ShopOrder }>(`/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`).then((r) => r.order);

export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** The order confirmation page of an order (its secret link). */
export const orderHref = (id: string, token: string) => `/checkout/done/?order=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
/** The checkout page of a store's cart. */
export const checkoutHref = (slug: string) => `/checkout/?store=${encodeURIComponent(slug)}`;

/** Tells every cart badge on the page that the cart changed. */
export const CART_EVENT = 'clp-cart-changed';
export const cartChanged = (cart: Cart) => window.dispatchEvent(new CustomEvent<Cart>(CART_EVENT, { detail: cart }));
