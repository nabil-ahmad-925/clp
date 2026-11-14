import type { Metadata } from 'next';
import { Suspense } from 'react';
import ForwarderPage from '@/components/forwarder/ForwarderPage';

// A forwarder's no-account link (/forwarder/?id=…&q=…&k=…, from CLP's quote request e-mail). A static export knows the
// shipment only in the browser, so it reads the address there; it's private, so search engines never list it.
export const metadata: Metadata = {
  title: { absolute: 'Freight Quote - Compete Like Pros™' },
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <ForwarderPage />
    </Suspense>
  );
}
