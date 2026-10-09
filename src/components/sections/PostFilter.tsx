'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { FaComments } from 'react-icons/fa';
import { LuArrowUpDown, LuClock, LuMapPin, LuPenLine, LuSearch, LuTrendingUp, LuUsers, LuVolleyball } from 'react-icons/lu';
import FilterChip from '@/components/ui/FilterChip';
import MobileFilters, { type SheetDraft } from '@/components/ui/MobileFilters';
import { AppliedPill } from '@/components/ui/FilterPopover';
import Pager from '@/components/ui/Pager';
import PillSelect from '@/components/ui/PillSelect';
import ToggleChip from '@/components/ui/ToggleChip';
import ViewToggle, { type ResultsView } from '@/components/ui/ViewToggle';
import {
  ARTICLE_WRITERS,
  ARTICLE_CATEGORIES,
  ARTICLE_LENGTHS,
  ARTICLE_SORTS,
  ARTICLE_TAGS,
  articleSearchPlaceholder,
  articlesEnabled,
  countArticles,
  fetchArticles,
  locationName,
  toFilterPost,
  type ArticleSort,
} from '@/content/articles';
import type { FilterPost } from '@/content/types';
import DirectorySearch, { NO_SEARCH, fold, useSharedSearch, type Place, type Search } from './DirectorySearch';
import dir from './TeamDirectory.module.css';
import styles from './PostFilter.module.css';

type FilterCategory = { id: string; label: string; count: number };
type Props = {
  /** The original grid's category buttons (WordPress ids): only their names are used, to read old ?filter= links. */
  categories: FilterCategory[];
  /** The original grid's cards: shown when the API can't be reached. */
  posts: FilterPost[];
  /** The article category path the list shows ("strategy-and-insights", "sports-updates/sports-tourism"). */
  source?: string;
};

/** Cards per page (rows of three; 12 as on the experience directories), and the "Per page" choices. */
const PAGE_SIZES = [12, 24, 48] as const;
const VIEW_KEY = 'clp-articles-view';

/** The page URL's `?filter=` value (old links such as /product-reviews/?filter=195 pick that sport). */
const subscribeNever = () => () => {};
const urlFilter = () => new URLSearchParams(window.location.search).get('filter');
const noFilter = () => null;

type Result = {
  key: string;
  posts: FilterPost[];
  total: number;
  counts: Record<string, number>;
  lengths: Record<string, number>;
  authors: Record<string, number>;
  tags: Record<string, number>;
  places: Place[];
};

/** The tag filters' icons (Client Stories, Trending). */
const TAG_ICONS: Record<string, ReactNode> = { 'client-stories': <LuUsers />, trending: <LuTrendingUp /> };

/** Search words and spaces as applied ("  a   b " -> "a b"). */
const tidy = (text: string) => text.trim().replace(/\s+/g, ' ');

/**
 * A category's articles, as the experience directories list their listings: a search bar of words and location (on
 * the page heading's edge when the page puts it there, see BuilderPageView; the location field suggests the articles'
 * places), a Sport filter (one sport at a time, when the category has sport subcategories), a Writer filter (Compete
 * Like Pros, CLP Partners or Sponsor) and a Length filter (reading time), one choice each, a filter of each tag (Client
 * Stories, Trending: on or off, each on its own), grid or list view, and the same pager. The API searches, filters, counts and
 * pages them (newest first); a skeleton shows while the first page loads. If the API can't be reached, the
 * original grid's cards show instead (searched and paged here) with an offer to try again.
 */
