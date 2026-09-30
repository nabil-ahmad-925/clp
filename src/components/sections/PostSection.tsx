'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Container } from '@/components/ui/Section';
import type { Post, PostSectionData } from '@/content/types';
import styles from './PostSection.module.css';

/** One "Updates & News" category: heading, post cards (carousel or masonry) and a "View all" pill. */
export default function PostSection({ title, layout, spacing, posts, viewAll }: PostSectionData) {
  return (
    <section
      className={styles.section}
      style={{ paddingTop: `${spacing.top}vw`, paddingBottom: `${spacing.bottom}vw` } as CSSProperties}
      data-header-tone="dark"
    >
      <Container>
        <h2 className={styles.title}>{title}</h2>
        {layout === 'carousel' ? <PostCarousel posts={posts} /> : <PostMasonry posts={posts} />}
        <div className={styles.viewAll}>
          <a href={viewAll.href} className={styles.pill}>
            <span>{viewAll.label}</span>
            <CurvedArrow />
          </a>
        </div>
      </Container>
    </section>
  );
}

function PostCarousel({ posts }: { posts: Post[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', slidesToScroll: 'auto', containScroll: 'trimSnaps' });
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const sync = () => {
      setSnaps(embla.scrollSnapList());
      setSelected(embla.selectedScrollSnap());
    };
    embla.on('init', sync).on('reInit', sync).on('select', sync);
    return () => {
      embla.off('init', sync).off('reInit', sync).off('select', sync);
    };
  }, [embla]);

  return (
    <div className={styles.carousel}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.track}>
          {posts.map((post) => (
            <div key={post.href} className={styles.slide}>
              <PostCard post={post} variant="card" />
            </div>
          ))}
        </div>
      </div>
      {snaps.length > 1 && (
        <div className={styles.dots}>
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === selected ? styles.dotActive : undefined}
              aria-label={`Show page ${i + 1}`}
              aria-current={i === selected || undefined}
              onClick={() => embla?.scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostMasonry({ posts }: { posts: Post[] }) {
  return (
    <div className={styles.masonry}>
      {posts.map((post, i) => (
        <div key={post.href} className={i === 1 ? styles.wide : undefined}>
          <PostCard post={post} variant="plain" />
        </div>
      ))}
    </div>
  );
}

/** Post card: image (revealed with a clip animation on scroll, zooms on hover) + title (+ date). */
function PostCard({ post, variant }: { post: Post; variant: 'card' | 'plain' }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={ref} className={`${styles.post} ${styles[variant]} ${shown ? styles.shown : ''}`}>
      <a href={post.href} className={styles.imageWrap} tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" loading="lazy" />
      </a>
      <div className={styles.content}>
        <h3 className={styles.postTitle}>
          <a href={post.href}>{post.title}</a>
        </h3>
        {variant === 'card' && post.date && <span className={styles.date}>{post.date}</span>}
      </div>
    </article>
  );
}

function CurvedArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden focusable="false">
      <g transform="matrix(1,0,0,-1,12,11)">
        <g transform="matrix(1,0,0,-1,-1,3)">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M 7 3.3 L -3.2 3.3 C -5 3.3 -6.5 1.8 -6.5 0 L -6.5 -2.5" />
        </g>
        <g transform="matrix(1,0,0,-1,4,-0.5)">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M -2.5 5 C -2.5 5 2.5 0 2.5 0" />
          <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M -2.5 -5 C -2.5 -5 2.5 0 2.5 0" />
        </g>
      </g>
    </svg>
  );
}
