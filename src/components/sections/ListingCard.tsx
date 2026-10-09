'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { DirectoryItem } from '@/content/types';
import type { RowFacts } from './DirectoryRow';
import styles from './ListingCard.module.css';

type Props = {
  card: DirectoryItem;
  /** The card's city, ages, dates and price, read from its tags (see TeamDirectory). */
  facts: RowFacts;
  /** Grid card (image on top) or list row (image on the left). */
  view: 'grid' | 'list';
  onOpen: () => void;
  /** Shown instead when the card's image is missing or fails to load (an API card's built-in image). */
  fallbackImage?: string;
  /** Cards near the top load their image at once rather than when scrolled near. */
  eager?: boolean;
};

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

/**
 * A listing in the new design's results: photo, provider, title, when and where, the ages, and the price with
 * "Learn More" (which opens the listing's full-screen bio, as a click anywhere on the card does).
 */
export default function ListingCard({ card, facts, view, onOpen, fallbackImage, eager }: Props) {
  const [failed, setFailed] = useState(false);
  const src = (failed ? fallbackImage : card.image) || fallbackImage;
  return (
    <article className={`${styles.card} ${view === 'list' ? styles.list : ''}`} onClick={onOpen}>
      <div className={styles.media}>
        {src && (
          <Image
            className={styles.image}
            src={src}
            alt=""
            fill
            sizes={view === 'list' ? '(max-width: 767px) 100vw, 320px' : '(max-width: 480px) 100vw, (max-width: 1100px) 50vw, 320px'}
            loading={eager ? 'eager' : 'lazy'}
            onError={() => fallbackImage && setFailed(true)}
          />
        )}
        <span className={styles.shade} aria-hidden />
      </div>
      <div className={styles.body}>
        {card.subtitle && <span className={styles.provider}>{card.subtitle}</span>}
        <h3 className={styles.title}>{card.title}</h3>
        {(facts.months || facts.city) && (
          <div className={styles.facts}>
            {facts.months && (
              <span className={styles.fact}>
                <CalendarIcon />
                {facts.months}
              </span>
            )}
            {facts.city && (
              <span className={styles.fact}>
                <PinIcon />
                {facts.city}
              </span>
            )}
          </div>
        )}
        {facts.ages && <span className={styles.ages}>{facts.ages}</span>}
        <div className={styles.footer}>
          {facts.price ? <span className={styles.price}>{facts.price}</span> : <span className={styles.noPrice}>Contact for pricing</span>}
          <button
            type="button"
            className={styles.cta}
            aria-haspopup="dialog"
            aria-label={`Learn more: ${[card.subtitle, card.title].filter(Boolean).join(' – ')}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </article>
  );
}
