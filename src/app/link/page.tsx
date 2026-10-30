import type { Metadata } from 'next';
import { Suspense } from 'react';
import LinkPage from '@/components/links/LinkPage';

// A CLP Partner's share link (/link/?p=<page>&l=<link>) and a person's pick from one (?x=<id>&t=<secret>): not indexed.
export const metadata: Metadata = {
  title: { absolute: 'Compete Like Pros™' },
  robots: { index: false },
};

export default function LinkRoute() {
  return (
    <Suspense>
      <LinkPage />
    </Suspense>
  );
}
