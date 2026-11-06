import type { Metadata } from 'next';
import { Suspense } from 'react';
import TeamOfferPage from '@/components/tournament/TeamOfferPage';

// A static export knows which one only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Your Spot Offer - Compete Like Pros™' },
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <TeamOfferPage />
    </Suspense>
  );
}
