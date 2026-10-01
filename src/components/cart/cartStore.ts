/**
 * The photo cart (NextGEN Pro's cart on the original), kept in the browser's localStorage: the ids of the
 * photos whose HD download was added. A download can only be bought once, so an id appears at most once.
 */
export const CART_KEY = 'clp-photo-cart';

export function readCart(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.map(String))] : [];
  } catch {
    return [];
  }
}

export function writeCart(ids: string[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify([...new Set(ids)]));
  } catch {}
}

/** Money as the original formats it: a dollar sign, a space, two decimals. */
export const money = (n: number) => `$ ${n.toFixed(2)}`;
