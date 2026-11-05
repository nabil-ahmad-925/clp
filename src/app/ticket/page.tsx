import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import TicketApp from '@/components/ticket/TicketApp';

// The guest's ticket on their phone (/ticket/?id=…&token=…, signed like /booking/'s link): check in with the field
// code, show the QR to the host, see updates. A static export knows the booking only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Your ticket - Compete Like Pros™' },
  robots: { index: false },
};

export const viewport: Viewport = { themeColor: '#5E1621', viewportFit: 'cover' };

export default function TicketPage() {
  return (
    <Suspense>
      <TicketApp />
    </Suspense>
  );
}
