'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { LuArrowRight, LuCalendar, LuMapPin, LuUsers } from 'react-icons/lu';
import type { DirectoryItem } from '@/content/types';
import styles from './DirectoryRow.module.css';

/** What the row shows besides the card itself, read from its filter tags (see TeamDirectory). */
export type RowFacts = { city?: string; ages?: string; months?: string; price?: string };

type Props = {
  card: DirectoryItem;
  facts: RowFacts;
  onOpen: () => void;
  /** Shown instead when the card's image is missing or fails to load (an API card's built-in image). */
  fallbackImage?: string;
};

/**
 * A directory card in the list view (tenpo.com's event row): image on the left, title and details in the middle,
 * price and "View details" on the right. The whole row opens the card's full-screen bio, as the grid card does.
 */
export default function DirectoryRow({ card, facts, onOpen, fallbackImage }: Props) {
  const [failed, setFailed] = useState(false);
  // Landscape images (photos) fill the thumbnail; square and tall ones (logos, crests) fit whole.
  const [photo, setPhoto] = useState(false);
  const src = (failed ? fallbackImage : card.image) || fallbackImage;
  const details = (
    [
      [<LuMapPin key="city" />, facts.city],
      [<LuUsers key="ages" />, facts.ages],
      [<LuCalendar key="months" />, facts.months],
    ] as [ReactNode, string | undefined][]
  ).flatMap(([icon, text]) => (text ? [{ icon, text }] : []));

  return (
    <div
      className={styles.row}
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
      {/* A logo fits whole over a blurred copy of itself; a photo fills the frame. */}
      <div className={`${styles.media} ${photo ? styles.photo : ''}`}>
        {src && (
          <>
            <Image className={styles.backdrop} src={src} alt="" fill sizes="180px" aria-hidden />
            <Image
              className={styles.image}
              src={src}
              alt=""
              fill
              sizes="(min-width: 640px) 180px, 84px"
              onLoad={(e) => setPhoto(e.currentTarget.naturalWidth >= e.currentTarget.naturalHeight * 1.15)}
              onError={() => fallbackImage && setFailed(true)}
            />
          </>
        )}
      </div>

      <div className={styles.body}>
        {card.subtitle && <div className={styles.meta}>{card.subtitle}</div>}
        <h3 className={styles.title}>{card.title}</h3>
        {card.excerpt && <p className={styles.excerpt}>{card.excerpt}</p>}
        {details.length > 0 && (
          <div className={styles.details}>
            {details.map((d) => (
              <span key={d.text} className={styles.detail}>
                <span className={styles.detailIcon} aria-hidden>
                  {d.icon}
                </span>
                <span className={styles.detailText}>{d.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.aside}>
        {facts.price ? <span className={styles.price}>{facts.price}</span> : <span className={styles.noPrice}>Contact for pricing</span>}
        <span className={styles.cta}>
          View details <LuArrowRight className={styles.ctaArrow} aria-hidden />
        </span>
      </div>
    </div>
  );
}
