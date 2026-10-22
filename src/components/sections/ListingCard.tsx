'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { agePolicy, cornerTagLabel, isBookable, waitlistPageHref, type SavedPlace } from '@/content/listings';
import { DEFAULT_CARD_BUTTON } from '@/content/requests';
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
   * "listing": an Experiences, Resources or Services listing (no price: "Contact for pricing"); "facility": a sport's
   * facility (no price: none shown). Both are the facilities' card in grid view (Volunteering & Open Play design: the
   * price, a row of chips and a full-width "Learn More") and the Experiences row in list view.
   */
  variant?: 'listing' | 'facility';
  onOpen: () => void;
  /** "Book Now" (listings booked on CLP, see isBookable): opens the booking popup instead of "Learn More". */
  onBook?: () => void;
  /** A service's "Start a New Project" (its card button, see DirectoryItem cardButton): opens the project form. */
  onProject?: () => void;
  /** A government facility's "Permit Now": opens the permit request form. */
  onPermit?: () => void;
  /** "Claim this listing" (Community listings): opens the claim form (else the partnerships page). */
  onClaim?: () => void;
  /** Sold out with its waitlist open (how many wait): "Join Waitlist" (opens `onWaitlist`) instead of Book Now. */
  soldOut?: { waiting: number };
  onWaitlist?: () => void;
  /** This device's place in its waitlist: the card says so and links to it. */
  place?: SavedPlace;
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
export default function ListingCard({ card, facts, view, variant = 'listing', onOpen, onBook, onProject, onPermit, onClaim, soldOut, onWaitlist, place, fallbackImage, eager }: Props) {
  const [failed, setFailed] = useState(false);
  const src = (failed ? fallbackImage : card.image) || fallbackImage;
  const facility = view === 'grid';
  // The ages and the access options (Open Access, Members Only…), three at most: chips on a card, pills on a row.
  const chips = [facts.ages, ...(facts.access ?? [])].filter((c): c is string => Boolean(c)).slice(0, 3);
  // The listing's rating (its reviews' average), beside the ages, as a partner card shows one. Every card but a
  // facility's has it: only CLP Partners' listings collect reviews (a checked-in booking's), so the others say so.
  const reviews = card.reviewCount ?? 0;
  const rating =
    variant === 'facility' ? null : card.rating != null && reviews > 0 ? (
      <span className={styles.rating}>
        <span className={styles.star} aria-hidden>
          ★
        </span>
        {card.rating.toFixed(1)}{' '}
        <span className={styles.reviews}>
          ({reviews} {reviews === 1 ? 'review' : 'reviews'})
        </span>
      </span>
    ) : (
      <span className={`${styles.rating} ${styles.fresh}`}>No reviews yet</span>
    );
  // The ages first, the rating next to them, then the access options.
  const withRating = (render: (c: string) => ReactNode) =>
    chips.length === 0 ? (
      rating
    ) : (
      <>
        {facts.ages && render(chips[0])}
        {rating}
        {chips.slice(facts.ages ? 1 : 0).map(render)}
      </>
    );
  const price = facts.price ? (
    <>
      {facts.price}
      {facts.unit && <span className={styles.unit}> / {facts.unit}</span>}
    </>
  ) : undefined;
  const noPrice = variant === 'listing' && <span className={styles.noPrice}>Contact for pricing</span>;
  // One button, whatever the listing: a government facility's "Permit Now" (its permit request form); "Book Now" on
  // what is booked on CLP (CLP's and its partners' listings, every other facility); a service's own button (its
  // project form, or its details, with the text CLP gave it); else "Learn More" (its details).
  const permit = variant === 'facility' && Boolean(card.government) && Boolean(onPermit);
  const book = Boolean(onBook) && isBookable(card);
  const serviceButton = card.listingType === 'services' ? (card.cardButton ?? DEFAULT_CARD_BUTTON) : undefined;
  const project = serviceButton?.action === 'project' && Boolean(onProject);
  // Sold out with a waitlist: join it (or, once joined, see the place in line).
  const waitlist = book && Boolean(soldOut) && Boolean(onWaitlist);
  const ctaLabel = permit ? 'Permit Now' : book ? 'Book Now' : serviceButton && (project || serviceButton.action === 'details') ? serviceButton.label : 'Learn More';
  const named = [card.subtitle, card.title].filter(Boolean).join(' – ');
  const learnMore = waitlist ? (
    place ? (
      <Link
        href={waitlistPageHref(place.id, place.token)}
        className={`${styles.cta} ${styles.ctaWait} ${facility ? styles.ctaWide : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        On the waitlist ✓
      </Link>
    ) : (
      <button
        type="button"
        className={`${styles.cta} ${styles.ctaWait} ${facility ? styles.ctaWide : ''}`}
        aria-haspopup="dialog"
        aria-label={`Join Waitlist: ${[card.subtitle, card.title].filter(Boolean).join(' – ')}`}
        onClick={(e) => {
          e.stopPropagation();
          onWaitlist!();
        }}
      >
        Join Waitlist
      </button>
    )
  ) : (
    <button
      type="button"
      className={`${styles.cta} ${facility ? styles.ctaWide : ''}`}
      aria-haspopup="dialog"
      aria-label={`${ctaLabel}: ${named}`}
      onClick={(e) => {
        e.stopPropagation();
        if (permit) onPermit!();
        else if (book) onBook!();
        else if (project) onProject!();
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
        <CornerTags card={card} />
        {waitlist && <span className={styles.soldOut}>SOLD OUT · WAITLIST OPEN</span>}
      </div>
      <div className={styles.body}>
        {(card.partner?.name || card.subtitle) && <span className={styles.provider}>{card.partner?.name || card.subtitle}</span>}
        <h3 className={styles.title}>{card.title}</h3>
        {waitlist && (
          <span className={styles.spots}>
            {place ? `✓ You’re #${place.position} on the waitlist` : `Sold out · ${soldOut!.waiting} on the waitlist`}
          </span>
        )}
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
            {price ? <span className={styles.bigPrice}>{price}</span> : noPrice}
            <div className={styles.facilityFooter}>
              {(chips.length > 0 || rating) && (
                <span className={styles.chips}>
                  {withRating((c) => (
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
            {(chips.length > 0 || rating) && (
              <span className={styles.pills}>
                {withRating((p) => (
                  <span key={p} className={styles.ages}>
                    {p}
                  </span>
                ))}
              </span>
            )}
            <div className={styles.footer}>
              {price ? <span className={styles.price}>{price}</span> : (noPrice || <span />)}
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
              {(item.partner?.name || item.subtitle) && <span className={styles.stripProvider}>{item.partner?.name || item.subtitle}</span>}
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

/** The tags on the top right of a card's photo: its own ("Special event") and its age rule ("21+"), as the design's. */
function CornerTags({ card }: { card: DirectoryItem }) {
  const label = card.cornerTag ? cornerTagLabel(card.cornerTag) : '';
  const policy = agePolicy(card.tags);
  const age = policy.kind === 'adult' ? `${policy.minAge}+` : '';
  if (!label && !age) return null;
  return (
    <span className={styles.corner}>
      {label && <span className={styles.cornerTag}>{label}</span>}
      {age && <span className={styles.cornerTag}>{age}</span>}
    </span>
  );
}
