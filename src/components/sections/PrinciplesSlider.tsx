'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/ui/Section';
import type { Principle } from '@/content/expectations';
import styles from './PrinciplesSlider.module.css';

/** Gold/white split band holding a 2:1 dark slider of principles (Salient "simple slider"). */
export default function PrinciplesSlider({ slides }: { slides: Principle[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on('select', onSelect);
    return () => {
      embla.off('select', onSelect);
    };
  }, [embla]);

  return (
    <section className={styles.band} data-header-tone="light">
      <Container>
        <div className={styles.slider} role="region" aria-roledescription="carousel" aria-label="Our principles">
          <div className={styles.viewport} ref={emblaRef}>
            <div className={styles.track}>
              {slides.map((slide, i) => (
                <div
                  key={slide.title}
                  className={styles.slide}
                  style={{ background: `linear-gradient(135deg, ${slide.gradient[0]}, ${slide.gradient[1]})` }}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${slides.length}`}
                >
                  <div className={styles.content}>
                    <h3>{slide.title}</h3>
                    {slide.paragraphs.map((p, j) => (
                      <p key={j}>
                        {p.split('\n').map((line, k) => (
                          <Fragment key={k}>
                            {k > 0 && <br />}
                            {line}
                          </Fragment>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.dots}>
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                className={i === selected ? styles.dotActive : undefined}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === selected || undefined}
                onClick={() => embla?.scrollTo(i)}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
