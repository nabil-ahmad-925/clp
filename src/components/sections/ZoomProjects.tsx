'use client';

import { useState } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import styles from './ZoomProjects.module.css';

type Slide = { title: string; href: string; label: string };

/**
 * Salient "fullscreen zoom recent projects": a framed slider showing one project at a time (title and a
 * "View Project" link over its image), stepped with the round buttons at the bottom.
 */
export default function ZoomProjects({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const go = (step: number) => setCurrent((i) => (i + step + slides.length) % slides.length);

  return (
    <div className={styles.slider}>
      {slides.map((slide, i) => (
        <div key={i} className={`${styles.slide} ${i === current ? styles.current : ''}`} aria-hidden={i !== current}>
          <div className={styles.info}>
            <h1>{slide.title}</h1>
            <a href={slide.href} tabIndex={i === current ? undefined : -1}>
              {slide.label}
            </a>
          </div>
        </div>
      ))}
      <div className={styles.controls}>
        <button type="button" aria-label="Previous project" onClick={() => go(-1)}>
          <FaAngleLeft />
        </button>
        <button type="button" aria-label="Next project" onClick={() => go(1)}>
          <FaAngleRight />
        </button>
      </div>
    </div>
  );
}
