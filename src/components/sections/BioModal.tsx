'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import SocialIcon from '@/components/ui/SocialIcon';
import type { FacilityCard } from '@/content/types';
import type { SocialNetwork } from '@/content/types';
import RichText from '@/components/ui/RichText';
import styles from './BioModal.module.css';

const CLOSE_MS = 820;

type Props = {
  card: FacilityCard & { subtitleTag?: 'h5' };
  onClose: () => void;
  /**
   * "nectar" = the theme's own team-member overlay (sport and service pages);
   * "wps" = the team-directory plugin's popup (directories, /services/<slug>/), styled by the site's custom CSS.
   */
  variant?: 'nectar' | 'wps';
};

/** Swipes shorter than this (px) are taps. */
const SWIPE_PX = 40;
/** The carousel moves on by itself this often (ms), looping, while the overlay is open. */
const AUTOPLAY_MS = 4000;

/**
 * Full-screen bio overlay (Salient "bio fullscreen alt"). Click anywhere (except links and the photo controls) or
 * press Esc to close. Several photos (`bioImages`) show as a carousel: arrows, dots, ←/→ keys and swiping; it also
 * moves on by itself every AUTOPLAY_MS, looping from the last photo to the first, only while the overlay is open.
 */
export default function BioModal({ card, onClose, variant = 'nectar' }: Props) {
  const [visible, setVisible] = useState(false);
  const photos = card.bioImages ?? [];
  const [slide, setSlide] = useState(0);
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const closing = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const many = photos.length > 1;
  const step = useCallback((by: number) => setSlide((s) => (s + by + photos.length) % photos.length), [photos.length]);
  // A swipe over the photo changes it, and the click it ends with doesn't close the overlay.
  const swipeFrom = useRef<number | null>(null);
  const swiped = useRef(false);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setVisible(false);
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.classList.add('menu-open');
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (many && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) step(e.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [close, many, step]);

  // Autoplay: the next photo AUTOPLAY_MS after the current one showed (a manual change restarts the wait). Only while
  // the overlay is open: closing (visible false) or unmounting stops it. Not for visitors who ask for reduced motion.
  useEffect(() => {
    if (!many || !visible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => step(1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [many, visible, slide, step]);

  // Each photo fades in once it has loaded, like the original (all are loaded up front, so the carousel doesn't wait).
  const photosKey = photos.join('|');
  useEffect(() => {
    const images = photosKey
      .split('|')
      .filter(Boolean)
      .map((src) => {
        const img = new Image();
        img.onload = () => setLoaded((prev) => new Set(prev).add(src));
        img.src = src;
        return img;
      });
    return () => images.forEach((img) => (img.onload = null));
  }, [photosKey]);

  return createPortal(
    <div
      ref={dialogRef}
      className={[styles.overlay, variant === 'wps' && styles.wps, visible && styles.open].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.subtitle} – ${card.title}`}
      tabIndex={-1}
      onClick={(e) => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        if (!(e.target as HTMLElement).closest('a, [data-carousel-control]')) close();
      }}
    >
      <div className={styles.innerWrap}>
        <div className={styles.details}>
          <div className={styles.bio}>
            <button type="button" className={styles.mobileClose} aria-label="Close" onClick={close} />
            {card.subtitleTag === 'h5' ? (
              <h5 className={`${styles.title} ${styles.titleH5}`}>{card.subtitle}</h5>
            ) : (
              <div className={styles.title}>{card.subtitle}</div>
            )}
            <h2 className={styles.name}>{card.title}</h2>
            <div className={styles.desc}>
              {card.bioHtml !== undefined ? (
                <>
                  {card.bioHtml && <RichText html={card.bioHtml} className={styles.bioHtml} />}
                  <br />
                  {card.buttons?.map((b, i) => (
                    <Button key={i} href={b.href} newTab={b.newTab} size="regular" color="dark" className={styles.button}>
                      {b.label}
                    </Button>
                  ))}
                </>
              ) : (
                // Paragraphs are separated by a blank line; the button follows the last one (after a line break
                // when the bio is a single paragraph, as on the original).
                card.bio.split('\n\n').map((text, i, paragraphs) => (
                  <p key={i}>
                    {card.bioItalic ? <i>{text}</i> : text}
                    {card.cta && i === paragraphs.length - 1 && (
                      <>
                        {paragraphs.length === 1 && <br />}
                        <Button href={card.cta.href || '#'} newTab={card.cta.newTab} size="regular" color="dark" className={styles.cta}>
                          {card.cta.label}
                        </Button>
                      </>
                    )}
                  </p>
                ))
              )}
              {card.socials.length > 0 && (
                <div className={styles.socials}>
                  {card.socials.map((s, i) =>
                    s.network ? (
                      s.href ? (
                        <a key={i} href={s.href} target="_blank" rel="noopener" aria-label={s.network}>
                          <SocialIcon network={s.network as SocialNetwork} />
                        </a>
                      ) : (
                        <span key={i} className={styles.socialStatic}>
                          <SocialIcon network={s.network as SocialNetwork} />
                        </span>
                      )
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          className={`${styles.picture} ${many ? styles.pictureMany : ''}`}
          {...(many
            ? { role: 'group', 'aria-roledescription': 'carousel', 'aria-label': `Photos of ${card.title}` }
            : { 'aria-hidden': true })}
          onPointerDown={(e) => {
            if (many) swipeFrom.current = e.clientX;
          }}
          onPointerUp={(e) => {
            const from = swipeFrom.current;
            swipeFrom.current = null;
            if (from === null || Math.abs(e.clientX - from) < SWIPE_PX) return;
            swiped.current = true;
            step(e.clientX < from ? 1 : -1);
          }}
        >
          <div className={styles.pictureCover} aria-hidden />
          {photos.length > 0 && (
            <div className={styles.pictureWrap} aria-hidden>
              {photos.map((src, i) => (
                <div
                  key={src}
                  className={[styles.pictureImage, loaded.has(src) && styles.pictureLoaded, i === slide && styles.pictureActive]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ backgroundImage: `url("${src}")` }}
                />
              ))}
            </div>
          )}
          {many && (
            <>
              <button
                type="button"
                className={`${styles.slideBtn} ${styles.slidePrev}`}
                data-carousel-control
                aria-label="Previous photo"
                onClick={() => step(-1)}
              >
                <LuChevronLeft aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.slideBtn} ${styles.slideNext}`}
                data-carousel-control
                aria-label="Next photo"
                onClick={() => step(1)}
              >
                <LuChevronRight aria-hidden />
              </button>
              <div className={styles.slideDots} data-carousel-control>
                {photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={`${styles.slideDot} ${i === slide ? styles.slideDotOn : ''}`}
                    aria-label={`Photo ${i + 1} of ${photos.length}`}
                    aria-current={i === slide ? 'true' : undefined}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
              <span className={styles.slideCount} aria-live="polite">
                {slide + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Round close indicator, pinned to the top-right corner (desktop). The whole overlay closes on click. */}
      <div className={`${styles.closeIndicator} ${visible ? styles.closeVisible : ''}`} aria-hidden>
        <span />
      </div>
    </div>,
    document.body,
  );
}
