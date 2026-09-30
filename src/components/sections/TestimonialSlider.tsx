'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import styles from './TestimonialSlider.module.css';

export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  avatar: string;
  /** Soft drop shadow under the avatar. */
  avatarShadow?: boolean;
};

/** Salient "multiple visible" testimonial carousel: centred, looping, arrow controls. */
export default function TestimonialSlider({ items }: { items: Testimonial[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: 'center', containScroll: false });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on('select', onSelect).on('reInit', onSelect);
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect);
    };
  }, [embla]);

  // A seamless loop needs more slides than fit on screen; repeat the set when there are only a few.
  const repeat = Math.max(1, Math.ceil(6 / items.length));
  const slides = Array.from({ length: repeat }, () => items).flat();

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <div
      className={styles.slider}
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimonials"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
    >
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.track}>
          {slides.map((item, i) => (
            <blockquote
              key={i}
              className={`${styles.slide} ${i === selected ? styles.selected : ''}`}
              aria-roledescription="slide"
              aria-label={`${(i % items.length) + 1} of ${items.length}`}
              aria-hidden={i >= items.length || undefined}
            >
              <p className={styles.quote}>
                {item.quote}
                <span className={styles.arrow} aria-hidden />
              </p>
              <span
                className={`${styles.avatar} ${item.avatarShadow ? styles.avatarShadow : ''}`}
                style={{ backgroundImage: `url(${item.avatar})` }}
                aria-hidden
              />
              <span className={styles.name}>{item.name}</span>
              <span className={styles.title}>{item.title}</span>
            </blockquote>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <button type="button" className={`${styles.navButton} ${styles.previous}`} onClick={prev} aria-label="Previous">
          <ArrowIcon />
        </button>
        <button type="button" className={`${styles.navButton} ${styles.next}`} onClick={next} aria-label="Next">
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

// Same arrow geometry the original slider used (Flickity arrowShape 10/60,50/70,40/30).
function ArrowIcon() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false">
      <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" />
    </svg>
  );
}
