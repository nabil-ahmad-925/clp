import type { Metadata } from 'next';
import { Suspense } from 'react';
import TrackPage from '@/components/track/TrackPage';

// An order's tracking page (/track/?id=…&k=…, the link in its shipping e-mails). A static export knows the order only in
// the browser, so it reads the address there; it's private, so search engines never list it.
export const metadata: Metadata = {
  title: { absolute: 'Track Your Order - Compete Like Pros™' },
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <TrackPage />
    </Suspense>
  );
}
