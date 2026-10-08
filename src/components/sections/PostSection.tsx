'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Container } from '@/components/ui/Section';
import type { Post, PostSectionData } from '@/content/types';
import styles from './PostSection.module.css';

/**
 * One "Updates & News" category: heading, posts and a "View all" pill, laid out as the original page's post grid
 * (photo with the title centred under it, 10px corners, zoom on hover, zoom-out reveal): a carousel, four a row with
 * arrows over the photos and a white card behind the hovered post, or a masonry row of three whose middle post is a
 * wide photo with its title on it.
 */
export default function PostSection({ title, layout, spacing, posts, viewAll, smallSides }: PostSectionData) {
  return (
    <section
      className={styles.section}
      style={{ paddingTop: `${spacing.top}vw`, paddingBottom: `${spacing.bottom}vw` } as CSSProperties}
      data-header-tone="dark"
    >
      <Container>
        <h2 className={styles.title}>{title}</h2>
        {layout === 'carousel' ? <PostCarousel posts={posts} /> : <PostMasonry posts={posts} smallSides={smallSides} />}
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

/** Carousel (Flickity on the original: wraps around, arrows over the photos). */
function PostCarousel({ posts }: { posts: Post[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', slidesToScroll: 'auto', loop: true });
  // Arrows only when there is more than one page of posts.
  const [many, setMany] = useState(false);
  useEffect(() => {
    if (!embla) return;
    // The carousel is already set up when its API arrives (its "init" has passed): read it now, then on each re-init.
    const sync = () => setMany(embla.scrollSnapList().length > 1);
    sync();
    embla.on('reInit', sync);
    return () => {
      embla.off('reInit', sync);
    };
  }, [embla]);
  return (
    <div className={styles.carousel}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.track}>
          {posts.map((post) => (
            <div key={post.href} className={styles.slide}>
              <PostCard post={post} variant="plain" />
            </div>
          ))}
        </div>
      </div>
      {many && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Previous posts" onClick={() => embla?.scrollPrev()}>
            <ArrowHead />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next posts" onClick={() => embla?.scrollNext()}>
            <ArrowHead />
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Masonry row: the second post spans two columns, its photo filling the cell with the title over it. `smallSides`:
 * the other posts' photos are smaller, centred on the row's height.
 */
function PostMasonry({ posts, smallSides }: { posts: Post[]; smallSides?: boolean }) {
  return (
    <div className={`${styles.masonry} ${smallSides ? styles.smallSides : ''}`}>
      {posts.map((post, i) => (
        <div key={post.href} className={i === 1 ? styles.wide : undefined}>
          <PostCard post={post} variant={i === 1 ? 'feature' : 'plain'} />
        </div>
      ))}
    </div>
  );
}

/**
 * Post: photo (revealed on scroll: unclipped from 30px in while it settles from 1.3x; zooms on hover) and title (its
 * words slide up into view). `plain`: title centred under the photo; `feature`: title centred on the photo.
 */
function PostCard({ post, variant }: { post: Post; variant: 'plain' | 'feature' }) {
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
        <span className={styles.zoom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt="" loading="lazy" />
        </span>
      </a>
      <div className={styles.content}>
        <h3 className={styles.postTitle}>
          <a href={post.href} aria-label={post.title}>
            {/* The space goes between the word boxes (one inside a box would be dropped at its end). */}
            {post.title.split(/\s+/).map((word, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className={styles.word} aria-hidden>
                  <span className={styles.wordInner}>{word}</span>
                </span>
              </Fragment>
            ))}
          </a>
        </h3>
      </div>
    </article>
  );
}

/** The arrows' chevron (Flickity's), with the line drawn by CSS next to it. */
function ArrowHead() {
  return (
    <svg className={styles.arrowHead} viewBox="0 0 100 100" aria-hidden focusable="false">
      <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" />
    </svg>
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
