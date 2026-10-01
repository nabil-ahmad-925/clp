'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { LuAccessibility, LuCalendar, LuChartNoAxesColumn, LuDollarSign, LuHandshake, LuHeartPulse, LuMapPin, LuPlane, LuSparkles, LuUsers, LuVolleyball } from 'react-icons/lu';
import FilterChip from '@/components/ui/FilterChip';
import { cachedListings, listingsEnabled, queryListings, type AddedItem, type ListingsResult } from '@/content/listings';
import type { DirectoryFilter, DirectoryItem, DirectoryLayout } from '@/content/types';
import BioModal from './BioModal';
import TeamCard from './TeamCard';
import styles from './TeamDirectory.module.css';

type Props = {
  layout: DirectoryLayout;
  filters: DirectoryFilter[];
  items: DirectoryItem[];
  paging?: { first: number; more: number };
  /** The directory widget; served by the listings API, its cards and filtering come from there (see below). */
  widgetId?: number;
};

/** Cards matching every filter: within one filter any ticked value will do, and an empty filter matches all. */
const matching = (items: DirectoryItem[], chosen: string[][]) =>
  items.filter((item) => chosen.every((values) => values.length === 0 || values.some((v) => item.tags.includes(v))));

/** Chip names and icons by filter key (the plugin's own labels are inconsistent: "ALL AGE", "cost", "Date"…). */
const CHIPS: Record<string, { name: string; icon: ReactNode }> = {
  'extra-one': { name: 'Sport', icon: <LuVolleyball /> },
  alldates: { name: 'When', icon: <LuCalendar /> },
  age: { name: 'Age', icon: <LuUsers /> },
  'age-group': { name: 'Age', icon: <LuUsers /> },
  'extra-five': { name: 'Price', icon: <LuDollarSign /> },
  'all-cost': { name: 'Price', icon: <LuDollarSign /> },
  language: { name: 'City', icon: <LuMapPin /> },
  city: { name: 'City', icon: <LuMapPin /> },
  destinations: { name: 'Destination', icon: <LuPlane /> },
  specialty: { name: 'Skill Level', icon: <LuChartNoAxesColumn /> },
  'extra-two': { name: 'Accessibility', icon: <LuAccessibility /> },
  'extra-three': { name: 'Partner', icon: <LuHandshake /> },
  'extra-four': { name: 'Performance/Rehab', icon: <LuHeartPulse /> },
};

const chipFor = (filter: DirectoryFilter) => {
  if (filter.key && CHIPS[filter.key]) return CHIPS[filter.key];
  if (filter.key?.startsWith('experience')) return { name: 'Experience', icon: <LuSparkles /> };
  const name = filter.label.replace(/^all\s+/i, '').toLowerCase();
  return { name: name.replace(/\b\w/g, (c) => c.toUpperCase()), icon: <LuSparkles /> };
};

/** API mode: the listing service filters and counts in DynamoDB. Local mode: the built-in cards, filtered here. */
type Mode = 'loading' | 'api' | 'local';
type View = { mode: Mode; result: ListingsResult | null; resultKey: string; pending: boolean; error: boolean };

/**
 * Filterable directory of partners (the team plugin's "filter" display): pill filters with checkbox panels above
 * a four-column card grid; a card shows only when it matches every filter. Cards open the full-screen bio.
 * Filters start on their `preset` option (the sport of the page); `hidden` ones apply without being shown.
 *
 * Widgets served by the listings API load their cards from it (a skeleton shows meanwhile); a filter is sent to the
 * API only when its "Show results" is pressed, and the answer brings the results and the option counts. When it has no listings for the page, fails or is slow, the
 * page falls back to its built-in cards, filtered in the browser.
 */
