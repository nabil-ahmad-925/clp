'use client';
/* eslint-disable @next/next/no-img-element -- store photos from CLP's media, shown as they are */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import s from './shop.module.css';

/** A product's photos full screen ("View Larger"): arrows and keys step through them, the back photo says so. */
export default function ProductLightbox({ images, start, back = -1, title, onClose }: { images: string[]; start: number; back?: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const step = (d: number) => setI((n) => (n + d + images.length) % images.length);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') stepRef.current(-1);
      if (e.key === 'ArrowRight') stepRef.current(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={s.lightbox} role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className={s.lbHead}>
        <span>
          {i + 1} / {images.length} · {title}
          {i === back ? ' · Back' : ''}
        </span>
        <button type="button" className={s.lbClose} aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className={s.lbStage}>
        <button type="button" className={s.lbStep} aria-label="Previous image" onClick={() => step(-1)} disabled={images.length < 2}>
          ‹
        </button>
        <div className={s.lbImage}>
          <img src={images[i]} alt={i === back ? `${title}, back` : title} />
        </div>
        <button type="button" className={s.lbStep} aria-label="Next image" onClick={() => step(1)} disabled={images.length < 2}>
          ›
        </button>
      </div>
      <div className={s.lbThumbs}>
        {images.map((src, n) => (
          <button key={`${src}-${n}`} type="button" className={`${s.lbThumb} ${n === i ? s.lbThumbOn : ''}`} aria-label={n === back ? 'Back photo' : `Photo ${n + 1}`} onClick={() => setI(n)}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
