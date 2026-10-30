import type { Metadata } from 'next';
import { Suspense } from 'react';
import PreorderPage from '@/components/preorders/PreorderPage';

// A CLP Partner's pre-order (/pre-order/?c=<id>) and a buyer's own order (?o=<id>&t=<secret>): private links, not indexed.
export const metadata: Metadata = {
  title: { absolute: 'Pre-order - Compete Like Pros™' },
  robots: { index: false },
};

export default function PreorderRoute() {
  return (
    <Suspense>
      <PreorderPage />
    </Suspense>
  );
}
