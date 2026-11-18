'use client';

import { useEffect } from 'react';
import { startPartnerTags, type PartnerAnalytics } from '@/content/partnerTags';

/** The partner's own analytics tags while their page is open (content/partnerTags.ts). Draws nothing. */
export default function PartnerTags({ analytics }: { analytics?: PartnerAnalytics | null }) {
  const ga4 = analytics?.ga4 ?? '';
  const pixel = analytics?.pixel ?? '';
  useEffect(() => startPartnerTags(ga4 || pixel ? { ga4, pixel } : null), [ga4, pixel]);
  return null;
}