export default function PostFilter({ categories: builtInCategories, posts: builtInPosts, source }: Props) {
  const live = Boolean(source && articlesEnabled);
  const topRef = useRef<HTMLDivElement>(null);

  // The Sport filter: the sports of the category's subcategories (a whole category only, not a subcategory's list).
  const category = ARTICLE_CATEGORIES.find((c) => c.slug === source?.split('/')[0]);
  const sportChoices = useMemo(
    () => (source && !source.includes('/') ? (category?.subcategories.filter((s) => s.sport) ?? []).map((s) => ({ value: s.sport!, label: s.name })) : []),
    [source, category],
  );

  // Old links (?filter=<WordPress id>) pick the sport of the button of that name.
  const linked = useSyncExternalStore(subscribeNever, urlFilter, noFilter);
  const linkedLabel = builtInCategories.find((c) => c.id === linked)?.label;
  const linkedSport = sportChoices.find((s) => s.label === linkedLabel)?.value;
  const [chosenSports, setChosenSports] = useState<string[] | null>(null);
  const sports = chosenSports ?? (linkedSport ? [linkedSport] : []);
  const [lengths, setLengths] = useState<string[]>([]);
  // The Writer filter: Compete Like Pros or CLP Partners (the API's `writer`), one at a time.
  const [writers, setWriters] = useState<string[]>([]);
  const writer = writers[0] ?? '';
  // The tag filters (Client Stories, Trending): each on or off; the articles have every tag that is on.
  const [tags, setTags] = useState<string[]>([]);
  // The search (words and location): the page's bar on the heading's edge when there is one, else this list's own.
  const shared = useSharedSearch();
  const [ownSearch, setOwnSearch] = useState<Search>(NO_SEARCH);
  const { q, loc } = shared ? shared.search : ownSearch;
  const setSearch = shared ? shared.setSearch : setOwnSearch;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [openFilter, setOpenFilter] = useState<'sport' | 'writer' | 'length' | null>(null);
  const chipOpen = (chip: 'sport' | 'writer' | 'length') => ({ open: openFilter === chip, onOpenChange: (open: boolean) => setOpenFilter(open ? chip : null) });
  const [sort, setSort] = useState<ArticleSort>('recommended');
  // A new search, sport or sort starts at page 1.
  const chooseSort = (next: ArticleSort) => {
    setSort(next);
    setPage(0);
  };
  const applySports = (values: string[]) => {
    setChosenSports(values);
    setPage(0);
  };
  const applyWriters = (values: string[]) => {
    setWriters(values);
    setPage(0);
  };
  const applyLengths = (values: string[]) => {
    setLengths(values);
    setPage(0);
  };
  const applyTags = (values: string[]) => {
    setTags(ARTICLE_TAGS.map((t) => t.value).filter((v) => values.includes(v)));
    setPage(0);
  };
  const toggleTag = (tag: string, on: boolean) => applyTags(on ? [...tags, tag] : tags.filter((t) => t !== tag));
  const applySearch = (next: Search) => {
    setSearch({ q: tidy(next.q), loc: tidy(next.loc) });
    setPage(0);
  };
  // The page's bar runs its searches here (back to page 1).
  const searchLatest = useRef(applySearch);
  useEffect(() => {
    searchLatest.current = applySearch;
  });
  const register = shared?.register;
  useEffect(() => register?.((next) => searchLatest.current(next)), [register]);
  const goTo = (n: number) => {
    setPage(n);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const choosePageSize = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  // Grid or list; the choice is remembered in this browser.
  const [display, setDisplay] = useState<ResultsView>('grid');
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after hydration (the export has no storage)
      if (localStorage.getItem(VIEW_KEY) === 'list') setDisplay('list');
    } catch {}
  }, []);
  const chooseView = (view: ResultsView) => {
    setDisplay(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}
  };

  // The API's page for the current search, location, sports, lengths, page and page size.
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([source, sports, writer, lengths, tags, q, loc, sort, page, pageSize, retry]);
  const [result, setResult] = useState<Result | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!live) return;
    let active = true;
    fetchArticles({ category: source, writer, sports, lengths, tags, q: q || undefined, loc: loc || undefined, sort, page: page + 1, limit: pageSize, counts: 1 }).then(
      (r) => {
        if (!active) return;
        // Past the last page (articles removed meanwhile): the last page.
        if (r.page > r.pages && r.total > 0) return setPage(r.pages - 1);
        // The location field's suggestions: the articles' cities (with every other filter applied), most articles first.
        const places = Object.entries(r.places ?? {})
          .map(([slug, count]) => ({ value: slug, label: locationName(slug), count }))
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        setResult({ key: requestKey, posts: r.items.map(toFilterPost), total: r.total, counts: r.counts ?? {}, lengths: r.lengths ?? {}, authors: r.authors ?? {}, tags: r.tags ?? {}, places });
      },
      () => active && setFailedKey(requestKey),
    );
    return () => {
      active = false;
    };
    // requestKey stands for source, sports, writer, lengths, tags, q, loc, sort, page, pageSize and retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, requestKey]);
  const failed = failedKey === requestKey;

  // The places the location field suggests (the page's bar gets them too).
  const places = result?.places;
  const sharePlaces = shared?.setPlaces;
  useEffect(() => {
    if (places) sharePlaces?.(places);
  }, [sharePlaces, places]);

  // Without the API (or before it ever answered, when it failed): the original cards, searched and paged here.
  const local = !live || (failed && !result);
  /** The original cards matching the search and some sports (their buttons of the same names); they have no location. */
  const matchLocal = (chosen: string[]) => {
    const words = fold(q).split(' ').filter(Boolean);
    const ids = new Set(builtInCategories.filter((c) => sportChoices.some((s) => chosen.includes(s.value) && s.label === c.label)).map((c) => c.id));
    return builtInPosts.filter(
      (post) =>
        (!chosen.length || post.categories.some((c) => ids.has(c))) &&
        (!loc || fold(post.location ?? '').includes(fold(loc))) &&
        words.every((w) => fold(`${post.title} ${post.excerpt}`).includes(w)),
    );
  };
  /** The original cards (newest first) in the chosen order. */
  const sortLocal = (list: FilterPost[]) => {
    if (sort === 'oldest') return [...list].reverse();
    if (sort === 'recommended') return list;
    const byTitle = [...list].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true }));
    return sort === 'title-desc' ? byTitle.reverse() : byTitle;
  };
  const localMatches = local ? sortLocal(matchLocal(sports)) : [];

  const loading = live && !result && !failed;
  const pending = live && result !== null && result.key !== requestKey && !failed;
  const total = local ? localMatches.length : (result?.total ?? 0);
  const posts = local ? localMatches.slice(page * pageSize, (page + 1) * pageSize) : (result?.posts ?? []);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Every sport of the category is offered, even one without articles (its count says 0).
  const sportOptions = sportChoices.map((s) => ({ ...s, count: local ? undefined : (result?.counts[s.value] ?? 0) }));
  // Every writer choice is offered, with its article count (0 included; none shown until the API answers); the built-in
  // cards have no writer.
  const writerOptions = local ? [] : ARTICLE_WRITERS.map((w) => ({ ...w, count: result ? (result.authors[w.value] ?? 0) : undefined }));
  // Reading lengths with articles (or chosen); the built-in cards have no reading time.
  const lengthOptions = local
    ? []
    : ARTICLE_LENGTHS.map((l) => ({ ...l, count: result?.lengths[l.value] ?? 0 })).filter((l) => l.count > 0 || lengths.includes(l.value));
  /** The API's count of a draft of one filter, with the others applied. */
  /** The tags a draft of the phones' sheet has on (its "tag:<value>" cards). */
  const sheetTags = (draft: SheetDraft) => ARTICLE_TAGS.map((t) => t.value).filter((v) => (draft[`tag:${v}`] ?? (tags.includes(v) ? [v] : [])).includes(v));
  const countWith = (draft: { sports?: string[]; writer?: string; lengths?: string[]; tags?: string[] }) =>
    countArticles({ category: source, writer, sports, lengths, tags, q: q || undefined, loc: loc || undefined, ...draft });

  // The cards have no column padding: --dir-col-gap 32px cancels the filter bar's indent (TeamDirectory lines it up
  // with its cards' 32px padding), so the Sport pill starts at the cards' left edge.
  const layout = { '--dir-width': '1200px', '--dir-col-gap': '32px' } as CSSProperties;

  return (
    <div ref={topRef} className={`${dir.directory} ${styles.directory}`} style={layout}>
      {!shared && (
        <div className={dir.searchSlot}>
          <DirectorySearch
            query={q}
            location={loc}
            places={places}
            label="Search articles"
            placeholder={articleSearchPlaceholder(source)}
            onSearch={(query, location) => applySearch({ q: query, loc: location })}
          />
        </div>
      )}
      <div className={dir.bar}>
        <div className={dir.barRow}>
          <div className={`${dir.filters} ${loading ? dir.busy : ''}`} inert={loading}>
            {sportOptions.length > 0 && (
              <FilterChip
                name="Sport"
                icon={<LuVolleyball />}
                plural="sports"
                single
                options={sportOptions}
                value={sports}
                {...chipOpen('sport')}
                {...(local ? { resultsFor: (draft: string[]) => matchLocal(draft).length } : { countFor: (draft: string[]) => countWith({ sports: draft }) })}
                onApply={applySports}
              />
            )}
            {writerOptions.length > 0 && (
              <FilterChip
                name="Writer"
                icon={<LuPenLine />}
                plural="writers"
                single
                options={writerOptions}
                value={writers}
                {...chipOpen('writer')}
                countFor={(draft: string[]) => countWith({ writer: draft[0] ?? '' })}
                onApply={applyWriters}
              />
            )}
            {lengthOptions.length > 0 && (
              <FilterChip
                name="Length"
                heading="Reading time"
                icon={<LuClock />}
                plural="lengths"
                single
                options={lengthOptions}
                value={lengths}
                {...chipOpen('length')}
                countFor={(draft: string[]) => countWith({ lengths: draft })}
                onApply={applyLengths}
              />
            )}
            {!local &&
              ARTICLE_TAGS.map((t) => (
                <ToggleChip
                  key={t.value}
                  label={t.label}
                  icon={TAG_ICONS[t.value]}
                  on={tags.includes(t.value)}
                  count={result?.tags[t.value]}
                  onChange={(on) => toggleTag(t.value, on)}
                />
              ))}
            {loc && <AppliedPill icon={<LuMapPin />} label={loc} onClear={() => applySearch({ q, loc: '' })} />}
            {q && <AppliedPill icon={<LuSearch />} label={`“${q}”`} onClear={() => applySearch({ q: '', loc })} />}
            {(q || loc || sports.length > 0 || writers.length > 0 || lengths.length > 0 || tags.length > 0) && (
              <button
                type="button"
                className={dir.clearAll}
                onClick={() => {
                  setSearch(NO_SEARCH);
                  setChosenSports([]);
                  applyWriters([]);
                  applyLengths([]);
                  applyTags([]);
                }}
              >
                Clear all
              </button>
            )}
          </div>
          {/* Phones: one Filters button (tenpo's sheet) in place of the pills and the sort menu. */}
          <div className={`${dir.mobileFilters} ${loading ? dir.busy : ''}`} inert={loading}>
            <MobileFilters
              sections={[
                ...(sportOptions.length > 0 ? [{ id: 'sport', heading: 'Sport', options: sportOptions, value: sports, single: true }] : []),
                ...(writerOptions.length > 0 ? [{ id: 'writer', heading: 'Writer', options: writerOptions, value: writers, single: true }] : []),
                ...(lengthOptions.length > 0 ? [{ id: 'length', heading: 'Reading time', options: lengthOptions, value: lengths, single: true }] : []),
                // Each tag its own filter: a card with its one checkbox.
                ...(local
                  ? []
                  : ARTICLE_TAGS.map((t) => ({
                      id: `tag:${t.value}`,
                      heading: t.label,
                      options: [{ value: t.value, label: `${t.label} only`, count: result?.tags[t.value] }],
                      value: tags.includes(t.value) ? [t.value] : [],
                    }))),
              ]}
              sort={{ value: sort, options: ARTICLE_SORTS }}
              applied={(sports.length > 0 ? 1 : 0) + (writers.length > 0 ? 1 : 0) + (lengths.length > 0 ? 1 : 0) + tags.length}
              countFor={(draft) =>
                local
                  ? matchLocal(draft.sport ?? sports).length
                  : countWith({
                      sports: draft.sport ?? sports,
                      writer: (draft.writer ?? writers)[0] ?? '',
                      lengths: draft.length ?? lengths,
                      tags: sheetTags(draft),
                    })
              }
              onApply={(draft, nextSort) => {
                applySports(draft.sport ?? sports);
                applyWriters(draft.writer ?? writers);
                applyLengths(draft.length ?? lengths);
                if (!local) applyTags(sheetTags(draft));
                if (nextSort) chooseSort(nextSort as ArticleSort);
              }}
            />
          </div>
          <div className={`${dir.sortSlot} ${loading ? dir.busy : ''}`} inert={loading}>
            <span className={dir.sortDesktop}>
              <PillSelect value={sort} options={ARTICLE_SORTS} onChange={chooseSort} label="Sort articles" icon={<LuArrowUpDown />} />
            </span>
            <ViewToggle value={display} onChange={chooseView} />
          </div>
        </div>
        {failed && (
          <div className={dir.found} role="status">
            The articles couldn&apos;t be loaded.{' '}
            <button type="button" className={styles.retry} onClick={() => setRetry((n) => n + 1)}>
              Try again
            </button>
          </div>
        )}
      </div>

      <div className={`${styles.results} ${pending ? styles.pending : ''}`} aria-busy={loading || pending}>
        {loading ? (
          <div className={display === 'list' ? styles.list : styles.grid} aria-hidden>
            {Array.from({ length: display === 'list' ? 3 : 6 }, (_, i) => (
              <div key={i} className={`${styles.skeleton} ${display === 'list' ? styles.skeletonRow : styles.skeletonCard}`} />
            ))}
          </div>
        ) : display === 'list' ? (
          <div className={styles.list}>
            {posts.map((post, i) => (
              <ArticleRow key={post.id} post={post} eager={i < 3} />
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((post, i) => (
              <ArticleCard key={post.id} post={post} eager={i < 3} />
            ))}
          </div>
        )}
        {!loading && !pending && posts.length === 0 && (
          <div className={styles.emptyWrap} role="status">
            <div className={styles.empty}>No Results Found</div>
          </div>
        )}
        {!loading && total > PAGE_SIZES[0] && (
          <Pager
            page={page}
            pageCount={pageCount}
            total={total}
            shown={posts.length}
            pageSize={pageSize}
            sizes={PAGE_SIZES}
            loading={pending}
            onPage={goTo}
            onPageSize={choosePageSize}
          />
        )}
      </div>
    </div>
  );
}

/** The date badge on a card's photo ("07 / OCT"). */
function DateBadge({ post }: { post: FilterPost }) {
  return (
    <span className={styles.date}>
      <span className={styles.day}>{post.day}</span>
      <span className={styles.month}>{post.month}</span>
    </span>
  );
}

/** A card's foot: comments | reading time, then Read More. */
function Foot({ post }: { post: FilterPost }) {
  return (
    <div className={styles.foot}>
      <span className={styles.meta}>
        <span className={styles.metaItem}>
          <FaComments aria-hidden /> {post.comments}
        </span>
        {post.readingTime && (
          <>
            <span className={styles.metaSep} aria-hidden>
              |
            </span>
            <span className={styles.metaItem}>
              <LuClock aria-hidden /> {post.readingTime}
            </span>
          </>
        )}
      </span>
      <a className={styles.readMore} href={post.href} aria-label={`Read more: ${post.title}`}>
        Read More
      </a>
    </div>
  );
}

/** Grid card: photo with the date, title, excerpt, comments | reading time and Read More. */
function ArticleCard({ post, eager }: { post: FilterPost; eager: boolean }) {
  return (
    <article className={styles.card}>
      <a href={post.href} className={styles.thumb} tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- the article's cover */}
        {post.image && <img src={post.image} alt="" loading={eager ? 'eager' : 'lazy'} />}
        <DateBadge post={post} />
      </a>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <a href={post.href}>{post.title}</a>
        </h3>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        <Foot post={post} />
      </div>
    </article>
  );
}

/** List row: photo on the left, then the same content. */
function ArticleRow({ post, eager }: { post: FilterPost; eager: boolean }) {
  return (
    <article className={styles.row}>
      <a href={post.href} className={styles.rowThumb} tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- the article's cover */}
        {post.image && <img src={post.image} alt="" loading={eager ? 'eager' : 'lazy'} />}
        <DateBadge post={post} />
      </a>
      <div className={styles.rowBody}>
        <h3 className={styles.title}>
          <a href={post.href}>{post.title}</a>
        </h3>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        <Foot post={post} />
      </div>
    </article>
  );
}
