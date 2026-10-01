import type { Metadata } from 'next';
import ShoppingCart from '@/components/cart/ShoppingCart';
import { getShopImages, shopMeta } from '@/content/shop';

export const metadata: Metadata = {
  title: { absolute: shopMeta.title },
  alternates: { canonical: '/shopping-cart/' },
};

// The photo cart: HD downloads added in the gallery lightbox (kept in the browser, see cartStore).
export default function ShoppingCartPage() {
  return <ShoppingCart images={getShopImages()} />;
}
