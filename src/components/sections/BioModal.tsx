'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

/** Full-screen bio overlay (Salient "bio fullscreen alt"). Click anywhere (except links) or press Esc to close. */
export default function BioModal({ card, onClose, variant = 'nectar' }: Props) {
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const closing = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [close]);

  // Fade the photo in once it has loaded, like the original.
  useEffect(() => {
    if (!card.bioImage) return;
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = card.bioImage;
    return () => {
      img.onload = null;
    };
  }, [card.bioImage]);

  return createPortal(
    <div
      ref={dialogRef}
      className={[styles.overlay, variant === 'wps' && styles.wps, visible && styles.open].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.subtitle} – ${card.title}`}
      tabIndex={-1}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('a')) close();
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
                <p>
                  {card.bio}
                  {card.cta && (
                    <>
                      <br />
                      <Button href={card.cta.href || '#'} newTab={card.cta.newTab} size="regular" color="dark" className={styles.cta}>
                        {card.cta.label}
                      </Button>
                    </>
                  )}
                </p>
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
        <div className={styles.picture} aria-hidden>
          <div className={styles.pictureCover} />
          {card.bioImage && (
            <div className={styles.pictureWrap}>
              <div
                className={`${styles.pictureImage} ${imageLoaded ? styles.pictureLoaded : ''}`}
                style={{ backgroundImage: `url("${card.bioImage}")` }}
              />
            </div>
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
