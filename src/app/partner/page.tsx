import type { Metadata } from 'next';
import { Suspense } from 'react';
import PartnerRoute from '@/components/partners/PartnerRoute';

// A CLP Partner's page: /partner/?p=<slug> (fetched in the browser, see PartnerRoute).
export const metadata: Metadata = {
  title: { absolute: 'CLP Partner - Compete Like Pros™' },
};

export default function PartnerPage() {
  return (
    <Suspense>
      <PartnerRoute />
    </Suspense>
  );
}
