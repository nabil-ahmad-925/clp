/* eslint-disable @next/next/no-img-element -- the partner's photos are their own uploads (the media bucket), shown as they are. */
'use client';

import { useEffect, useRef } from 'react';
import { Overlay } from '../page/Overlay';
import type { PagePhoto } from './photos';
import v from './photoViewer.module.css';

type Props = { photos: { photo: PagePhoto; title: string }[]; index: number; onIndex: (i: number) => void; onClose: () => void };

const Arrow = ({ back }: { back?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {back ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

/**
 * A partner photo large: its caption, "3 of 12", the previous and next ones (arrows, ← → keys), Escape closes. Focus
 * moves into it on opening (so Enter can't reopen the card behind) and back to the card that opened it on closing.
 */
export default function PhotoViewer({ photos, index, onIndex, onClose }: Props) {
  const count = photos.length;
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, []);
  const step = (by: number) => onIndex((index + by + count) % count);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
      if (e.key === 'ArrowRight') onIndex((index + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onIndex]);
  const { photo, title } = photos[index];
  return (
    <Overlay onClose={onClose} bare dark>
      <div className={v.viewer} role="dialog" aria-modal="true" aria-label={title}>
        <div className={v.head}>
          <span className={v.title}>
            <strong>{title}</strong>
            <span>
              {index + 1} of {count}
            </span>
          </span>
          <button ref={closeRef} type="button" className={v.close} aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={v.stage}>
          {count > 1 && (
            <button type="button" className={`${v.arrow} ${v.prev}`} aria-label="Previous Photo" onClick={() => step(-1)}>
              <Arrow back />
            </button>
          )}
          <img src={photo.src} alt={photo.caption} className={v.image} />
          {count > 1 && (
            <button type="button" className={`${v.arrow} ${v.next}`} aria-label="Next Photo" onClick={() => step(1)}>
              <Arrow />
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}
