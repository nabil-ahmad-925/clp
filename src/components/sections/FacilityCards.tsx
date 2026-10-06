'use client';

import { useEffect, useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import { Container } from '@/components/ui/Section';
import { listingsEnabled, queryListings } from '@/content/listings';
import type { FacilityCard } from '@/content/types';
import BioModal from './BioModal';
import TeamCard from './TeamCard';
import styles from './FacilityCards.module.css';

type Props = {
  /** The built-in cards: shown when there is nothing live to show. */
  items: FacilityCard[];
  /** Where the live cards come from: a directory's widget and its page's filter groups (the sport). */
  live?: { widgetId: number; groups: string[][] };
};

/**
 * Four photo cards with alternate ones lowered (sport and service pages); clicking one opens its full-screen bio.
 * With `live`, the cards are the directory's newest published listings from the listings API (placeholders while they
 * load); without any there, or when the API fails, the built-in cards.
 */
export default function FacilityCards({ items, live }: Props) {
  const enabled = live != null && listingsEnabled(live.widgetId);
  const count = items.length || 4;
  // null: still loading from the API.
  const [cards, setCards] = useState<FacilityCard[] | null>(enabled ? null : items);
  const [open, setOpen] = useState<FacilityCard | null>(null);

  const source = live ? JSON.stringify(live) : '';
  useEffect(() => {
    if (!enabled || !source) return;
    const { widgetId, groups } = JSON.parse(source) as NonNullable<Props['live']>;
    let active = true;
    queryListings(widgetId, groups, [], count).then(
      (r) => active && setCards(r.items.length ? r.items : items),
      () => active && setCards(items),
    );
    return () => {
      active = false;
    };
  }, [enabled, source, count, items]);

  return (
    <section className={styles.section} data-header-tone="dark">
      <Container>
        <div className={styles.grid} aria-busy={cards === null}>
          {cards === null
            ? Array.from({ length: count }, (_, i) => (
                <div key={i} className={styles.column} aria-hidden>
                  <div className={styles.skeleton} />
                </div>
              ))
            : cards.map((card, i) => (
                <Reveal key={`${card.title}-${i}`} className={styles.column}>
                  <TeamCard card={card} onOpen={() => setOpen(card)} />
                </Reveal>
              ))}
        </div>
      </Container>

      {open && <BioModal card={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
