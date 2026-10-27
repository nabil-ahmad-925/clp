'use client';
/* eslint-disable @next/next/no-img-element -- CLP's own photos of a catalog item (admin uploads), shown as they are. */

import type { WsItem } from '@/content/wholesale';
import p from './wsPhotos.module.css';

/** All its photos: CLP's front ones, then the back. */
const allOf = (item: WsItem) => (item.backPhoto ? [...item.photos, item.backPhoto] : item.photos);

/**
 * The item page's large photo while one of its photos is picked: over the mockup, never in place of it (a quote
 * request sends the mockup with the logo).
 */
export function LargePhoto({ item, index }: { item: WsItem; index: number }) {
  const src = allOf(item)[index];
  if (!src) return null;
  return <img src={src} alt={`${item.name}, photo ${index + 1}`} className={`${p.fill} ${p.over}`} />;
}

/**
 * The item's photos under the mockup on its page (none: nothing). Picking one shows it large; picking a print spot
 * goes back to the mockup.
 */
export function PhotoStrip({ item, picked, onPick }: { item: WsItem; picked: number; onPick: (index: number) => void }) {
  const all = allOf(item);
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
