import { shopHref } from './storefront';
import type { WsItem } from './wholesale';

/** One row of items under an item's page: title, line, items, its "see all" label and link. */
export type RelatedRow = [title: string, sub: string, items: WsItem[], allLabel: string, allHref: string];

/**
 * The two rows under an item: "Often ordered together" (the related items CLP picked, shown both ways; none picked:
 * items from other categories) and "More like this" (the same category).
 */
export function relatedRows(item: WsItem, all: WsItem[]): RelatedRow[] {
  const others = all.filter((x) => x.id !== item.id);
  const picked = (item.related ?? []).map((id) => others.find((x) => x.id === id)).filter((x): x is WsItem => Boolean(x));
  const together = picked.length ? picked.slice(0, 8) : others.filter((x) => x.cat !== item.cat).slice(0, 4);
  const like = others.filter((x) => x.cat === item.cat && !picked.includes(x)).slice(0, 4);
  return [
    ['Often ordered together', picked.length ? 'Picked by CLP to go with this item' : 'Teams that order this usually add these', together, 'Shop all', shopHref({ view: 'bulk' })],
    ['More like this', `Similar ${item.cat.toLowerCase()} from our brands and makers`, like.length ? like : others.slice(4, 8), `See all ${item.cat.toLowerCase()}`, shopHref({ view: 'bulk', wcat: item.cat })],
  ];
}
