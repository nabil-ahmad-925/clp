import type { Metadata } from 'next';
import { Suspense } from 'react';
import TournamentPublicPage from '@/components/tournament/TournamentPublicPage';

// A static export knows which one only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Tournament - Compete Like Pros™' },
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <TournamentPublicPage />
    </Suspense>
  );
}
