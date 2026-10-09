'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SITE_URL } from '@/content/site';
import type { GalleryImage } from '@/content/types';
import { money, readCart, writeCart } from '@/components/cart/cartStore';
import styles from './GalleryLightbox.module.css';

type Props = {
  galleryId: string;
  /** The album's name (the side panel's label). */
  albumTitle: string;
  images: GalleryImage[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
};

const Arrow = ({ back }: { back?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {back ? <path d="M19 12H5M11 18l-6-6 6-6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
  </svg>
);

/**
 * The photo viewer (new design): the photo on black with the previous / next arrows, the count and a strip of
 * thumbnails; beside it a white panel with the album, the photo's number, its HD download (when the photo has one for
 * sale: it goes in the site's cart) and share links. Arrow keys and swipes step through the album, Esc or × closes it.
 */
export default function GalleryLightbox({ galleryId, albumTitle, images, index, onIndex, onClose }: Props) {
  const [cart, setCart] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const touchX = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const image = images[index];
  const count = images.length;

  const go = (step: number) => onIndex((index + step + count) % count);
  const goRef = useRef(go);
  const closeRef = useRef(onClose);
  useEffect(() => {
    goRef.current = go;
    closeRef.current = onClose;
  });

  // Scroll locked behind it; keys step and close; the cart lives in localStorage.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the cart lives in localStorage
    setCart(readCart());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'ArrowRight') goRef.current(1);
      if (e.key === 'ArrowLeft') goRef.current(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // The current thumbnail stays in view; "Added" is per photo.
  useEffect(() => {
    strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the photo changes
    setAdded(false);
  }, [index]);

  const pageUrl = typeof window === 'undefined' ? SITE_URL : window.location.origin + window.location.pathname;
  const shareUrl = encodeURIComponent(`${pageUrl}#gallery/${galleryId}/${image.id}`);
  const imageUrl = encodeURIComponent(typeof window === 'undefined' ? image.full : window.location.origin + image.full);
  const price = image.download;
  const inCart = cart.includes(image.id);
  const addToCart = () => {
    if (price === undefined || inCart) return;
    const next = [...new Set([...cart, image.id])];
    setCart(next);
    writeCart(next);
    setAdded(true);
  };

  return createPortal(
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${albumTitle}: photo ${index + 1} of ${count}`}>
      <div className={styles.main}>
        <div
          className={styles.stage}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the full-size original */}
          <img key={image.id} className={styles.image} src={image.full} alt={image.alt} />
          {count > 1 && (
            <>
              <button type="button" className={`${styles.round} ${styles.prev}`} aria-label="Previous photo" onClick={() => go(-1)}>
                <Arrow back />
              </button>
              <button type="button" className={`${styles.round} ${styles.next}`} aria-label="Next photo" onClick={() => go(1)}>
                <Arrow />
              </button>
            </>
          )}
          <button type="button" className={`${styles.round} ${styles.close}`} aria-label="Close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
          <span className={styles.counter}>
            {index + 1} / {count}
          </span>
        </div>
        <div ref={strip} className={styles.thumbs}>
          {images.map((thumb, i) => (
            <button
              key={thumb.id}
              type="button"
              className={`${styles.thumb} ${i === index ? styles.thumbOn : ''}`}
              aria-label={`Photo ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => onIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the original thumbnail file */}
              <img src={thumb.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.side}>
        <div className={styles.sideHead}>
          <span className={styles.kicker}>{albumTitle.toUpperCase()}</span>
          <span className={styles.photoTitle}>Photo {index + 1}</span>
          <span className={styles.by}>Photographed by Compete Like Pros</span>
        </div>

        <div className={styles.sideBody}>
          {price !== undefined && (
            <div className={styles.buy}>
              <span className={styles.label}>DIGITAL DOWNLOAD</span>
              <div className={styles.option}>
                <span className={styles.optionText}>
                  <strong>HD download</strong>
                  <span>Full-resolution file for personal use</span>
                </span>
                <strong>{money(price)}</strong>
              </div>
              <button type="button" className={styles.primary} disabled={inCart} onClick={addToCart}>
                {inCart ? 'In your cart' : `Add to cart · ${money(price)}`}
              </button>
              {(added || inCart) && (
                <div className={styles.added} role="status">
                  {added ? 'Added to cart.' : 'This photo is in your cart.'} <Link href="/shopping-cart/">View cart ({cart.length})</Link>
                </div>
              )}
            </div>
          )}

          <div className={styles.share}>
            <span className={styles.label}>SHARE</span>
            <div className={styles.shareLinks}>
              <a href={`https://twitter.com/share?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z" />
                </svg>
              </a>
              <a href={`https://www.facebook.com/share.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M13.5 22v-8.4h2.8l.5-3.4h-3.3V8.1c0-1 .3-1.7 1.7-1.7h1.8V3.3c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.5H7.1v3.4H10V22z" />
                </svg>
              </a>
              <a href={`https://pinterest.com/pin/create/button/?url=${shareUrl}&media=${imageUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Pinterest">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.6 0 1-.6 2.4-.9 3.7-.3 1.1.6 2 1.7 2 2 0 3.5-2.1 3.5-5.2 0-2.7-2-4.6-4.8-4.6-3.3 0-5.2 2.5-5.2 5 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.3c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.7 2.7-7.2 7.9-7.2 4.1 0 7.3 2.9 7.3 6.9 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.6-2.7-1.4l-.7 2.8c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
