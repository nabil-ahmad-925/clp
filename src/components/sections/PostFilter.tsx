'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { FaCheck, FaComments, FaLink } from 'react-icons/fa';
import type { FilterPost } from '@/content/types';
import styles from './PostFilter.module.css';

type Props = { categories: { id: string; label: string; count: number }[]; posts: FilterPost[] };

/** Columns of the original's Bootstrap grid (col-lg-4 col-md-4 col-sm-6 col-xs-12). */
const columnsFor = (width: number) => (width >= 992 ? 3 : width >= 768 ? 2 : 1);

/**
 * Category-filtered post grid (Blog Filter plugin): gold category buttons (the chosen one black, with a check),
 * a search box, and post cards laid out in columns, each card placed below the previous one in its column.
 * Grids of a single category have no buttons or search box.
 */
export default function PostFilter({ categories, posts }: Props) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [columns, setColumns] = useState(3);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const update = () => setColumns(columnsFor(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (post) =>
        (category === 'all' || post.categories.includes(category)) &&
        (!q || `${post.title} ${post.excerpt} ${post.comments}`.toLowerCase().includes(q)),
    );
  }, [posts, category, query]);

  // Heights drive the column layout, so re-measure whenever cards resize (images loading, width changes).
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const next: Record<string, number> = {};
      cardRefs.current.forEach((el, id) => (next[id] = el.offsetHeight));
      setHeights(next);
    });
    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [posts]);

  const measured = Object.keys(heights).length > 0;
  const positions = new Map<string, { x: number; y: number }>();
  const columnHeights = Array(columns).fill(0);
  visible.forEach((post, i) => {
    const column = i % columns;
    positions.set(post.id, { x: column, y: columnHeights[column] });
    columnHeights[column] += heights[post.id] ?? 0;
  });

  return (
    <div className={styles.main}>
      {categories.length > 0 && (
        <>
          <ul className={styles.filters}>
            {categories.map((c) => (
              <li key={c.id}>
                <button type="button" className={`${styles.button} ${category === c.id ? styles.active : ''}`} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  <span>
                    {c.label} ({c.count})
                  </span>
                  <FaCheck aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.search}>
            <input type="text" className={styles.searchTerm} name="blog_search" placeholder="Search" aria-label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </>
      )}
      {/* Until the cards are measured they sit floated in rows (still hidden), so the grid keeps its height. */}
      <div
        className={`${styles.container} ${measured ? styles.measured : ''}`}
        style={{ height: measured ? Math.max(0, ...columnHeights) : undefined, '--bf-columns': columns } as CSSProperties}
      >
        {posts.map((post) => {
          const position = positions.get(post.id);
          return (
            <div
              key={post.id}
              ref={(el) => {
                if (el) cardRefs.current.set(post.id, el);
                else cardRefs.current.delete(post.id);
              }}
              className={`${styles.item} ${measured && position ? styles.shown : ''}`}
              style={measured && position ? { transform: `translate3d(calc(100% * ${position.x}), ${position.y}px, 0)` } : undefined}
              aria-hidden={!position}
            >
              <article className={styles.card}>
                <div className={styles.thumbnail}>
                  <div className={styles.date}>
                    <div className={styles.day}>{post.day}</div>
                    <div className={styles.month}>{post.month}</div>
                  </div>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element -- the original 300px thumbnail, stretched as on the site */}
                    <img src={post.image} alt={post.imageAlt} width={post.imageWidth} height={post.imageHeight} />
                  </figure>
                </div>
                <div className={styles.content}>
                  <a href={post.href} tabIndex={position ? undefined : -1}>
                    <h2 className={styles.title}>{post.title}</h2>
                  </a>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <div className={styles.meta}>
                    <FaComments aria-hidden /> {post.comments}
                  </div>
                  <div className={styles.readMore}>
                    <a className={styles.button} href={post.href} tabIndex={position ? undefined : -1}>
                      <span>Read More</span>
                      <FaLink aria-hidden />
                    </a>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
      {/* The plugin's (empty) pagination bar keeps its 20px margins and 1px height below the grid. */}
      <div className={styles.pagination} aria-hidden />
    </div>
  );
}
