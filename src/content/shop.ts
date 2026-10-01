import 'server-only';
import type { GalleryImage } from './types';
import { getPhotoPage, photoPaths } from './photos';

/** A photo the original sells as an HD digital download, as the cart shows it. */
export type ShopImage = Pick<GalleryImage, 'id' | 'src' | 'full' | 'title' | 'width' | 'height'> & { price: number };

export const shopMeta = { title: 'Shopping Cart - Compete Like Pros™', description: '' };

/** Every for-sale photo in the galleries, by id (the cart stores only ids). */
export function getShopImages(): Record<string, ShopImage> {
  const images: Record<string, ShopImage> = {};
  for (const path of photoPaths) {
    for (const row of getPhotoPage(path)?.rows ?? []) {
      for (const column of row.columns) {
        for (const block of column.blocks) {
          if (block.type !== 'gallery') continue;
          for (const { id, src, full, title, width, height, download } of block.images) {
            if (download !== undefined) images[id] = { id, src, full, title, width, height, price: download };
          }
        }
      }
    }
  }
  return images;
}
