'use client';

import SupportCard from './SupportCard';
import { usePartnerDonations } from './usePartnerDonations';

/** "Support [partner]" for a partner known only by their page address: nothing unless they take donations. */
export default function PartnerSupport({ slug }: { slug: string }) {
  const found = usePartnerDonations(slug);
  return found?.donations ? <SupportCard name={found.name} short={found.short} donations={found.donations} /> : null;
}
