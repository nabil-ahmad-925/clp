import type { PartnerProduct } from '@/content/partnerPages';

/**
 * A product's photos in the order its page shows them: its own (the first is the front), then its back photo when it
 * has one (`back`: its place, -1 without). A back photo that is also one of the others is shown once, where it is.
 */
export function productPhotos(product: Pick<PartnerProduct, 'image' | 'images' | 'backImage'>): { photos: string[]; back: number } {
  const photos = product.images.length ? [...product.images] : product.image ? [product.image] : [];
  const backImage = product.backImage ?? '';
  if (!backImage) return { photos, back: -1 };
  const at = photos.indexOf(backImage);
  if (at > 0) return { photos, back: at };
  // The same photo as the front can't be its back too: shown once, as the front.
  if (at === 0) return { photos, back: -1 };
  return { photos: [...photos, backImage], back: photos.length };
}
