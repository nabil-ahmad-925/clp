'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { DirectoryItem, Provider } from '@/content/types';
import type { RowFacts } from './DirectoryRow';
import styles from './ListingCard.module.css';

type Props = {
  card: DirectoryItem;
  /** The card's city, ages, dates and price, read from its tags (see TeamDirectory). */
  facts: RowFacts;
  /** Grid card (image on top) or list row (image on the left). */
  view: 'grid' | 'list';
  /**
   * "listing": an Experiences or Resources card (price and "Learn More" side by side); "facility": the facilities'
   * card (Volunteering & Open Play design: the price, a row of chips and a full-width "Learn More").
   */
  variant?: 'listing' | 'facility';
  onOpen: () => void;
  /** "Book Now" (CLP Partner and Compete Like Pros listings): opens the booking popup instead of "Learn More". */
  onBook?: () => void;
  /** "Claim this listing" (Community listings): opens the claim form (else the partnerships page). */
  onClaim?: () => void;
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

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** A provider's label on a card's photo; CLP's and its partners' are verified (gold, with a check). */
const BADGES: Record<Provider, { label: string; className: string; verified?: boolean }> = {
  partner: { label: 'CLP PARTNER', className: styles.badgePartner, verified: true },
  clp: { label: 'COMPETE LIKE PROS', className: styles.badgePartner, verified: true },
  sponsored: { label: 'SPONSORED', className: styles.badgeSponsored },
  community: { label: 'COMMUNITY', className: styles.badgeCommunity },
};

/** Where a program claims its community listing: the partnerships page. */
const CLAIM_HREF = '/partnerships/';

/** The provider's label on a card's photo (none on built-in cards). */
function ProviderBadge({ provider }: { provider?: Provider }) {
  const badge = provider && BADGES[provider];
  if (!badge) return null;
  return (
    <span className={`${styles.badge} ${badge.className}`}>
      {badge.verified && <CheckIcon />}
      {badge.label}
    </span>
  );
}

/**
 * A listing in the new design's results: photo, provider, title, when and where, the ages, and the price with
 * "Learn More" (which opens the listing's full-screen bio, as a click anywhere on the card does).
 */
export default function ListingCard({ card, facts, view, variant = 'listing', onOpen, onBook, onClaim, fallbackImage, eager }: Props) {
  const [failed, setFailed] = useState(false);
  const src = (failed ? fallbackImage : card.image) || fallbackImage;
  const facility = variant === 'facility';
  // Facilities: the ages and the access options (Open Access, Members Only…), three at most.
  const chips = [facts.ages, ...(facts.access ?? [])].filter((c): c is string => Boolean(c)).slice(0, 3);
  // CLP's and its partners' listings are booked on CLP; the others' details link out.
  const book = Boolean(onBook) && (card.provider === 'partner' || card.provider === 'clp');
  const ctaLabel = book ? 'Book Now' : 'Learn More';
  const learnMore = (
    <button
      type="button"
      className={`${styles.cta} ${facility ? styles.ctaWide : ''}`}
      aria-haspopup="dialog"
      aria-label={`${ctaLabel}: ${[card.subtitle, card.title].filter(Boolean).join(' – ')}`}
      onClick={(e) => {
        e.stopPropagation();
        if (book) onBook!();
        else onOpen();
      }}
    >
      {ctaLabel}
    </button>
  );
  return (
    <article
      className={[styles.card, view === 'list' && styles.list, (card.provider === 'partner' || card.provider === 'clp') && styles.verified].filter(Boolean).join(' ')}
      onClick={onOpen}
    >
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
        <ProviderBadge provider={card.provider} />
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
        {facility ? (
          <>
            {facts.price && <span className={styles.bigPrice}>{facts.price}</span>}
            <div className={styles.facilityFooter}>
              {chips.length > 0 && (
                <span className={styles.chips}>
                  {chips.map((c) => (
                    <span key={c} className={styles.chip}>
                      {c}
                    </span>
                  ))}
                </span>
              )}
              {learnMore}
            </div>
          </>
        ) : (
          <>
            {facts.ages && <span className={styles.ages}>{facts.ages}</span>}
            <div className={styles.footer}>
              {facts.price ? <span className={styles.price}>{facts.price}</span> : <span className={styles.noPrice}>Contact for pricing</span>}
              {learnMore}
            </div>
          </>
        )}
        {card.provider === 'community' && (
          <span className={styles.claim}>
            From public info ·{' '}
            {onClaim ? (
              <button
                type="button"
                className={styles.claimLink}
                aria-haspopup="dialog"
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim();
                }}
              >
                Claim This Listing
              </button>
            ) : (
              <Link href={CLAIM_HREF} onClick={(e) => e.stopPropagation()}>
                Claim This Listing
              </Link>
            )}
          </span>
        )}
      </div>
    </article>
  );
}

type StripProps = {
  items: DirectoryItem[];
  /** A listing's city, ages, dates and price (see TeamDirectory). */
  factsOf: (item: DirectoryItem) => RowFacts;
  onOpen: (item: DirectoryItem) => void;
};

/**
 * Sponsored placements above a listing page's results (the new design's strip): two wide photo cards with the
 * Sponsored label, provider, title, when and where, and "Learn More" (which opens the listing's bio).
 */
export function SponsoredStrip({ items, factsOf, onOpen }: StripProps) {
  return (
    <div className={styles.strip}>
      {items.map((item, i) => {
        const facts = factsOf(item);
        const when = [facts.months, facts.city].filter(Boolean).join(' · ');
        return (
          <button
            key={item.id}
            type="button"
            className={styles.stripCard}
            aria-haspopup="dialog"
            aria-label={`Sponsored: ${[item.subtitle, item.title].filter(Boolean).join(' – ')}`}
            onClick={() => onOpen(item)}
          >
            {item.image && (
              <Image className={styles.stripImage} src={item.image} alt="" fill sizes="(max-width: 767px) 100vw, 660px" priority={i === 0} />
            )}
            <span className={styles.stripBody}>
              <span className={`${styles.badge} ${styles.badgeStrip}`}>SPONSORED</span>
              {item.subtitle && <span className={styles.stripProvider}>{item.subtitle}</span>}
              <span className={styles.stripTitle}>{item.title}</span>
              <span className={styles.stripFoot}>
                <span>{when}</span>
                <span className={styles.stripCta}>Learn More</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
