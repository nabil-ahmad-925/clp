'use client';

import { useSyncExternalStore } from 'react';

/**
 * What a page adds to the site header (a CLP Partner's page, as the design's co-branded header): "× AFC" beside the
 * CLP logo, and its cart (the item count, opening the page's cart drawer) beside the menu.
 */
export type HeaderBrand = {
  label: string;
  cartCount: number;
  onCart: () => void;
  /** The shop's header ("CLP │ SHOP"): the label in gold, without the "×". */
  shop?: boolean;
  /** Where the shop's label leads (the shop's home; the wholesale's on Wholesale). */
  href?: string;
} | null;

let current: HeaderBrand = null;
const listeners = new Set<() => void>();

/** Sets (or, with null, clears) the header's co-brand; a page clears it when it goes. */
export const setHeaderBrand = (brand: HeaderBrand) => {
  current = brand;
  listeners.forEach((l) => l());
};

export const useHeaderBrand = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
