import type { Metadata } from 'next';
import { Suspense } from 'react';
import EnterTeamPage from '@/components/enterTeam/EnterTeamPage';

// Book Now › Team (/enter-team/?widget=47&listing=…): a team applies to a tournament or league. A static export knows
// the listing only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Enter a team - Compete Like Pros™' },
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <EnterTeamPage />
    </Suspense>
  );
}
