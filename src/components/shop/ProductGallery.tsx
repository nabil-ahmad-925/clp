'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos (their own uploads), shown as they are. */

import { useState, type ReactNode } from 'react';
import type { PartnerProduct } from '@/content/partnerPages';
import { site } from '@/content/site';
import ProductLightbox from './ProductLightbox';
import { productPhotos } from './productPhotos';
import g from './productGallery.module.css';
import s from './shop.module.css';

type Props = {
  product: Pick<PartnerProduct, 'title' | 'image' | 'images' | 'backImage'>;
  /** The store's colour, behind a product without photos. */
  color: string;
  /** CLP's own: its logo shows in full on a product without photos. */
  exclusive: boolean;
  /** The tags on the photo (NEW, CLP EXCLUSIVE). */
  tags: ReactNode;
};

/**
 * A product's photos on its page: the thumbnails (the back photo marked Back), the photo shown with View Larger, and
 * Front | Back on it when the store added a back photo.
 */
export default function ProductGallery({ product, color, exclusive, tags }: Props) {
  const { photos, back } = productPhotos(product);
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  // A photo that left (the product changed while open) shows the front.
  const shown = photo < photos.length ? photo : 0;
  const onBack = back >= 0 && shown === back;

  return (
    <div className={s.gallery}>
      <div className={s.thumbs}>
        {(photos.length ? photos : ['']).map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            className={`${s.thumb} ${i === shown ? s.thumbOn : ''}`}
            aria-label={i === back ? 'Back photo' : `Photo ${i + 1}`}
            onClick={() => setPhoto(i)}
            style={{ background: src ? '#EEEEEB' : color }}
          >
            {src && <img src={src} alt="" />}
            {i === back && <span className={g.thumbTag}>Back</span>}
          </button>
        ))}
      </div>
      <div className={s.mainPhoto} style={{ background: photos.length ? '#EEEEEB' : color }}>
        {photos.length > 0 ? (
          <>
            <img src={photos[shown]} alt={onBack ? `${product.title}, back` : product.title} />
            <button type="button" className={s.zoomHit} aria-label="View larger" onClick={() => setZoom(true)} />
            {/* Front | Back once there is a front to go back to (a back photo alone is just its photo). */}
            {back > 0 && (
              <div className={g.sides} role="group" aria-label="Side">
                <button type="button" aria-pressed={!onBack} onClick={() => setPhoto(0)}>
                  Front
                </button>
                <button type="button" aria-pressed={onBack} onClick={() => setPhoto(back)}>
                  Back
                </button>
              </div>
            )}
            <span className={s.zoomTag} aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              View Larger
            </span>
          </>
        ) : (
          <span className={s.tileBlank}>
            <img src={site.logo.light} alt="" style={{ opacity: exclusive ? 1 : 0.35 }} />
          </span>
        )}
        <span className={s.photoTags}>{tags}</span>
      </div>
      {zoom && photos.length > 0 && <ProductLightbox images={photos} start={shown} back={back} title={product.title} onClose={() => setZoom(false)} />}
    </div>
  );
}
