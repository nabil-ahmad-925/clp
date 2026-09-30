'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './ParallaxBand.module.css';

type Props = { image: string; className?: string; children?: ReactNode };

/** Full-width band whose background image drifts slower than the page (parallax row). */
export default function ParallaxBand({ image, className, children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      // -0.5 … 0.5 as the band travels through the viewport.
      const progress = (rect.top + rect.height / 2) / (window.innerHeight + rect.height) - 0.5;
      bg.style.transform = `translate3d(0, ${progress * rect.height * 0.4}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className={[styles.band, className].filter(Boolean).join(' ')} data-header-tone="light">
      <div ref={bgRef} className={styles.bg} style={{ backgroundImage: `url(${image})` }} aria-hidden />
      {children && <div className={styles.content}>{children}</div>}
    </section>
  );
}
