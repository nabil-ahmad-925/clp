'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { dollars } from '@/content/gallery';
import { onGalleryCart, readGalleryCart, removeFromGalleryCart, type GalleryCartItem } from '@/components/cart/galleryCart';
import styles from './GalleryCart.module.css';

/** The photo pages' cart drawer (new design): downloads and prints added from the viewer, with their total. */
export default function GalleryCart({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<GalleryCartItem[]>([]);
  useEffect(() => {
    const load = () => setItems(readGalleryCart());
    load();
    const off = onGalleryCart(load);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      off();
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const total = items.reduce((n, i) => n + i.price, 0);
  const prints = items.some((i) => i.kind === 'print');

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Cart">
        <div className={styles.head}>
          <span className={styles.title}>Your cart ({items.length})</span>
          <button type="button" className={styles.close} aria-label="Close cart" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          {items.length === 0 ? (
            <p className={styles.empty}>Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.key} className={styles.item}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the photo's thumbnail */}
                <img className={styles.thumb} src={item.src} alt="" />
                <span className={styles.info}>
                  <strong>{item.name}</strong>
                  <span className={styles.detail}>{item.detail}</span>
                  <span className={styles.price}>{dollars(item.price)}</span>
                </span>
                <button type="button" className={styles.remove} onClick={() => removeFromGalleryCart(item.key)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        <div className={styles.foot}>
          {items.length > 0 && (
            <span className={styles.total}>
              Total<strong>{dollars(total)}</strong>
            </span>
          )}
          {prints && <span className={styles.note}>Products ship separately from each print partner.</span>}
          <Link href="/shopping-cart/" className={`${styles.checkout} ${items.length ? '' : styles.disabled}`} aria-disabled={!items.length} onClick={(e) => !items.length && e.preventDefault()}>
            Checkout
          </Link>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
