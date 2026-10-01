'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FaAngleDown, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import {
  FaArrowRight,
  FaCartShopping,
  FaCircleInfo,
  FaPause,
  FaPlay,
  FaSquareFacebook,
  FaSquarePinterest,
  FaSquareXTwitter,
  FaXmark,
} from 'react-icons/fa6';
import { SITE_URL } from '@/content/site';
import type { GalleryImage } from '@/content/types';
import { money, readCart, writeCart } from '@/components/cart/cartStore';
import styles from './GalleryLightbox.module.css';

type Props = {
  galleryId: string;
  images: GalleryImage[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
};

const SLIDESHOW_MS = 5000;
/** The original sells some photos as an HD digital download (`image.download` is its price). */
const DOWNLOAD_LABEL = 'HD';

/**
 * Full-screen photo viewer (NextGEN Pro Lightbox, white variant): the photo fitted above a strip of gold
 * play / info / cart buttons and thumbnails. Arrow keys and the side arrows step through the gallery,
 * Esc or × closes, the tab above the strip hides it, "info" shows the caption with share links and
 * "cart" opens the digital-download sidebar.
 */
export default function GalleryLightbox({ galleryId, images, index, onIndex, onClose }: Props) {
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(false);
  const [docked, setDocked] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [updated, setUpdated] = useState(false);
  const touchX = useRef<number | null>(null);
  const image = images[index];
  const count = images.length;

  const go = (step: number) => onIndex((index + step + count) % count);
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the cart lives in localStorage
    setCart(readCart());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goRef.current(1);
      if (e.key === 'ArrowLeft') goRef.current(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => goRef.current(1), SLIDESHOW_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index]);

  // The download choice is per photo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the photo changes
    setSelected(false);
    setUpdated(false);
  }, [index]);

  const pageUrl = typeof window === 'undefined' ? SITE_URL : window.location.origin + window.location.pathname;
  const shareUrl = `${pageUrl}#gallery/${galleryId}/${image.id}`;
  const imageUrl = typeof window === 'undefined' ? image.full : window.location.origin + image.full;
  const price = image.download;
  const inCart = cart.includes(image.id) ? 1 : 0;
  const pending = price ? Math.max(inCart, selected ? 1 : 0) : 0;

  const addToCart = () => {
    if (!selected || !price) return;
    const next = [...new Set([...cart, image.id])];
    setCart(next);
    setSelected(false);
    setUpdated(true);
    writeCart(next);
  };

  return createPortal(
    <div
      className={[styles.wrapper, cartOpen && styles.withCart, !docked && styles.undocked].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
    >
      <div className={styles.content}>
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
          <button type="button" className={`${styles.nav} ${styles.prev}`} aria-label="Previous photo" onClick={() => go(-1)}>
            <FaAngleLeft />
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} aria-label="Next photo" onClick={() => go(1)}>
            <FaAngleRight />
          </button>
        </div>

        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <FaXmark />
        </button>

        <div className={`${styles.info} ${info ? styles.infoOpen : ''}`} aria-hidden={!info}>
          <div className={styles.infoTitle}>{image.title}</div>
          <ul className={styles.share}>
            <li>
              <a href={`https://twitter.com/share?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on Twitter" tabIndex={info ? 0 : -1}>
                <FaSquareXTwitter />
              </a>
            </li>
            <li>
              <a href={`https://www.facebook.com/share.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on Facebook" tabIndex={info ? 0 : -1}>
                <FaSquareFacebook />
              </a>
            </li>
            <li>
              <a
                href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(imageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Pinterest"
                tabIndex={info ? 0 : -1}
              >
                <FaSquarePinterest />
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.dock}>
          <button type="button" className={styles.dockToggle} aria-label={docked ? 'Hide thumbnails' : 'Show thumbnails'} onClick={() => setDocked(!docked)}>
            <FaAngleDown />
          </button>
          <div className={styles.buttons}>
            <button type="button" title="Play / Pause" aria-pressed={playing} onClick={() => setPlaying(!playing)}>
              {playing ? <FaPause /> : <FaPlay />}
            </button>
            <button type="button" title="Toggle image info" aria-pressed={info} onClick={() => setInfo(!info)}>
              <FaCircleInfo />
            </button>
            <button type="button" title="Toggle cart sidebar" aria-pressed={cartOpen} onClick={() => setCartOpen(!cartOpen)}>
              <FaCartShopping />
            </button>
          </div>
          <div className={styles.thumbs}>
            {images.map((thumb, i) => (
              <button
                key={thumb.id}
                type="button"
                className={`${styles.thumb} ${i === index ? styles.active : ''}`}
                aria-label={`Photo ${i + 1} of ${count}`}
                aria-current={i === index}
                onClick={() => onIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the original thumbnail file */}
                <img src={thumb.thumb} alt="" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {cartOpen && (
        <aside className={styles.cart} aria-label="Add to cart">
          <button type="button" className={styles.cartToggle} aria-label="Close cart" onClick={() => setCartOpen(false)}>
            <FaArrowRight />
          </button>
          <h3 className={styles.cartTitle}>Add to cart</h3>
          <div className={styles.cartSummary}>
            <span>{pending} item(s)</span>
            <span>{money(pending * (price ?? 0))}</span>
          </div>
          {/* Photos without a price list have nothing for sale: only the header and the buttons show. */}
          {price !== undefined && (
            <>
              <div className={styles.cartTabs}>
                <span className={styles.cartTab}>Digital downloads</span>
              </div>
              <h4 className={styles.cartHeading}>Digital Downloads</h4>
              <table className={styles.cartTable}>
                <thead>
                  <tr>
                    <th>Quantity</th>
                    <th>Description</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <button type="button" className={`${styles.pill} ${selected || inCart ? styles.pillOn : ''}`} aria-pressed={selected} onClick={() => setSelected(!selected)}>
                        Add
                      </button>
                    </td>
                    <td>{DOWNLOAD_LABEL}</td>
                    <td>{money(price)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          {updated && <p className={styles.cartNotice}>Your cart has been updated</p>}
          <div className={styles.cartFooter}>
            <button type="button" className={styles.bigPill} onClick={addToCart}>
              Add to cart
            </button>
            <Link className={styles.bigPill} href="/shopping-cart/">
              View cart / checkout
            </Link>
          </div>
        </aside>
      )}
    </div>,
    document.body,
  );
}
