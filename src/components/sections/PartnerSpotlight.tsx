'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import type { SpotlightPartner } from '@/content/listings';
import styles from './PartnerSpotlight.module.css';

/** Initials for a partner without a photo ("Boston Athletic Training" -> "BAT"). */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');

/** A card of the spotlight: a partner (its page), or a sponsored listing of the page (`onOpen` opens its bio). */
export type SpotlightCard = SpotlightPartner & { onOpen?: () => void };

type Props = {
  partners: SpotlightCard[];
  section: 'experiences' | 'resources';
  /** The cards are the brands sponsoring a listing of the page (Branded Activations), not the partner directory. */
  sponsors?: boolean;
  /** The button under the cards filters the page's results (e.g. to its partner coaches) instead of opening /clp-partners/. */
  onViewAll?: () => void;
};

/**
 * The black "CLP Partners" band between a listing page's results: the heading centred, the partners from the partner
 * directory (or the page's sponsors) in a carousel (four at a time; arrows, dots or a swipe for more) and "View All
 * Partners" under them.
 */
export default function PartnerSpotlight({ partners, section, sponsors = false, onViewAll }: Props) {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', slidesToScroll: 'auto' });
  // The carousel's pages (one per dot), the one shown and whether there is more either way.
  const [pages, setPages] = useState(0);
  const [selected, setSelected] = useState(0);
  const [edges, setEdges] = useState({ prev: false, next: false });
  useEffect(() => {
    if (!embla) return;
    // The carousel is already set up when its API arrives: read it now, then on each move and re-init.
    const sync = () => {
      setPages(embla.scrollSnapList().length);
      setSelected(embla.selectedScrollSnap());
      setEdges({ prev: embla.canScrollPrev(), next: embla.canScrollNext() });
    };
    sync();
    embla.on('select', sync).on('reInit', sync);
    return () => {
      embla.off('select', sync).off('reInit', sync);
    };
  }, [embla]);
  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  if (partners.length === 0) return null;
  const resources = section === 'resources';
  const copy = sponsors
    ? {
        eyebrow: 'SPONSORED PARTNERS',
        title: 'Brands in the Game',
        sub: 'Partners sponsoring a listing on this page. Sponsored placements are paid and always labeled.',
        more: 'View Listing',
        all: 'View Sponsored Listings',
      }
    : {
        eyebrow: 'CLP PARTNERS',
        title: resources ? 'Experts We Back' : 'Train With the People We Back',
        sub: resources
          ? 'Verified CLP partners. Licensed and certified providers are marked on their listing.'
          : 'Verified programs that book, pay and check in through CLP.',
        more: 'View Partner',
        all: 'View All Partners',
      };
  const card = (p: SpotlightCard) => (
    <>
      <span className={styles.media}>
        {p.image && <Image className={styles.image} src={p.image} alt="" fill sizes="(max-width: 480px) 85vw, (max-width: 1100px) 50vw, 320px" />}
        <span className={styles.logo} aria-hidden>
          {p.image ? <Image src={p.image} alt="" width={64} height={64} /> : initials(p.name)}
        </span>
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{p.name}</span>
        {p.excerpt && <span className={styles.meta}>{p.excerpt}</span>}
        <span className={styles.more}>
          {copy.more}
          <span className="glyph" aria-hidden>
            →
          </span>
        </span>
      </span>
    </>
  );
  return (
    <section className={styles.spotlight} data-header-tone="light">
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
          <h2 className={styles.title}>{copy.title}</h2>
          <p className={styles.sub}>{copy.sub}</p>
        </div>
        <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label={sponsors ? 'Sponsored partners' : 'CLP partners'}>
          <div className={styles.viewport} ref={emblaRef}>
            <ul className={styles.track}>
              {partners.map((p, i) => (
                <li key={p.href} className={styles.slide} aria-roledescription="slide" aria-label={`${i + 1} of ${partners.length}`}>
                  {p.onOpen ? (
                    <button type="button" className={styles.partner} aria-haspopup="dialog" onClick={p.onOpen}>
                      {card(p)}
                    </button>
                  ) : (
                    <Link className={styles.partner} href={p.href}>
                      {card(p)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {pages > 1 && (
            <div className={styles.controls}>
              <button type="button" className={styles.arrow} onClick={prev} disabled={!edges.prev} aria-label="Previous partners">
                <LuChevronLeft aria-hidden />
              </button>
              <div className={styles.dots}>
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.dot} ${i === selected ? styles.dotOn : ''}`}
                    onClick={() => embla?.scrollTo(i)}
                    aria-label={`Partners page ${i + 1} of ${pages}`}
                    aria-current={i === selected ? 'true' : undefined}
                  />
                ))}
              </div>
              <button type="button" className={styles.arrow} onClick={next} disabled={!edges.next} aria-label="More partners">
                <LuChevronRight aria-hidden />
              </button>
            </div>
          )}
        </div>
        {onViewAll ? (
          <button type="button" className={styles.allPartners} onClick={onViewAll}>
            {copy.all}
          </button>
        ) : (
          <Link className={styles.allPartners} href="/clp-partners/">
            {copy.all}
          </Link>
        )}
      </div>
    </section>
  );
}
