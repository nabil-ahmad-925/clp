import type { Metadata } from 'next';
import { Suspense } from 'react';
import GuestBooking from '@/components/pages/GuestBooking';

// The guest's booking (/booking/?id=…&token=…, the link in their booking e-mails): see it, or cancel it for free up to
// two days before. A static export knows the booking only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Your booking - Compete Like Pros™' },
  robots: { index: false },
};

export default function BookingPage() {
  return (
    <Suspense>
      <GuestBooking />
    </Suspense>
  );
}
