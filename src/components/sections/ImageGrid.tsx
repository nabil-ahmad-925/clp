'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { GridImage } from '@/content/types';
import styles from './ImageGrid.module.css';

/**
 * Salient image grid (WPBakery "image grid" gallery): cropped thumbnails that darken and zoom on hover and open
 * the full-size photo in the theme's lightbox (Magnific Popup) with previous / next arrows and an "N of M" counter.
 */
export default function ImageGrid({ images, columns = 4, gutter = 15 }: { images: GridImage[]; columns?: number; gutter?: number }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={styles.grid} style={{ '--grid-cols': columns, '--grid-gutter': `${gutter}px` } as CSSProperties}>
      {images.map((image, i) => (
        <div key={i} className={styles.col}>
          <a
            className={styles.item}
            href={image.full}
            onClick={(e) => {
              e.preventDefault();
              setOpen(i);
            }}
            aria-label={image.alt || `Photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the original 600×400 crop */}
            <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" />
            <span className={styles.overlay} aria-hidden />
          </a>
        </div>
      ))}
      {open !== null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Lightbox({ images, index, onIndex, onClose }: { images: GridImage[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const count = images.length;
  const go = useCallback((step: number) => onIndex((index + step + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  const image = images[index];
  return createPortal(
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={image.alt || 'Photo'}>
      <div className={styles.bg} onClick={onClose} />
      <div className={styles.container} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <figure className={styles.figure}>
          <button type="button" className={styles.close} title="Close (Esc)" aria-label="Close" onClick={onClose}>
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- the full-size original */}
          <img key={index} className={styles.image} src={image.full} alt={image.alt} />
          <figcaption className={styles.counter}>
            {index + 1} of {count}
          </figcaption>
        </figure>
      </div>
      {count > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} title="Previous (Left arrow key)" aria-label="Previous photo" onClick={() => go(-1)} />
          <button type="button" className={`${styles.arrow} ${styles.next}`} title="Next (Right arrow key)" aria-label="Next photo" onClick={() => go(1)} />
        </>
      )}
    </div>,
    document.body,
  );
}
