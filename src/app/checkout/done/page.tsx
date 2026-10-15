import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrderDone from '@/components/pages/OrderDone';

// The shopper's order (/checkout/done/?order=…&t=…): where Stripe sends them back, and their order e-mail's link.
export const metadata: Metadata = {
  title: { absolute: 'Your order - Compete Like Pros™' },
  robots: { index: false },
};

export default function OrderDonePage() {
  return (
    <Suspense>
      <OrderDone />
    </Suspense>
  );
}
