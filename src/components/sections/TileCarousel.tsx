'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback } from 'react';
import { Container } from '@/components/ui/Section';
import type { Tile } from '@/content/types';
import styles from './TileCarousel.module.css';

/** Looping carousel of large image tiles with centred captions and overlaid arrows. */
export default function TileCarousel({ tiles }: { tiles: Tile[] }) {
  // Repeat short sets so the loop always has enough slides to wrap seamlessly.
  const slides = tiles.length < 5 ? [...tiles, ...tiles] : tiles;
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: 'center', slidesToScroll: 1 });
  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <section className={styles.section} data-header-tone="dark">
      <Container>
        <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Updates and news">
          <div className={styles.viewport} ref={emblaRef}>
            <div className={styles.track}>
              {slides.map((tile, i) => (
                <div key={i} className={styles.cell} aria-hidden={i >= tiles.length || undefined}>
                  <Image src={tile.image} width={tile.width} height={tile.height} alt={tile.title} sizes="(max-width: 690px) 450px, (max-width: 1000px) 530px, 900px" />
                  <a
                    className={styles.link}
                    href={tile.href}
                    target={tile.newTab ? '_blank' : undefined}
                    rel={tile.newTab ? 'noopener' : undefined}
                    aria-label={tile.title}
                    tabIndex={i >= tiles.length ? -1 : undefined}
                  />
                  <div className={styles.meta}>
                    <h4>{tile.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="button" className={`${styles.arrow} ${styles.previous}`} onClick={prev} aria-label="Previous">
            <ArrowIcon />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={next} aria-label="Next">
            <ArrowIcon />
          </button>
        </div>
      </Container>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false">
      <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" />
    </svg>
  );
}
