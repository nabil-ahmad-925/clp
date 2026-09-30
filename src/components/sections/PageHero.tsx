'use client';

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { FaAngleDown } from 'react-icons/fa';
import type { PageHeroData } from '@/content/types';
import styles from './PageHero.module.css';

const PARALLAX_SPEED = 0.25;
const WORD_STAGGER_MS = 370;

export default function PageHero({ title, subtitle, height, backgroundColor, backgroundImage, video, textEffect, scrollArrow, meta, titleMaxWidth, overlay }: PageHeroData) {
  const heroRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [textIn, setTextIn] = useState(!textEffect);

  // Background moves at a quarter of the scroll speed (Salient page-header parallax).
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y < window.innerHeight * 1.5) media.style.transform = `translate3d(0, ${y * PARALLAX_SPEED}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // "Rotate in" heading: start once the video can play (or shortly after mount without one).
  useEffect(() => {
    if (!textEffect) return;
    const start = () => setTextIn(true);
    const videoEl = mediaRef.current?.querySelector('video');
    if (videoEl && videoEl.readyState < 3) {
      videoEl.addEventListener('canplay', start, { once: true });
      const fallback = window.setTimeout(start, 1500);
      return () => {
        videoEl.removeEventListener('canplay', start);
        window.clearTimeout(fallback);
      };
    }
    const timer = window.setTimeout(start, video ? 0 : 800);
    return () => window.clearTimeout(timer);
  }, [textEffect, video]);

  let wordIndex = 0;
  const heading = title.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {textEffect
        ? line.split(' ').filter(Boolean).map((word) => {
            const delay = wordIndex++ * WORD_STAGGER_MS;
            return (
              <Fragment key={`${word}-${delay}`}>
                <span className={styles.word}>
                  <span style={{ transitionDelay: `${delay}ms` } as CSSProperties}>{word}</span>
                </span>{' '}
              </Fragment>
            );
          })
        : line}
    </Fragment>
  ));

  return (
    <section
      ref={heroRef}
      className={`${styles.hero} ${height === 'fullscreen' ? styles.fullscreen : styles.fixed} ${typeof height === 'number' ? styles.exact : ''}`}
      style={{ backgroundColor, '--hero-height': typeof height === 'number' ? `${height}px` : undefined } as CSSProperties}
      data-header-tone="light"
    >
      <div className={styles.mediaClip} aria-hidden>
        <div ref={mediaRef} className={styles.media}>
          {backgroundImage && <div className={styles.image} style={{ backgroundImage: `url(${backgroundImage})` }} />}
          {overlay && <div className={styles.overlay} style={{ backgroundColor: overlay }} />}
          {video && <video className={styles.video} src={video} autoPlay muted loop playsInline preload="auto" />}
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.inner}>
          <h1
            className={`${styles.title} ${meta ? styles.titleWithMeta : ''} ${textEffect ? styles.rotateIn : ''} ${textIn ? styles.in : ''}`}
            style={titleMaxWidth ? { maxWidth: titleMaxWidth, marginLeft: 'auto', marginRight: 'auto' } : undefined}
          >{heading}</h1>
          {subtitle && (
            <span className={styles.subtitle}>
              {subtitle.text}
              {subtitle.small && (
                <>
                  <br />
                  <span className={styles.subtitleSmall}>{subtitle.small}</span>
                </>
              )}
            </span>
          )}
          {meta && (
            <div className={styles.meta}>
              {meta.map((item, i) => (
                <span key={i}>
                  {item.prefix && <span className={styles.metaPrefix}>{item.prefix} </span>}
                  {item.href ? <a href={item.href}>{item.label}</a> : item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {scrollArrow && (
        <button
          type="button"
          className={styles.scrollArrow}
          aria-label="Scroll to content"
          onClick={() => {
            const hero = heroRef.current;
            if (hero) window.scrollTo({ top: hero.offsetTop + hero.offsetHeight, behavior: 'smooth' });
          }}
        >
          <span aria-hidden>
            <FaAngleDown />
            <FaAngleDown />
          </span>
        </button>
      )}
    </section>
  );
}
