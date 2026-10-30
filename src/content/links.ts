import { call, read } from './partnerPages';

/**
 * A CLP Partner's share link (clp-api src/shared/links-public.mjs): /link/?p=<page slug>&l=<link slug>. For sale: the
 * partner's store products (the shop's cart). Paid-for: people pick for free and the partner is billed at wholesale.
 */
export type SellProduct = { productId: string; title: string; image: string; price: number };
export type GiftItem = { itemId: string; name: string; mockup: string; sizes: string[] };
export type PublicLink = {
  id: string;
  name: string;
  kind: 'sell' | 'gift';
  access: 'pub' | 'pw' | 'inv';
  phase: 'open' | 'closed' | 'review' | 'rejected' | 'cancelled';
  closes: string;
  partner: { name: string; slug: string };
  /** Private and not opened yet: no products are shown. */
  locked?: boolean;
  items?: (SellProduct | GiftItem)[];
  allow?: { count?: number; value?: number };
  ship?: 'each' | 'one';
};
export type Shipping = { line1: string; line2?: string; city: string; state: string; postalCode: string };
export type PickInput = { key?: string; name: string; email: string; phone?: string; shipping?: Shipping; lines: { itemId: string; size?: string; qty: number }[] };
export type Pick = { id: string; number: string; name: string; email: string; lines: { itemId: string; name: string; size: string; qty: number }[]; pieces: number; shipping: Shipping | null };
export type PickLink = { name: string; fulfil: 'collecting' | 'production' | 'shipped' | 'delivered'; ship: 'each' | 'one'; partner: { name: string; slug: string } | null };

const enc = encodeURIComponent;
const at = (page: string, link: string) => `/links/${enc(page)}/${enc(link)}`;

export const getLink = (page: string, link: string, key = '') => read<{ link: PublicLink }>(`${at(page, link)}${key ? `?k=${enc(key)}` : ''}`).then((r) => r.link);
export const unlockLink = (page: string, link: string, secret: { password?: string; email?: string }) =>
  call<{ key: string }>(`${at(page, link)}/unlock`, { method: 'POST', body: JSON.stringify(secret) }).then((r) => r.key);
export const placePick = (page: string, link: string, input: PickInput) => call<{ pick: Pick; token: string }>(`${at(page, link)}/picks`, { method: 'POST', body: JSON.stringify(input) });
export const getPick = (id: string, token: string) => read<{ pick: Pick; link: PickLink }>(`/link-picks/${enc(id)}?t=${enc(token)}`);

export const linkHref = (page: string, link: string) => `/link/?p=${enc(page)}&l=${enc(link)}`;
export const pickHref = (id: string, token: string) => `/link/?x=${enc(id)}&t=${enc(token)}`;

/** A private link's key, kept for this visit. */
const keyName = (page: string, link: string) => `clp-link-key:${page}/${link}`;
export const savedKey = (page: string, link: string) => {
  try {
    return sessionStorage.getItem(keyName(page, link)) ?? '';
  } catch {
    return '';
  }
};
export const saveKey = (page: string, link: string, key: string) => {
  try {
    sessionStorage.setItem(keyName(page, link), key);
  } catch {
    // Storage blocked: the key lasts as long as this page.
  }
};
