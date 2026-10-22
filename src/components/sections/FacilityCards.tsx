'use client';

import { useEffect, useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import { Container } from '@/components/ui/Section';
import { listingTypeOf, listingsEnabled, queryListings } from '@/content/listings';
import type { DirectoryItem, FacilityCard } from '@/content/types';
import BioModal from './BioModal';
import BookingModal from './BookingModal';
import ClaimModal from './ClaimModal';
import RequestModal from './RequestModal';
import ListingCard from './ListingCard';
import { useWaitlists } from './useWaitlists';
import WaitlistModal from './WaitlistModal';
import { listingFacts } from './TeamDirectory';
import t from './TeamDirectory.module.css';
import styles from './FacilityCards.module.css';

type Props = {
  /** The built-in cards: shown when there is nothing live to show. */
  items: FacilityCard[];
  /** Where the live cards come from: a directory's widget and its page's filter groups (the sport). */
  live?: { widgetId: number; groups: string[][] };
  /** A service area's services (its Service filter), for the project form. */
  services?: { value: string; label: string }[];
};

/** A built-in card as a listing card (no tags, no provider: "Learn More" opens its bio). */
const asItem = (card: FacilityCard, i: number): DirectoryItem => ({ ...card, id: `${card.title}-${i}`, tags: [] });

/**
 * Four cards (sport and service pages) in the experiences' listing card: photo, provider, title, dates and place,
 * price, the ages and the partner's rating, and Book Now (listings booked on CLP), Permit Now (government facilities:
 * the permit request), a service's own button (Start a New Project: its project request; or its details) or Learn More
 * (its bio).
 * With `live`, the cards are the directory's newest published listings from the listings API (placeholders while they
 * load); without any there, or when the API fails, the built-in cards.
 */
export default function FacilityCards({ items, live, services }: Props) {
  const enabled = live != null && listingsEnabled(live.widgetId);
  const count = items.length || 4;
  const builtIn = items.map(asItem);
  // null: still loading from the API.
  const [cards, setCards] = useState<DirectoryItem[] | null>(enabled ? null : builtIn);
  const [open, setOpen] = useState<DirectoryItem | null>(null);
  const [booking, setBooking] = useState<DirectoryItem | null>(null);
  const [claiming, setClaiming] = useState<DirectoryItem | null>(null);
  // A service's "Start a New Project" (its button CLP chose) or a government facility's "Permit Now": their request form.
  const [requesting, setRequesting] = useState<{ kind: 'project' | 'permit'; item: DirectoryItem } | null>(null);
  const [waiting, setWaiting] = useState<{ item: DirectoryItem; date?: string } | null>(null);
  const { soldOut, places } = useWaitlists(live ? (cards ?? []) : [], () => live?.widgetId);
  const facility = live != null && listingTypeOf(live.widgetId) === 'facilities';

  const source = live ? JSON.stringify(live) : '';
  useEffect(() => {
    if (!enabled || !source) return;
    const { widgetId, groups } = JSON.parse(source) as NonNullable<Props['live']>;
    let active = true;
    queryListings(widgetId, groups, [], count).then(
      (r) => active && setCards(r.items.length ? r.items : items.map(asItem)),
      () => active && setCards(items.map(asItem)),
    );
    return () => {
      active = false;
    };
  }, [enabled, source, count, items]);

  return (
    <section className={styles.section} data-header-tone="dark">
      <Container>
        <div className={`${t.listingGrid} ${styles.grid}`} aria-busy={cards === null}>
          {cards === null
            ? Array.from({ length: count }, (_, i) => <div key={i} className={`${t.skeleton} ${t.listingSkeleton}`} aria-hidden />)
            : cards.map((card, i) => (
                <Reveal key={card.id} className={t.listingItem}>
                  <ListingCard
                    card={card}
                    view="grid"
                    variant={facility ? 'facility' : 'listing'}
                    eager={i < 4}
                    facts={listingFacts(card)}
                    onOpen={() => setOpen(card)}
                    onBook={live ? () => setBooking(card) : undefined}
                    onClaim={live ? () => setClaiming(card) : undefined}
                    onProject={live ? () => setRequesting({ kind: 'project', item: card }) : undefined}
                    onPermit={live ? () => setRequesting({ kind: 'permit', item: card }) : undefined}
                    soldOut={live ? soldOut[`${live.widgetId}.${card.id}`] : undefined}
                    place={live ? places[`${live.widgetId}.${card.id}`] : undefined}
                    onWaitlist={() => setWaiting({ item: card })}
                  />
                </Reveal>
              ))}
        </div>
      </Container>

      {open && <BioModal card={open} onClose={() => setOpen(null)} />}
      {booking && live && (
        <BookingModal
          item={booking}
          widgetId={live.widgetId}
          facts={listingFacts(booking)}
          onClose={() => setBooking(null)}
          onJoinWaitlist={(date) => {
            setBooking(null);
            setWaiting({ item: booking, date });
          }}
        />
      )}
      {waiting && live && <WaitlistModal item={waiting.item} widgetId={live.widgetId} facts={listingFacts(waiting.item)} date={waiting.date} onClose={() => setWaiting(null)} />}
      {claiming && live && <ClaimModal item={claiming} widgetId={live.widgetId} onClose={() => setClaiming(null)} />}
      {requesting && live && (
        <RequestModal kind={requesting.kind} item={requesting.item} widgetId={live.widgetId} facts={listingFacts(requesting.item)} services={services} onClose={() => setRequesting(null)} />
      )}
    </section>
  );
}
