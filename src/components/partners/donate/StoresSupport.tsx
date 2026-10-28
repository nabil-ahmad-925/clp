'use client';

import PartnerSupport from './PartnerSupport';

/** "Support [partner]" for each partner in an order or cart, once each (only the ones that take donations show). */
export default function StoresSupport({ slugs }: { slugs: string[] }) {
  return (
    <>
      {[...new Set(slugs.filter(Boolean))].map((slug) => (
        <PartnerSupport key={slug} slug={slug} />
      ))}
    </>
  );
}
