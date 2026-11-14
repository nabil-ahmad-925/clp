import { backDay, type WsItem } from './wholesale';

/**
 * What an item page says about stock, from the catalog (clp-api shared/wholesale-media.mjs keeps stock per color and
 * size when the supplier gives it; `avail` is then the total). With stock per variant the page counts the picked
 * color only, and marks its sold-out sizes. Pure, so it's checked without a browser.
 */

/** Whether stock is kept per color and size. */
export const byVariant = (item: WsItem) => Object.keys(item.variantStock ?? {}).length > 0;

/** The keys the catalog uses: '#RRGGBB|size' (either part empty when the item has none). */
const keyOf = (item: WsItem, color: string, size: string) => {
  const own = item.colors.find((c) => c.toUpperCase() === color.toUpperCase()) ?? (item.colors.length ? color : '');
  return `${own}|${item.sizes.length ? size : ''}`;
};

/** Pieces of one color and size (undefined: not known, e.g. kept as a total only). */
export const piecesOf = (item: WsItem, color: string, size: string) => (byVariant(item) ? item.variantStock![keyOf(item, color, size)] : undefined);

/** Pieces in stock in the picked color (the item's total when stock isn't kept per color). */
export function availFor(item: WsItem, color: string) {
  if (!byVariant(item) || !item.colors.length) return item.avail;
  const sizes = item.sizes.length ? item.sizes : [''];
  return sizes.reduce((n, z) => n + (piecesOf(item, color, z) ?? 0), 0);
}

/** The stock line under the price: its dot colour and words. */
export function stockLine(item: WsItem, color: string): [string, string] {
  if (item.back) return ['#B03A2E', `Back-ordered at the supplier · back about ${backDay(item.back)} · min ${item.min}`];
  if (item.stock !== 'in') return ['#C9A44C', `Made to order · ${item.lead} · min ${item.min}`];
  const n = availFor(item, color);
  if (byVariant(item) && item.colors.length && !n) return ['#B03A2E', `Sold out in this color · pick another · min ${item.min}`];
  return ['#1E7A45', `${n.toLocaleString('en-US')} in stock${byVariant(item) && item.colors.length ? ' in this color' : ''} · ships in ${item.lead} · min ${item.min}`];
}

/** A size box's note: "Sold out", "12 left" (under 50), or '' when there's plenty or it isn't known. */
export function sizeNote(item: WsItem, color: string, size: string) {
  const n = piecesOf(item, color, size === 'Qty' ? '' : size);
  if (n === undefined || item.stock !== 'in') return '';
  return n === 0 ? 'Sold out' : n < 50 ? `${n} left` : '';
}

/** The photo to show for a color ('' = none set). */
export const colorPhotoOf = (item: WsItem, color: string) => Object.entries(item.colorPhotos ?? {}).find(([c]) => c.toUpperCase() === color.toUpperCase())?.[1] ?? '';
