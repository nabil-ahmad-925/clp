import { readCart, writeCart } from './cartStore';

/**
 * The photo pages' cart drawer (new design), kept in the browser's localStorage: HD downloads and print products, each
 * with what the drawer shows. A download is also put in the site's photo cart (cartStore), which the cart page lists.
 */
export type GalleryCartItem = {
  key: string;
  kind: 'download' | 'print';
  photoId: string;
  /** The photo (the drawer's thumbnail). */
  src: string;
  name: string;
  /** "16 × 20 in · 1.5 in · Mirror", "Photo 3 · Advancement & Workshops". */
  detail: string;
  /** Dollars for the line (all its quantity). */
  price: number;
  qty: number;
};

const KEY = 'clp-gallery-cart';
const EVENT = 'clp-gallery-cart';

export function readGalleryCart(): GalleryCartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? (value as GalleryCartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: GalleryCartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Adds a line; a download is added once (and to the site's photo cart). */
export function addToGalleryCart(item: Omit<GalleryCartItem, 'key'>) {
  const items = readGalleryCart();
  if (item.kind === 'download') {
    if (items.some((i) => i.kind === 'download' && i.photoId === item.photoId)) return;
    writeCart([...readCart(), item.photoId]);
  }
  save([...items, { ...item, key: `${item.kind}-${item.photoId}-${Date.now()}` }]);
}

export function removeFromGalleryCart(key: string) {
  const items = readGalleryCart();
  const gone = items.find((i) => i.key === key);
  if (gone?.kind === 'download') writeCart(readCart().filter((id) => id !== gone.photoId));
  save(items.filter((i) => i.key !== key));
}

/** Calls `fn` whenever the cart changes (this tab or another one); returns the unsubscribe. */
export function onGalleryCart(fn: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', onStorage);
  };
}
