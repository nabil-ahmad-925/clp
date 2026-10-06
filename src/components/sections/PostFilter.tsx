'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { FaCheck, FaComments, FaLink } from 'react-icons/fa';
import { ARTICLE_CATEGORIES, articlesEnabled, fetchArticles, toFilterPost } from '@/content/articles';
import type { FilterPost } from '@/content/types';
import styles from './PostFilter.module.css';

type FilterCategory = { id: string; label: string; count: number };
type Props = {
  categories: FilterCategory[];
  posts: FilterPost[];
  /** The article category path the grid shows ("strategy-and-insights", "sports-updates/sports-tourism"): its live
   *  articles are read from the API page by page (category and page), and the buttons become its
   *  subcategories. */
  source?: string;
};

/** Cards per page: three rows of the three-column grid. */
const PAGE_SIZE = 9;

/** A category grid's buttons from the API's counts: All, then each subcategory (not Featured) that has articles. */
function liveButtons(source: string, counts: Record<string, number>): FilterCategory[] {
  const category = ARTICLE_CATEGORIES.find((c) => c.slug === source.split('/')[0]);
  if (!category) return [];
  const subs = category.subcategories
    .filter((s) => !s.featured)
    .map((s) => ({ id: `${category.slug}/${s.slug}`, label: s.name, count: counts[`${category.slug}/${s.slug}`] ?? 0 }))
    .filter((s) => s.count > 0);
  return [{ id: 'all', label: 'All', count: counts[category.slug] ?? 0 }, ...subs];
}

/** Page numbers to show: the first and last, the current one and its neighbours; null marks a gap ("…"). */
const pageNumbers = (page: number, pages: number) => {
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? [null, n] : [n]));
};

/** Columns of the original's Bootstrap grid (col-lg-4 col-md-4 col-sm-6 col-xs-12). */
const columnsFor = (width: number) => (width >= 992 ? 3 : width >= 768 ? 2 : 1);

/** The page URL's `?filter=` value (the static HTML has none, so it renders "All" until hydrated). */
const subscribeNever = () => () => {};
const urlFilter = () => new URLSearchParams(window.location.search).get('filter');
const noFilter = () => null;

type Result = { key: string; posts: FilterPost[]; pages: number };

/**
 * Category-filtered post grid (Blog Filter plugin): gold category buttons (the chosen one black, with a check),
 * and post cards laid out in columns, each card placed below the previous one in its column, newest
 * first and PAGE_SIZE a page (numbered pages under the grid; a new category starts at page 1).
 * With a `source`, the API does the work: each category and page is a request, and the buttons' counts are
 * the API's. The built-in cards show until the first answer (and are filtered in the page if the API can't be reached).
 * Grids of a single category have no buttons. A `?filter=<category id>` query picks the category (the
 * original site's numeric ids still work: they pick the live button of the same name).
 */
