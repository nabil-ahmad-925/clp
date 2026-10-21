'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchPrintCatalog } from '@/content/albums';
import { withCatalog, type PrintCatalogEntry, type PrintProduct } from '@/content/gallery';

/**
 * The print products a photo of this album can go on, as CLP set them up (Photo products), for `partner`'s album (the
 * owner's partner page slug). `ready` once CLP's catalog has been read (or couldn't be: the built-in one then), so
 * prices never change in front of the family.
 */
export default function usePrintProducts(partner?: string): { products: PrintProduct[]; ready: boolean } {
  const [entries, setEntries] = useState<PrintCatalogEntry[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    fetchPrintCatalog().then((e) => live && setEntries(e));
    return () => {
      live = false;
    };
  }, []);
  const products = useMemo(() => withCatalog(entries ?? null, partner), [entries, partner]);
  return { products, ready: entries !== undefined };
}
