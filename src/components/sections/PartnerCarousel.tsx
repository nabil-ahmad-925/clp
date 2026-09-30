'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { Fragment, useCallback } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import RichText from '@/components/ui/RichText';
import { Container } from '@/components/ui/Section';
import type { PartnerCategory } from '@/content/partnerships';
import styles from './PartnerCarousel.module.css';

/** Gold band with a carousel of partner categories (three visible) and the offer terms. */
export default function PartnerCarousel({ items, termsHtml }: { items: PartnerCategory[]; termsHtml: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 });
  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <section className={styles.band} data-header-tone="light">
      <Container>
        <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Partner categories">
          <div className={styles.controls}>
            <button type="button" className={styles.prev} onClick={prev} aria-label="Previous">
              <FaAngleLeft aria-hidden />
            </button>
            <button type="button" className={styles.next} onClick={next} aria-label="Next">
              <FaAngleRight aria-hidden />
            </button>
          </div>
          <div className={styles.viewport} ref={emblaRef}>
            <ul className={styles.track}>
              {items.map((item) => (
                <li key={item.href} className={styles.slide}>
                  <a href={item.href} className={styles.item}>
                    <span className={styles.image} aria-hidden />
                    <span className={styles.shade} aria-hidden />
                    <span className={styles.info}>
                      <h3>
                        {item.title.map((line, i) => (
                          <Fragment key={i}>
                            {i > 0 && <br />}
                            {line}
                          </Fragment>
                        ))}
                      </h3>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <RichText html={termsHtml} className={styles.terms} />
      </Container>
    </section>
  );
}
