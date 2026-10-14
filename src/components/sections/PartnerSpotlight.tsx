'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import BecomePartner from '@/components/partners/BecomePartner';
import type { SpotlightPartner } from '@/content/listings';
import { PARTNER_CATEGORIES, PARTNER_SPORTS, loadLivePartners, partnerCategoryHref, partnerHref } from '@/content/partnerPages';
import styles from './PartnerSpotlight.module.css';

/** Initials for a partner without a photo ("Boston Athletic Training" -> "BAT"). */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');

type Props = {
  section: 'experiences' | 'resources' | 'facilities';
  /** The page's partner category: its CLP Partners are the cards (none yet: a note and "Become a Partner"), and "View
   *  All Partners" opens its partner listing. No category: no band. */
  category?: string;
  /** The page's sport: only its partners (and those listing no sport), and the partner listing opens on it. */
  sport?: string;
};

/**
 * The black "CLP Partners" band between a listing page's results: the heading centred, the page's category's partners in
 * a carousel (four at a time; arrows, dots or a swipe for more), each opening their page, and "View All Partners" under
 * them; without any yet, a note and "Become a Partner".
 */
export default function PartnerSpotlight({ section, category, sport }: Props) {
  // The CLP Partners of the page's category and sport, each opening their page (null: still loading).
  const [live, setLive] = useState<SpotlightPartner[] | null>(null);
  useEffect(() => {
    if (!category) return;
    let active = true;
    loadLivePartners().then((items) => {
      if (!active) return;
      setLive(
        items
          .filter((p) => p.partnerCategories.includes(category) && (!sport || p.sports.length === 0 || p.sports.includes(sport)))
          .map((p) => ({
            name: p.name,
            href: partnerHref(p.slug),
            image: p.hero || p.logo,
            excerpt: [p.category, p.area].filter(Boolean).join(' · '),
            rating: p.rating != null && p.reviewCount ? `★ ${p.rating.toFixed(1)} · ${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'}` : undefined,
          })),
      );
    });
    return () => {
      active = false;
    };
  }, [category, sport]);
  const partners = live ?? [];
  const empty = live?.length === 0;
  const categoryHref = partnerCategoryHref(category);
  const allHref = categoryHref ? `${categoryHref}${sport ? `?sport=${sport}` : ''}` : '/clp-partners/';
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

  if (!category || live === null) return null;
  const resources = section === 'resources';
  const copy = {
    eyebrow: 'CLP PARTNERS',
    title: resources ? 'Experts We Back' : 'Train With the People We Back',
    sub: resources ? 'Verified CLP partners. Licensed and certified providers are marked on their listing.' : 'Verified programs that book, pay and check in through CLP.',
    more: 'View Partner',
    all: 'View All Partners',
  };
  const card = (p: SpotlightPartner) => (
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
        {p.rating && <span className={styles.rating}>{p.rating}</span>}
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
        {empty ? (
          <div className={styles.none}>
            <p>
              No {PARTNER_CATEGORIES.find((c) => c.id === category)?.label} partners
              {sport ? ` for ${PARTNER_SPORTS.find((sp) => sp.id === sport)?.label}` : ''} yet. Be the first with your own page on CLP.
            </p>
            <BecomePartner className={styles.join}>Become a Partner</BecomePartner>
          </div>
        ) : (
          <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="CLP partners">
          <div className={styles.viewport} ref={emblaRef}>
            <ul className={styles.track}>
              {partners.map((p, i) => (
                <li key={p.href} className={styles.slide} aria-roledescription="slide" aria-label={`${i + 1} of ${partners.length}`}>
                  <Link className={styles.partner} href={p.href}>
                    {card(p)}
                  </Link>
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
        )}
        {/* No partners yet: nothing to view all of. */}
        {!empty && (
          <Link className={styles.allPartners} href={allHref}>
            {copy.all}
          </Link>
        )}
      </div>
    </section>
  );
}
