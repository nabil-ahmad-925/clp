import { LuVolleyball } from 'react-icons/lu';
import { sportLabel, type ShopProduct, type ShopStore } from '@/content/storefront';
import type { ListChip } from './shopListing';

/** A filter of a product list besides its category (a sport, a drop), its value in the address by `id`. */
export type ProductFilter = Omit<ListChip, 'options' | 'value' | 'onChange' | 'count'> & {
  options: { value: string; label: string }[];
  test: (p: ShopProduct, value: string) => boolean;
};

/**
 * A product's sports: its own when the partner chose one, else its store's (a soccer club's hoodie is soccer gear).
 * CLP's exclusives only ever count their own, since CLP's store isn't one sport's.
 */
export const productSports = (p: ShopProduct, store?: Pick<ShopStore, 'sports' | 'shop'>) =>
  p.sport ? [p.sport] : store && !store.shop.exclusive ? store.sports : [];

/** The Sports filter over a list's products: the sports they have, A to Z (hidden when none has one). */
export function sportFilter(products: ShopProduct[], stores: ShopStore[]): ProductFilter {
  const storeOf = new Map(stores.map((st) => [st.slug, st]));
  const sportsOf = (p: ShopProduct) => productSports(p, storeOf.get(p.slug));
  const sports = [...new Set(products.flatMap(sportsOf))];
  return {
    id: 'sport',
    name: 'Sports',
    heading: 'Sport',
    icon: <LuVolleyball />,
    plural: 'sports',
    options: sports.map((sp) => ({ value: sp, label: sportLabel(sp) })).sort((a, b) => a.label.localeCompare(b.label)),
    test: (p, v) => sportsOf(p).includes(v),
  };
}
