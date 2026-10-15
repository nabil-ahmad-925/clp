import type { Metadata } from 'next';
import { Suspense } from 'react';
import Checkout from '@/components/pages/Checkout';

// Checkout of a partner store's cart (/checkout/?store=<slug>, from the cart drawer). A static export knows the cart
// only in the browser.
export const metadata: Metadata = {
  title: { absolute: 'Checkout - Compete Like Pros™' },
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}
