'use client';

import { useEffect, useState } from 'react';
import { fetchPartnerPage, type PartnerDonations } from '@/content/partnerPages';

type Found = { slug: string; name: string; short: string; donations: PartnerDonations | null };
const cache = new Map<string, Promise<Found | null>>();

/** A partner's Donate settings, fetched once per visit (null: none, or the partner couldn't be read). */
function load(slug: string) {
  let found = cache.get(slug);
  if (!found) {
    found = fetchPartnerPage(slug).then(
      (r) => ({ slug, name: r.page.name, short: r.page.short, donations: r.page.donations ?? null }),
      () => (cache.delete(slug), null),
    );
    cache.set(slug, found);
  }
  return found;
}

/** The partner's name and Donate settings for a page that isn't the partner's own (checkout, confirmations). */
export function usePartnerDonations(slug: string): Found | null {
  const [found, setFound] = useState<Found | null>(null);
  useEffect(() => {
    if (!slug) return;
    let live = true;
    void load(slug).then((f) => live && setFound(f));
    return () => {
      live = false;
    };
  }, [slug]);
  return found?.slug === slug ? found : null;
}
