'use client';
/* eslint-disable @next/next/no-img-element -- CLP's own photos of a catalog item (admin uploads), shown as they are. */

import type { WsItem } from '@/content/wholesale';
import { colorPhotoOf } from '@/content/wsStock';
import p from './wsPhotos.module.css';

/**
 * All its photos: the picked color's photo first (when CLP set one), then CLP's website photos in order, then the
 * back. A color photo that's also a website photo isn't shown twice.
 */
export const photosFor = (item: WsItem, color = '') => {
  const lead = colorPhotoOf(item, color);
  const rest = item.backPhoto ? [...item.photos, item.backPhoto] : item.photos;
  return lead ? [lead, ...rest.filter((u) => u !== lead)] : rest;
};

/**
 * The item page's large photo while one of its photos is picked: over the mockup, never in place of it (a quote
 * request sends the mockup with the logo).
 */
export function LargePhoto({ item, index, color }: { item: WsItem; index: number; color?: string }) {
  const src = photosFor(item, color)[index];
  if (!src) return null;
  return <img src={src} alt={`${item.name}, photo ${index + 1}`} className={`${p.fill} ${p.over}`} />;
}

/**
 * The item's photos under the mockup on its page (none: nothing). Picking one shows it large; picking a print spot
 * goes back to the mockup.
 */
export function PhotoStrip({ item, picked, onPick, color }: { item: WsItem; picked: number; onPick: (index: number) => void; color?: string }) {
  const all = photosFor(item, color);
  if (!all.length) return null;
  return (
    <div className={p.strip} role="group" aria-label="Product photos">
      {all.map((src, i) => (
        <button key={`${i}-${src}`} type="button" className={p.thumb} aria-pressed={picked === i} aria-label={`Show photo ${i + 1}`} onClick={() => onPick(i)}>
          <img src={src} alt="" className={p.fill} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
