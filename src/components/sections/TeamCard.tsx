'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { FacilityCard } from '@/content/types';
import styles from './TeamCard.module.css';

type Props = {
  card: FacilityCard;
  onOpen: () => void;
  /** "nectar" = the theme's team member (sport/service pages); "wps" = the team-directory plugin's card. */
  variant?: 'nectar' | 'wps';
  className?: string;
  /** Shown instead when the card's image is missing or fails to load (an API card's built-in image). */
  fallbackImage?: string;
};

/** Photo card (Salient "bio fullscreen alt" team member): gradient overlay, title block that lifts on hover. */
export default function TeamCard({ card, onOpen, variant = 'nectar', className, fallbackImage }: Props) {
  const [failed, setFailed] = useState(false);
  const src = (failed ? fallbackImage : card.image) || fallbackImage;
  return (
    <div
      className={[styles.card, variant === 'wps' && styles.wps, className].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={[card.subtitle, card.title].filter(Boolean).join(' – ')}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={styles.image}>
        {src && (
          <Image
            src={src}
            width={518}
            height={633}
            alt=""
            sizes="(max-width: 999px) 88vw, 300px"
            onError={() => fallbackImage && setFailed(true)}
          />
        )}
      </div>
      <div className={styles.meta}>
        <h5>{card.subtitle}</h5>
        <h3>{variant === 'wps' ? <span>{card.title}</span> : card.title}</h3>
        <p>{card.excerpt}</p>
      </div>
    </div>
  );
}
