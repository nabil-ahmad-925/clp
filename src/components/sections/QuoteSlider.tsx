'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import { Container } from '@/components/ui/Section';
import styles from './QuoteSlider.module.css';

export type Quote = { text: string; author: string };

/** Famous-athlete quotes that cross-fade, with pagination dots (Salient default testimonial slider). */
export default function QuoteSlider({ quotes }: { quotes: Quote[] }) {
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number>();
  const slideRefs = useRef<(HTMLQuoteElement | null)[]>([]);
  const touchX = useRef<number | null>(null);

  // Size the stage to the active quote (+40px), animating between quotes like the original.
  useLayoutEffect(() => {
    const el = slideRefs.current[active];
    if (!el) return;
    const update = () => setHeight(el.offsetHeight + 40);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  const go = (i: number) => setActive((i + quotes.length) % quotes.length);

  return (
    <section className={styles.section} data-header-tone="dark">
      <Container className={styles.container}>
        <Reveal>
          <div
            className={styles.slider}
            role="region"
            aria-roledescription="carousel"
            aria-label="Quotes"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
              touchX.current = null;
            }}
          >
            <div className={styles.slides} style={{ height }}>
              {quotes.map((quote, i) => (
                <blockquote
                  key={i}
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  className={`${styles.slide} ${i === active ? styles.active : ''}`}
                  aria-hidden={i !== active}
                >
                  <span className={styles.icon} aria-hidden>
                    &#8220;
                  </span>
                  <p className={styles.text}>{quote.text}</p>
                  <span className={styles.author}>{quote.author}</span>
                </blockquote>
              ))}
            </div>

            <ul className={styles.dots}>
              {quotes.map((_, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={i === active ? styles.dotActive : undefined}
                    aria-label={`Show quote ${i + 1}`}
                    aria-current={i === active || undefined}
                    onClick={() => go(i)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