export default function TeamDirectory({ layout, filters, items: builtIn, paging, widgetId }: Props) {
  const enabled = listingsEnabled(widgetId);
  const presets = filters.map((f) => (f.preset ? [f.preset] : []));
  // Every option is listed as on the original menus; the empty-valued one is the filter's "All …" choice.
  const menus = filters
    .map((filter, i) => ({ filter, i, all: filter.options.find((o) => !o.value), options: filter.options.filter((o) => o.value) }))
    .filter(({ filter }) => !filter.hidden && filter.options.length > 0);
  // API data covers the page's own preset (its sport) only, so there that menu stays on it: applied, not shown.
  const facetGroups = menus.filter(({ filter }) => !filter.preset).map(({ i }) => i);

  const [chosen, setChosen] = useState<string[][]>(presets);
  const filterKey = JSON.stringify(chosen);
  const [view, setView] = useState<View>(() => {
    const base = { resultKey: JSON.stringify(presets), pending: false, error: false };
    if (!enabled) return { ...base, mode: 'local', result: null };
    const cached = cachedListings(widgetId, presets, facetGroups);
    if (!cached) return { ...base, mode: 'loading', result: null };
    return cached.total > 0 ? { ...base, mode: 'api', result: cached } : { ...base, mode: 'local', result: null };
  });
  const { mode, result } = view;

  // First load (filters on their presets): API listings for this page, or the built-in cards when it has none.
  const initial = useRef({ presets, facetGroups });
  useEffect(() => {
    if (view.mode !== 'loading' || widgetId == null) return;
    let active = true;
    queryListings(widgetId, initial.current.presets, initial.current.facetGroups).then(
      (r) => active && setView((v) => ({ ...v, mode: r.total > 0 ? 'api' : 'local', result: r.total > 0 ? r : null })),
      () => active && setView((v) => ({ ...v, mode: 'local', result: null })),
    );
    return () => {
      active = false;
    };
  }, [view.mode, widgetId]);

  // Image fallbacks: an API card imported from a built-in card (sourceId) uses its image when it has none of its own.
  const byId = useMemo(() => new Map(builtIn.map((b) => [b.id, b])), [builtIn]);
  const apiItems = useMemo(
    () =>
      (result?.items ?? []).map((a) => {
        const local = a.sourceId ? byId.get(a.sourceId) : undefined;
        return local ? { ...a, image: a.image || local.image, bioImage: a.bioImage || local.bioImage, fallbackImage: local.image } : a;
      }),
    [result, byId],
  );
  const filtered: DirectoryItem[] = useMemo(
    () => (mode === 'api' ? apiItems : mode === 'local' ? matching(builtIn, chosen) : []),
    [mode, apiItems, builtIn, chosen],
  );

  const [open, setOpen] = useState<DirectoryItem | null>(null);
  const [openFilter, setOpenFilter] = useState<number | null>(null);
  // Paged widgets start again from the first page whenever the filters change.
  const shownKey = mode === 'api' ? view.resultKey : filterKey;
  const [pages, setPages] = useState({ key: '', count: paging?.first ?? Infinity });
  const limit = pages.key === shownKey ? pages.count : (paging?.first ?? Infinity);

  // As on the original, "No Results Found" appears only when a filter change empties a grid that had cards
  // (a page whose preset already matches nothing stays blank), and goes away once cards match again.
  const [emptyShown, setEmptyShown] = useState(false);
  const showCount = (count: number) => setEmptyShown((prev) => (count > 0 ? false : filtered.length > 0 ? true : prev));

  // Only the answer to the latest filter change is shown.
  const latest = useRef(0);
  const apply = (next: string[][]) => {
    setChosen(next);
    if (mode !== 'api' || widgetId == null) {
      showCount(matching(builtIn, next).length);
      return;
    }
    const request = ++latest.current;
    setView((v) => ({ ...v, pending: true, error: false }));
    queryListings(widgetId, next, facetGroups).then(
      (r) => {
        if (request !== latest.current) return;
        showCount(r.total);
        setView((v) => ({ ...v, result: r, resultKey: JSON.stringify(next), pending: false }));
      },
      () => request === latest.current && setView((v) => ({ ...v, pending: false, error: true })),
    );
  };
  const withFilter = (i: number, values: string[]) => chosen.map((v, j) => (j === i ? values : v));
  // Preset menus (the sport) show only on the built-in cards; with API data (or while loading) they stay locked.
  const locked = (f: DirectoryFilter) => Boolean(f.hidden || (mode !== 'local' && f.preset));
  const shown = menus.filter(({ filter }) => !locked(filter));
  const anyChosen = shown.some(({ i }) => chosen[i].length > 0);
  const loading = mode === 'loading';

  /** A chip's counts: from the API's facets in API mode, else counted over the built-in cards. */
  const chipCounts = (i: number) => {
    if (mode === 'api') {
      const facet = result?.facets[i];
      return { all: facet?.total ?? 0, of: (v: string) => facet?.counts[v] ?? 0 };
    }
    const others = matching(builtIn, withFilter(i, []));
    return { all: others.length, of: (v: string) => others.filter((item) => item.tags.includes(v)).length };
  };
  // Placeholders while loading: as many as the built-in cards would show (at most two rows), so the page barely shifts.
  const placeholders = Math.min(Math.max(matching(builtIn, presets).length, 4), 8);

  const vars = {
    '--dir-width': layout.width ?? '1200px',
    '--dir-col-gap': layout.colGap != null ? `${layout.colGap}px` : '0px',
    '--dir-row-gap': layout.rowGap != null ? `${layout.rowGap}px` : '0px',
  } as CSSProperties;

  return (
    <div className={styles.directory} style={vars}>
      {shown.length === 0 ? (
        <div className={styles.noFilters} />
      ) : (
        <div className={styles.bar}>
          <div className={`${styles.filters} ${loading ? styles.busy : ''}`} inert={loading}>
            {shown.map(({ filter, i, all, options }) => {
              const { name, icon } = chipFor(filter);
              // Each option's count assumes the other filters as applied.
              const counts = chipCounts(i);
              return (
                <FilterChip
                  key={filter.key ?? filter.label}
                  name={name}
                  icon={icon}
                  all={all && { ...all, count: counts.all }}
                  options={options.map((o) => ({ ...o, count: counts.of(o.value) }))}
                  value={chosen[i]}
                  open={openFilter === i}
                  onOpenChange={(isOpen) => setOpenFilter(isOpen ? i : null)}
                  resultsFor={mode === 'local' ? (draft) => matching(builtIn, withFilter(i, draft)).length : undefined}
                  onApply={(values) => apply(withFilter(i, values))}
                />
              );
            })}
            {anyChosen && (
              <button type="button" className={styles.clearAll} onClick={() => apply(chosen.map((v, j) => (locked(filters[j]) ? v : [])))}>
                Clear all
              </button>
            )}
          </div>
          <div className={styles.found} role="status">
            {loading || view.pending
              ? 'Loading…'
              : view.error
                ? 'Could not update the results. Please try again.'
                : `${filtered.length} ${filtered.length === 1 ? 'result' : 'results'} found`}
          </div>
        </div>
      )}
      <div className={`${styles.inner} ${view.pending ? styles.pending : ''}`} aria-busy={loading || view.pending}>
        {loading ? (
          <div className={styles.row} aria-hidden>
            {Array.from({ length: placeholders }, (_, i) => (
              <div key={i} className={`${styles.col} ${styles.skeletonCol}`}>
                <div className={styles.skeleton} />
              </div>
            ))}
          </div>
        ) : (
          /* Re-keying on the filter state replays the fade/scale-in, like the original's filtering animation. */
          <div key={shownKey} className={styles.row}>
            {filtered.slice(0, limit).map((item) => (
              <div key={item.id} className={styles.col}>
                <TeamCard card={item} variant="wps" fallbackImage={(item as AddedItem).fallbackImage} onOpen={() => setOpen(item)} />
              </div>
            ))}
          </div>
        )}
        {!loading && paging && limit < filtered.length && (
          <div className={styles.loadMore}>
            <button type="button" className={styles.loadMoreBtn} onClick={() => setPages({ key: shownKey, count: limit + paging.more })}>
              <svg viewBox="0 0 32 32" aria-hidden>
                <path d="M28,16c-1.219,0-1.797,0.859-2,1.766C25.269,21.03,22.167,26,16,26c-5.523,0-10-4.478-10-10S10.477,6,16,6 c2.24,0,4.295,0.753,5.96,2H20c-1.104,0-2,0.896-2,2s0.896,2,2,2h6c1.104,0,2-0.896,2-2V4c0-1.104-0.896-2-2-2s-2,0.896-2,2v0.518 C21.733,2.932,18.977,2,16,2C8.268,2,2,8.268,2,16s6.268,14,14,14c9.979,0,14-9.5,14-11.875C30,16.672,28.938,16,28,16z" />
              </svg>
              <span>Load More</span>
            </button>
            <div className={styles.loadStatus}>
              {limit} / {filtered.length}
            </div>
          </div>
        )}
        {!loading && !view.pending && filtered.length === 0 && emptyShown && (
          <div className={styles.emptyWrap} role="status">
            <div className={styles.empty}>No Results Found</div>
          </div>
        )}
      </div>

      {open && <BioModal card={open} variant="wps" onClose={() => setOpen(null)} />}
    </div>
  );
}