export default function PostFilter({ categories: builtInCategories, posts: builtInPosts, source }: Props) {
  const live = Boolean(source && articlesEnabled);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  // Grids of a single category stay without buttons.
  const categories = live && counts && builtInCategories.length > 0 ? liveButtons(source!, counts) : builtInCategories;
  /** A category id as this grid knows it (a built-in id becomes the live button of the same name), or null. */
  const resolve = (id: string | null) => {
    if (!id || categories.some((c) => c.id === id)) return id;
    const label = builtInCategories.find((c) => c.id === id)?.label;
    return categories.find((c) => c.label === label)?.id ?? null;
  };

  // Links such as /product-reviews/?filter=195 open with that category chosen (unknown ids keep "All").
  const linked = useSyncExternalStore(subscribeNever, urlFilter, noFilter);
  const [chosen, setChosen] = useState<string | null>(null);
  const category = resolve(chosen) ?? resolve(linked) ?? 'all';
  // A new category starts at page 1.
  const [page, setPage] = useState(1);
  const chooseCategory = (id: string) => {
    setChosen(id);
    setPage(1);
  };
  const top = useRef<HTMLDivElement>(null);
  const goTo = (n: number) => {
    setPage(n);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Live: one page from the API. A built-in id not resolved yet (counts still loading) asks for the whole category.
  const path = category === 'all' || !category.includes('/') ? source : category;
  const [retry, setRetry] = useState(0);
  const requestKey = `${path}|${page}|${retry}`;
  const [result, setResult] = useState<Result | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!live || !path) return;
    let active = true;
    fetchArticles({ category: path, page, limit: PAGE_SIZE, counts: counts ? undefined : 1 }).then(
      (r) => {
        if (!active) return;
        if (r.counts) setCounts(r.counts);
        // Past the last page (articles removed meanwhile): the last page instead.
        if (r.page > r.pages && r.total > 0) return setPage(r.pages);
        setResult({ key: requestKey, posts: r.items.map(toFilterPost), pages: r.pages });
      },
      () => active && setFailedKey(requestKey),
    );
    return () => {
      active = false;
    };
    // `counts` only decides whether to ask for them (until they come).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, path, page, requestKey]);
  const failed = failedKey === requestKey;

  // Built-in cards (until the first answer, or when the API never answers): filtered and paged here.
  const builtIn = useMemo(() => {
    const matching = builtInPosts.filter(
      (post) => category === 'all' || post.categories.includes(category),
    );
    const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
    const at = Math.min(page, pages);
    return { posts: matching.slice((at - 1) * PAGE_SIZE, at * PAGE_SIZE), pages };
  }, [builtInPosts, category, page]);
  // While another page loads (or after it failed), the last one shown stays.
  const shown = live && result ? result : builtIn;
  const loading = live && result !== null && result.key !== requestKey && !failed;
  const posts = shown.posts;
  const pages = shown.pages;

  const [columns, setColumns] = useState(3);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const update = () => setColumns(columnsFor(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  const measured = posts.length > 0 && posts.every((p) => heights[p.id] !== undefined);
  const positions = new Map<string, { x: number; y: number }>();
  const columnHeights = Array(columns).fill(0);
  posts.forEach((post, i) => {
    const column = i % columns;
    positions.set(post.id, { x: column, y: columnHeights[column] });
    columnHeights[column] += heights[post.id] ?? 0;
  });

  return (
    <div className={styles.main} ref={top}>
      {categories.length > 0 && (
        <>
          <ul className={styles.filters}>
            {categories.map((c) => (
              <li key={c.id}>
                <button type="button" className={`${styles.button} ${category === c.id ? styles.active : ''}`} aria-pressed={category === c.id} onClick={() => chooseCategory(c.id)}>
                  <span>
                    {c.label} ({c.count})
                  </span>
                  <FaCheck aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {/* Until the cards are measured they sit floated in rows (still hidden), so the grid keeps its height. */}
      <div
        className={`${styles.container} ${measured ? styles.measured : ''} ${loading ? styles.loading : ''}`}
        style={{ height: measured ? Math.max(0, ...columnHeights) : undefined, '--bf-columns': columns } as CSSProperties}
        aria-busy={loading}
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
                  <a href={post.href}>
                    <h2 className={styles.title}>{post.title}</h2>
                  </a>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <div className={styles.meta}>
                    <FaComments aria-hidden /> {post.comments}
                  </div>
                  <div className={styles.readMore}>
                    <a className={styles.button} href={post.href}>
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
      {failed ? (
        <p className={styles.empty} role="alert">
          The articles couldn&apos;t be loaded.{' '}
          <button type="button" className={styles.retry} onClick={() => setRetry((n) => n + 1)}>
            Try again
          </button>
        </p>
      ) : (
        posts.length === 0 && !loading && <p className={styles.empty}>No articles found.</p>
      )}
      {pages > 1 ? (
        <nav className={styles.pager} aria-label="Pages">
          <button type="button" className={styles.pageLink} disabled={page === 1 || loading} onClick={() => goTo(page - 1)}>
            Previous
          </button>
          {pageNumbers(page, pages).map((n, i) =>
            n === null ? (
              <span key={`gap${i}`} className={styles.pageGap}>
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                className={`${styles.pageLink} ${n === page ? styles.pageCurrent : ''}`}
                aria-current={n === page ? 'page' : undefined}
                disabled={loading && n !== page}
                onClick={() => n !== page && goTo(n)}
              >
                {n}
              </button>
            ),
          )}
          <button type="button" className={styles.pageLink} disabled={page === pages || loading} onClick={() => goTo(page + 1)}>
            Next
          </button>
        </nav>
      ) : (
        // The plugin's (empty) pagination bar keeps its 20px margins and 1px height below the grid.
        <div className={styles.pagination} aria-hidden />
      )}
    </div>
  );
}
