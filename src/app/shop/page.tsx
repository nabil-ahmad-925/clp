import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopView from '@/components/shop/ShopView';

export const metadata: Metadata = {
  title: { absolute: 'SHOP - Compete Like Pros™' },
  description: 'Official gear from the athletes, clubs, schools and organizations on CLP, sold by their own stores.',
  alternates: { canonical: '/shop/' },
};

/** The shop: what shows comes from the address (a store, a product…), known only in the browser. */
export default function ShopPage() {
  return (
    <Suspense>
      <ShopView />
    </Suspense>
  );
}
