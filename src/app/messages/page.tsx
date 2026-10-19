import type { Metadata } from 'next';
import { Suspense } from 'react';
import GuestMessages from '@/components/pages/GuestMessages';

// A guest's conversation on CLP Messages (/messages/?thread=…&t=…, its private link), or the ones started on this
// device (/messages/). A static export knows the conversation only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Messages - Compete Like Pros™' },
  robots: { index: false },
};

export default function MessagesPage() {
  return (
    <Suspense>
      <GuestMessages />
    </Suspense>
  );
}
