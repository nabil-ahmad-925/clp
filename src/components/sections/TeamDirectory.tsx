'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  LuAccessibility,
  LuCalendar,
  LuChartNoAxesColumn,
  LuChevronLeft,
  LuChevronRight,
  LuDollarSign,
  LuHandshake,
  LuHeartPulse,
  LuLayoutGrid,
  LuList,
  LuMapPin,
  LuPlane,
  LuSearch,
  LuSparkles,
  LuUsers,
  LuVolleyball,
} from 'react-icons/lu';
import FilterChip from '@/components/ui/FilterChip';
import { AppliedPill } from '@/components/ui/FilterPopover';
import PillSelect from '@/components/ui/PillSelect';
import PriceChip, { priceBuckets, type PriceBucket } from '@/components/ui/PriceChip';
import SortSelect, { type Sort } from '@/components/ui/SortSelect';
import { countListings, listingsEnabled, listingsPage, queryListings, type AddedItem, type ListingsResult } from '@/content/listings';
import type { DirectoryFilter, DirectoryItem, DirectoryLayout } from '@/content/types';
import BioModal from './BioModal';
import DirectoryRow, { type RowFacts } from './DirectoryRow';
import DirectorySearch, { NO_SEARCH, fold, useSharedSearch, type Place, type Search } from './DirectorySearch';
import TeamCard from './TeamCard';
import styles from './TeamDirectory.module.css';

type Props = {
  layout: DirectoryLayout;
  filters: DirectoryFilter[];
  items: DirectoryItem[];
  /** The plugin's "Load More" setting, from the page data; the pager's page sizes (PAGE_SIZES) replace it. */
  paging?: { first: number; more: number };
  /** The directory widget; served by the listings API, its cards and filtering come from there (see below). */
  widgetId?: number;
};

/** A card's tags as the API's location search reads them (see clp-api placeTextOf): "new-york" -> "newyork", "new york". */
const placeText = (tags: string[]) => ` ${tags.flatMap((t) => [t.replace(/[^a-z0-9]/g, ''), t.replace(/-+/g, ' ')]).join(' ')} `;

/** Whether a card matches the search, as the listings API matches it (case and accents ignored). */
function found(item: DirectoryItem, { q, loc }: Search) {
  const words = fold(q).split(' ').filter(Boolean);
  if (words.length) {
    const text = fold([item.title, item.subtitle, item.excerpt].filter(Boolean).join(' '));
    if (!words.every((w) => text.includes(w))) return false;
  }
  const place = fold(loc)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (place) {
    const tags = placeText(item.tags);
    if (!tags.includes(` ${place}`) && !tags.includes(` ${place.replace(/ /g, '')}`)) return false;
  }
  return true;
}

/** Cards matching every filter (within one filter any ticked value will do; an empty filter matches all) and the search. */
const matching = (items: DirectoryItem[], chosen: string[][], search: Search = NO_SEARCH) =>
  items.filter((item) => chosen.every((values) => values.length === 0 || values.some((v) => item.tags.includes(v))) && found(item, search));

/** Filters whose options are places: the search bar's "Location" takes their place, so they get no pill. */
const LOCATION_KEYS = ['language', 'city', 'destinations'];

/**
 * Chip names and icons by filter key (the plugin's own labels are inconsistent: "ALL AGE", "cost", "Date"…), with
 * the panel caption and the plural used for several values ("2 cities"), as on tenpo.com.
 */
type Chip = { name: string; icon: ReactNode; heading?: string; plural?: string };
const CHIPS: Record<string, Chip> = {
  'extra-one': { name: 'Sport', icon: <LuVolleyball />, plural: 'sports' },
  alldates: { name: 'When', icon: <LuCalendar />, plural: 'months' },
  age: { name: 'Age', icon: <LuUsers />, heading: 'Age group', plural: 'groups' },
  'age-group': { name: 'Age', icon: <LuUsers />, heading: 'Age group', plural: 'groups' },
  'extra-five': { name: 'Price', icon: <LuDollarSign /> },
  'all-cost': { name: 'Price', icon: <LuDollarSign /> },
  language: { name: 'City', icon: <LuMapPin />, plural: 'cities' },
  city: { name: 'City', icon: <LuMapPin />, plural: 'cities' },
  destinations: { name: 'Destination', icon: <LuPlane />, plural: 'destinations' },
  specialty: { name: 'Skill Level', icon: <LuChartNoAxesColumn />, plural: 'levels' },
  'extra-two': { name: 'Accessibility', icon: <LuAccessibility />, plural: 'selected' },
  'extra-three': { name: 'Partner', icon: <LuHandshake />, plural: 'partners' },
  'extra-four': { name: 'Performance/Rehab', icon: <LuHeartPulse />, plural: 'services' },
};

const chipFor = (filter: DirectoryFilter): Chip => {
  if (filter.key && CHIPS[filter.key]) return CHIPS[filter.key];
  if (filter.key?.startsWith('experience')) return { name: 'Experience', icon: <LuSparkles />, plural: 'experiences' };
  const name = filter.label.replace(/^all\s+/i, '').toLowerCase();
  return { name: name.replace(/\b\w/g, (c) => c.toUpperCase()), icon: <LuSparkles /> };
};

/** "Boston", "Boston +2": the first of a card's labels, with how many more it has. */
const firstOf = (labels: string[]) =>
  labels.length === 0 ? undefined : labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`;
const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;

/** A list row's details from the card's tags: its city, ages, months and price range (as the filters label them). */
function rowFacts(item: DirectoryItem, filters: DirectoryFilter[], prices: Map<string, PriceBucket>): RowFacts {
  const labelsOf = (test: (key: string) => boolean) =>
    filters
      .filter((f) => f.key && test(f.key))
      .flatMap((f) => f.options.filter((o) => o.value && item.tags.includes(o.value)).map((o) => o.label));
  const months = MONTHS.map((m, i) => (item.tags.includes(m) ? MONTH_SHORT[i] : '')).filter(Boolean);
  const buckets = item.tags.flatMap((t) => (prices.has(t) ? [prices.get(t)!] : []));
  let price: string | undefined;
  if (buckets.length) {
    const min = Math.min(...buckets.map((b) => b.min));
    const max = Math.max(...buckets.map((b) => b.max));
    price =
      max === 0 ? 'Free' : !Number.isFinite(max) ? `${dollars(min)}+` : min === max ? dollars(min) : `${dollars(min)} – ${dollars(max)}`;
  }
  return {
    city: firstOf([...new Set(labelsOf((k) => LOCATION_KEYS.includes(k)))]),
    ages: firstOf(labelsOf((k) => k === 'age' || k === 'age-group')),
    months: months.length > 3 ? `${months.slice(0, 3).join(', ')} +${months.length - 3}` : months.join(', ') || undefined,
    price,
  };
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * The cards in the chosen order. "Recommended" keeps the directory's own; by price, a card counts at its cheapest
 * price option (dearest first: its dearest one); "Soonest" goes by its next month from now. Cards without a price
 * (or month) come last, in their own order.
 */
function sortItems(items: DirectoryItem[], sort: Sort, prices: Map<string, PriceBucket>) {
  if (sort === 'featured') return items;
  const now = new Date().getMonth();
  const key = (item: DirectoryItem): number | null => {
    if (sort === 'soonest') {
      const months = item.tags.map((t) => MONTHS.indexOf(t)).filter((m) => m >= 0);
      return months.length ? Math.min(...months.map((m) => (m - now + 12) % 12)) : null;
    }
    const mins = item.tags.flatMap((t) => (prices.has(t) ? [prices.get(t)!.min] : []));
    if (!mins.length) return null;
    return sort === 'price-asc' ? Math.min(...mins) : -Math.max(...mins);
  };
  const keyed = items.map((item, i) => ({ item, i, k: key(item) }));
  keyed.sort((a, b) => (a.k == null ? 1 : 0) - (b.k == null ? 1 : 0) || (a.k ?? 0) - (b.k ?? 0) || a.i - b.i);
  return keyed.map((x) => x.item);
}

const VIEW_KEY = 'clp-directory-view';

/** Cards per page (rows of four): the default, and the "Per page" choices. */
const PAGE_SIZE = 12;
const PAGE_SIZES = [12, 24, 48];

/**
 * The page numbers to show (0-based) around the current one, with null for a gap: first, last, and the current with
 * its neighbours ("1 … 4 5 6 … 12"); a gap of a single page shows that page instead.
 */
function pageNumbers(current: number, total: number): (number | null)[] {
  const near = [...new Set([0, total - 1, current - 1, current, current + 1])].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  near.forEach((n, i) => {
    const prev = i ? near[i - 1] : -1;
    if (n - prev === 2) out.push(prev + 1);
    else if (n - prev > 2) out.push(null);
    out.push(n);
  });
  return out;
}
/** The API's order for a sort ("Recommended" is its default, newest first). */
const apiSort = (sort: Sort) => (sort === 'featured' ? undefined : sort);

/** What the shown results were loaded with (view.resultKey): filters, search, sort and page size. */
type ResultKey = Search & { g: string[][]; sort: Sort; size: number };

/** API mode: the listing service filters and counts in DynamoDB. Local mode: the built-in cards, filtered here. */
type Mode = 'loading' | 'api' | 'local';
type View = {
  mode: Mode;
  result: ListingsResult | null;
  resultKey: string;
  pending: boolean;
  error: boolean;
  /** A page being fetched (the pager waits). */
  more: boolean;
  /** API pages fetched so far for resultKey (page 0 is result.items), and the cursor that fetches each page. */
  pages: AddedItem[][];
  cursors: (string | null)[];
};

/**
 * Filterable directory of partners (the team plugin's "filter" display): pill filters with checkbox panels above
 * a four-column card grid; a card shows only when it matches every filter. Cards open the full-screen bio.
 * Filters start on their `preset` option (the sport of the page); `hidden` ones apply without being shown.
 *
 * Widgets served by the listings API load their cards from it (a skeleton shows meanwhile); a filter is sent to the
 * API only when its "Show results" is pressed, and the answer brings the first page of results, their total and the
 * option counts. The pager (Previous / page numbers / Next, and the page size) fetches other pages with the API's
 * cursors; every page fetched is kept, so going back is instant.
 * When the API has no listings for the page, fails or is slow, the page falls back to its built-in cards, filtered
 * (and paged) in the browser.
 */
export default function TeamDirectory({ layout, filters, items: builtIn, widgetId }: Props) {
  const enabled = listingsEnabled(widgetId);
  const presets = filters.map((f) => (f.preset ? [f.preset] : []));
  // The empty-valued option is the plugin's "All …" choice; as on tenpo.com, the panel's "Clear" does that instead.
  const menus = filters
    .map((filter, i) => ({
      filter,
      i,
      options: filter.options.filter((o) => o.value),
      buckets: priceBuckets(filter.options.filter((o) => o.value)),
    }))
    .filter(({ filter, options }) => !filter.hidden && options.length > 0);
  // Every price option (of any price filter) as a dollar range, for the price sorts.
  const prices = useMemo(
    () => new Map(filters.flatMap((f) => priceBuckets(f.options.filter((o) => o.value)) ?? []).map((b) => [b.value, b] as const)),
    [filters],
  );
  // API data covers the page's own preset (its sport) only, so there that menu stays on it: applied, not shown.
  const facetGroups = menus.filter(({ filter }) => !filter.preset).map(({ i }) => i);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<Sort>('featured');

  const [chosen, setChosen] = useState<string[][]>(presets);
  // The applied search (searched by the API in API mode, else here over the built-in cards). On a directory page the
  // bar sits under the page heading and shares it (see DirectorySearchProvider); elsewhere the directory has its own.
  const shared = useSharedSearch();
  const [ownSearch, setOwnSearch] = useState<Search>(NO_SEARCH);
  const search = shared?.search ?? ownSearch;
  const setSearch = shared?.setSearch ?? setOwnSearch;
  // Read by the first load, which may finish after a search was made.
  const searchNow = useRef(search);
  useEffect(() => {
    searchNow.current = search;
  });
  const filterKey = JSON.stringify({ g: chosen, ...search });
  const [view, setView] = useState<View>(() => {
    const base = {
      resultKey: JSON.stringify({ g: presets, ...NO_SEARCH, sort: 'featured', size: PAGE_SIZE } satisfies ResultKey),
      pending: false,
      error: false,
      more: false,
      pages: [],
      cursors: [],
    };
    // API widgets always load fresh from the API (nothing is cached).
    return { ...base, mode: enabled ? 'loading' : 'local', result: null };
  });
  const { mode, result } = view;
  // The page shown: every change of filters, search, sort or page size starts again from the first one.
  const shownKey = mode === 'api' ? view.resultKey : `${filterKey}|${sort}|${pageSize}`;
  const [page, setPage] = useState({ key: '', index: 0 });
  const pageIndex = page.key === shownKey ? page.index : 0;

  // First load (filters on their presets): API listings for this page, or the built-in cards when it has none.
  const initial = useRef({ presets, facetGroups, firstPage: PAGE_SIZE });
  useEffect(() => {
    if (view.mode !== 'loading' || widgetId == null) return;
    let active = true;
    const { presets: groups, facetGroups: facets, firstPage: limit } = initial.current;
    queryListings(widgetId, groups, facets, limit)
      .then(async (r) => {
        // Searched while the page was loading: the API's listings for that search instead.
        const searched = searchNow.current;
        if (r.total === 0 || (!searched.q && !searched.loc)) return { r, searched: NO_SEARCH };
        return { r: await queryListings(widgetId, groups, facets, limit, searched), searched };
      })
      .then(
        ({ r, searched }) =>
          active &&
          setView((v) => ({
            ...v,
            mode: r.total > 0 || searched !== NO_SEARCH ? 'api' : 'local',
            result: r.total > 0 || searched !== NO_SEARCH ? r : null,
            resultKey: JSON.stringify({ g: groups, ...searched, sort: 'featured', size: limit } satisfies ResultKey),
            pages: [r.items],
            cursors: [null, r.nextCursor],
          })),
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
      (view.pages[pageIndex] ?? []).map((a) => {
        const local = a.sourceId ? byId.get(a.sourceId) : undefined;
        return local
          ? {
              ...a,
              image: a.image || local.image,
              bioImage: a.bioImage || local.bioImage,
              bioImages: a.bioImages ?? (local.bioImage ? [local.bioImage] : undefined),
              fallbackImage: local.image,
            }
          : a;
      }),
    [view.pages, pageIndex, byId],
  );
  const filtered: DirectoryItem[] = useMemo(
    () => (mode === 'api' ? apiItems : mode === 'local' ? matching(builtIn, chosen, search) : []),
    [mode, apiItems, builtIn, chosen, search],
  );

  // Grid (the plugin's cards) or list (tenpo.com's rows); the choice is remembered in this browser.
  const [display, setDisplay] = useState<'grid' | 'list'>('grid');
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after hydration (the export has no storage)
      if (localStorage.getItem(VIEW_KEY) === 'list') setDisplay('list');
    } catch {}
  }, []);
  const chooseView = (v: 'grid' | 'list') => {
    setDisplay(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };
  // The API sorts its listings (across every page); the built-in cards are sorted here.
  const sorted = useMemo(() => (mode === 'api' ? filtered : sortItems(filtered, sort, prices)), [mode, filtered, sort, prices]);
  // The cards of the page shown: the API page as fetched, or a slice of the built-in cards.
  const pageItems = mode === 'api' ? sorted : sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const totalFound = mode === 'api' ? (result?.total ?? 0) : filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalFound / pageSize));
  const [open, setOpen] = useState<DirectoryItem | null>(null);
  const [openFilter, setOpenFilter] = useState<number | null>(null);
  // As on the original, "No Results Found" appears only when a filter change empties a grid that had cards
  // (a page whose preset already matches nothing stays blank), and goes away once cards match again.
  const [emptyShown, setEmptyShown] = useState(false);
  const showCount = (count: number) => setEmptyShown((prev) => (count > 0 ? false : filtered.length > 0 ? true : prev));

  // Only the answer to the latest filter change is shown.
  const latest = useRef(0);
  const apply = (next: string[][], nextSearch = search, nextSort = sort, nextSize = pageSize) => {
    setChosen(next);
    if (mode !== 'api' || widgetId == null) {
      showCount(matching(builtIn, next, nextSearch).length);
      return;
    }
    const request = ++latest.current;
    setView((v) => ({ ...v, pending: true, error: false }));
    queryListings(widgetId, next, facetGroups, nextSize, { ...nextSearch, sort: apiSort(nextSort) }).then(
      (r) => {
        if (request !== latest.current) return;
        showCount(r.total);
        setView((v) => ({
          ...v,
          result: r,
          resultKey: JSON.stringify({ g: next, ...nextSearch, sort: nextSort, size: nextSize } satisfies ResultKey),
          pending: false,
          more: false,
          pages: [r.items],
          cursors: [null, r.nextCursor],
        }));
      },
      () => request === latest.current && setView((v) => ({ ...v, pending: false, error: true })),
    );
  };
  // Page changes bring the top of the directory (its filter bar) back into view.
  const topRef = useRef<HTMLDivElement>(null);
  const toTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  /**
   * Page `target` (0-based): built-in cards are sliced here; an API page is fetched with its cursor, after the pages
   * before it that aren't fetched yet (cursors only lead to the next page). Fetched pages are kept for going back.
   */
  const goTo = async (target: number) => {
    if (target === pageIndex || target < 0 || target >= pageCount || view.more || view.pending) return;
    if (mode !== 'api' || widgetId == null || view.pages[target]) {
      setPage({ key: shownKey, index: target });
      toTop();
      return;
    }
    const request = latest.current;
    const key = view.resultKey;
    const { g: groups, q, loc, sort: shownSort, size } = JSON.parse(key) as ResultKey;
    const pages = [...view.pages];
    const cursors = [...view.cursors];
    setView((v) => ({ ...v, more: true, error: false }));
    try {
      for (let i = pages.length; i <= target; i++) {
        const cursor = cursors[i];
        if (!cursor) break;
        const next = await listingsPage(widgetId, groups, cursor, size, { q, loc, sort: apiSort(shownSort) });
        pages[i] = next.items;
        cursors[i + 1] = next.nextCursor;
      }
    } catch {
      if (request === latest.current) setView((v) => ({ ...v, more: false, error: true }));
      return;
    }
    // A filter change meanwhile: those pages are of results no longer shown.
    if (request !== latest.current) return;
    setView((v) => (v.resultKey === key ? { ...v, more: false, pages, cursors } : v));
    setPage({ key, index: Math.min(target, pages.length - 1) });
    toTop();
  };
  /** A page size: the API's first page of that size; the built-in cards from their first page. */
  const choosePageSize = (size: number) => {
    setPageSize(size);
    if (mode === 'api') apply(chosen, search, sort, size);
  };
  const withFilter = (i: number, values: string[]) => chosen.map((v, j) => (j === i ? values : v));
  /** A sort: the API's listings again from the first page in that order; the built-in cards are sorted here. */
  const chooseSort = (next: Sort) => {
    setSort(next);
    if (mode === 'api') apply(chosen, search, next);
  };
  /** A search from the bar (searched by the API with the filters as they are). */
  const runSearch = (next: Search) => {
    setSearch(next);
    apply(chosen, next);
  };
  // The bar under the page heading searches through this directory.
  const runLatest = useRef(runSearch);
  useEffect(() => {
    runLatest.current = runSearch;
  });
  const register = shared?.register;
  useEffect(() => register?.((next) => runLatest.current(next)), [register]);
  // Preset menus (the sport) show only on the built-in cards; with API data (or while loading) they stay locked.
  const locked = (f: DirectoryFilter) => Boolean(f.hidden || (mode !== 'local' && f.preset));
  // Places are searched from the bar's "Location", so their filters get no pill.
  const shown = menus.filter(({ filter }) => !locked(filter) && !LOCATION_KEYS.includes(filter.key ?? ''));
  const anyChosen = shown.some(({ i }) => chosen[i].length > 0) || Boolean(search.q || search.loc);
  const loading = mode === 'loading';

  /**
   * A chip's counts, each assuming the other filters (and the search) as applied: the API's facets in API mode, else
   * counted over the built-in cards. Unknown (no numbers) while an API widget loads, or when the API sent none.
   */
  const chipCounts = (i: number): ((v: string) => number | undefined) => {
    if (mode === 'api') {
      const facet = result?.facets[i];
      return (v) => (facet ? (facet.counts[v] ?? 0) : undefined);
    }
    if (mode === 'loading') return () => undefined;
    const others = matching(builtIn, withFilter(i, []), search);
    return (v) => others.filter((item) => item.tags.includes(v)).length;
  };
  // Which filters and options the page offers is decided without the search: a search narrows the counts (shown in
  // the panels) but never hides a filter or an option. API pages keep the facets of their latest answer without a
  // search for this; built-in cards are counted here without it.
  const loadedSearch = JSON.parse(view.resultKey) as ResultKey;
  const unsearched = !loadedSearch.q && !loadedSearch.loc;
  const [baseFacets, setBaseFacets] = useState<ListingsResult['facets'] | null>(null);
  if (mode === 'api' && result && unsearched && result.facets !== baseFacets) setBaseFacets(result.facets);
  const offered = (i: number): ((v: string) => boolean) => {
    if (mode === 'api') {
      const facet = (unsearched ? result?.facets : (baseFacets ?? result?.facets))?.[i];
      return (v) => !facet || (facet.counts[v] ?? 0) > 0;
    }
    if (mode === 'loading') return () => true;
    const others = matching(builtIn, withFilter(i, []), NO_SEARCH);
    return (v) => others.some((item) => item.tags.includes(v));
  };
  /** "Show N results" of a draft: counted here over the built-in cards, or by the API (exact, with the search). */
  const counts = useRef(new Map<string, Promise<number>>());
  const draftCount = (i: number) =>
    mode === 'api' && widgetId != null
      ? {
          countFor: (draft: string[]) => {
            const groups = withFilter(i, draft);
            const key = JSON.stringify({ groups, ...search });
            let count = counts.current.get(key);
            if (!count) {
              count = countListings(widgetId, groups, search);
              counts.current.set(key, count);
              count.catch(() => counts.current.delete(key));
            }
            return count;
          },
        }
      : { resultsFor: (draft: string[]) => (mode === 'local' ? matching(builtIn, withFilter(i, draft), search).length : null) };
  // Options the page doesn't offer are left out (unless ticked), and so are chips left with none; the search doesn't
  // count here (see offered).
  const bar = shown
    .map((menu) => {
      const of = chipCounts(menu.i);
      const has = offered(menu.i);
      const options = menu.options
        .filter((o) => has(o.value) || chosen[menu.i].includes(o.value))
        .map((o) => ({ ...o, count: of(o.value) }));
      return { ...menu, of, options };
    })
    .filter(({ options }) => options.length > 0);
  // The location field's suggestions: the places of the page's city/destination filters that have results, with their
  // counts (the API's facets, else the built-in cards). Not while an API page loads (no counts yet). The list is the
  // one without a location applied, so a chosen place still offers the others.
  const livePlaces: Place[] | null = loading
    ? null
    : [
        ...new Map(
          menus
            .filter(({ filter }) => LOCATION_KEYS.includes(filter.key ?? ''))
            .flatMap(({ i, options }) => {
              const of = chipCounts(i);
              return options.map((o) => [o.value, { ...o, count: of(o.value) }] as const);
            }),
        ).values(),
      ].filter((p) => p.count !== 0);
  const [places, setPlaces] = useState<Place[]>([]);
  if (livePlaces && !search.loc && JSON.stringify(livePlaces) !== JSON.stringify(places)) setPlaces(livePlaces);
  const sharePlaces = shared?.setPlaces;
  useEffect(() => sharePlaces?.(places), [sharePlaces, places]);
  // Price sorts need a price filter, "Soonest" a month filter (what the cards are tagged with); else only Recommended.
  const sorts = useMemo(
    () => [
      'featured' as const,
      ...(prices.size > 0 ? (['price-asc', 'price-desc'] as const) : []),
      ...(filters.some((f) => f.key === 'alldates') ? (['soonest'] as const) : []),
    ],
    [filters, prices],
  );
  // Placeholders while loading: as many as the built-in cards would show (at most two rows), so the page barely shifts.
  const placeholders = Math.min(Math.max(matching(builtIn, presets).length, 4), 8);

  const vars = {
    '--dir-width': layout.width ?? '1200px',
    '--dir-col-gap': layout.colGap != null ? `${layout.colGap}px` : '0px',
    '--dir-row-gap': layout.rowGap != null ? `${layout.rowGap}px` : '0px',
  } as CSSProperties;

  return (
    <div ref={topRef} className={styles.directory} style={vars}>
      {!shared && (
        <div className={styles.searchSlot}>
          <DirectorySearch query={search.q} location={search.loc} places={places} onSearch={(q, loc) => runSearch({ q, loc })} />
        </div>
      )}
      {bar.length === 0 && sorts.length < 2 && builtIn.length === 0 && apiItems.length === 0 ? (
        <div className={styles.noFilters} />
      ) : (
        <div className={styles.bar}>
          <div className={styles.barRow}>
            <div className={`${styles.filters} ${loading ? styles.busy : ''}`} inert={loading}>
              {bar.map(({ filter, i, options, buckets, of }) => {
                const { name, icon, heading, plural } = chipFor(filter);
                const key = filter.key ?? filter.label;
                const common = {
                  name,
                  icon,
                  value: chosen[i],
                  open: openFilter === i,
                  onOpenChange: (isOpen: boolean) => setOpenFilter(isOpen ? i : null),
                  ...draftCount(i),
                  onApply: (values: string[]) => apply(withFilter(i, values)),
                };
                return buckets ? (
                  <PriceChip key={key} {...common} heading={heading} buckets={buckets} counts={of} />
                ) : (
                  <FilterChip key={key} {...common} heading={heading} plural={plural} options={options} />
                );
              })}
              {search.q && <AppliedPill icon={<LuSearch />} label={`“${search.q}”`} onClear={() => runSearch({ ...search, q: '' })} />}
              {search.loc && <AppliedPill icon={<LuMapPin />} label={search.loc} onClear={() => runSearch({ ...search, loc: '' })} />}
              {anyChosen && (
                <button
                  type="button"
                  className={styles.clearAll}
                  onClick={() => {
                    setSearch(NO_SEARCH);
                    apply(
                      chosen.map((v, j) => (locked(filters[j]) ? v : [])),
                      NO_SEARCH,
                    );
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className={`${styles.sortSlot} ${loading ? styles.busy : ''}`} inert={loading}>
              {sorts.length > 1 && <SortSelect value={sort} onChange={chooseSort} options={sorts} />}
              <div className={styles.viewToggle} role="group" aria-label="Results view">
                {(['grid', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`${styles.viewBtn} ${display === v ? styles.viewOn : ''}`}
                    aria-pressed={display === v}
                    aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                    onClick={() => chooseView(v)}
                  >
                    {v === 'grid' ? <LuLayoutGrid aria-hidden /> : <LuList aria-hidden />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.found} role="status">
            {loading || view.pending
              ? 'Loading…'
              : view.error
                ? 'Could not update the results. Please try again.'
                : `${totalFound} ${totalFound === 1 ? 'result' : 'results'} found`}
          </div>
        </div>
      )}
      <div className={`${styles.inner} ${view.pending ? styles.pending : ''}`} aria-busy={loading || view.pending}>
        {loading && display === 'list' ? (
          <div className={styles.list} aria-hidden>
            {Array.from({ length: Math.min(placeholders, 4) }, (_, i) => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonRow}`} />
            ))}
          </div>
        ) : loading ? (
          <div className={styles.row} aria-hidden>
            {Array.from({ length: placeholders }, (_, i) => (
              <div key={i} className={`${styles.col} ${styles.skeletonCol}`}>
                <div className={styles.skeleton} />
              </div>
            ))}
          </div>
        ) : /* Re-keying on the filter state replays the fade/scale-in, like the original's filtering animation. */
        display === 'list' ? (
          <div key={`${shownKey}|${sort}|list`} className={styles.list}>
            {pageItems.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <DirectoryRow
                  card={item}
                  facts={rowFacts(item, filters, prices)}
                  fallbackImage={(item as AddedItem).fallbackImage}
                  onOpen={() => setOpen(item)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div key={`${shownKey}|${sort}`} className={styles.row}>
            {pageItems.map((item) => (
              <div key={item.id} className={styles.col}>
                <TeamCard card={item} variant="wps" fallbackImage={(item as AddedItem).fallbackImage} onOpen={() => setOpen(item)} />
              </div>
            ))}
          </div>
        )}
        {/* Pager (as the admin's): range, Previous / page numbers / Next, and the page size. Shown once the results
            are more than the smallest page. */}
        {!loading && totalFound > PAGE_SIZES[0] && (
          <nav className={styles.pager} aria-label="Pages">
            <span className={styles.pagerInfo} role="status">
              {view.more ? 'Loading…' : `${pageIndex * pageSize + 1}–${pageIndex * pageSize + pageItems.length} of ${totalFound} results`}
            </span>
            <div className={styles.pagerPages}>
              <button
                type="button"
                className={styles.pagerStep}
                onClick={() => goTo(pageIndex - 1)}
                disabled={pageIndex === 0 || view.more || view.pending}
              >
                <LuChevronLeft aria-hidden /> Previous
              </button>
              {pageNumbers(pageIndex, pageCount).map((n, i) =>
                n === null ? (
                  <span key={`gap${i}`} className={styles.pagerGap} aria-hidden>
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.pagerNum} ${n === pageIndex ? styles.pagerOn : ''}`}
                    aria-label={`Page ${n + 1}`}
                    aria-current={n === pageIndex ? 'page' : undefined}
                    onClick={() => goTo(n)}
                    disabled={view.more || view.pending}
                  >
                    {n + 1}
                  </button>
                ),
              )}
              <button
                type="button"
                className={styles.pagerStep}
                onClick={() => goTo(pageIndex + 1)}
                disabled={pageIndex >= pageCount - 1 || view.more || view.pending}
              >
                Next <LuChevronRight aria-hidden />
              </button>
            </div>
            <div className={styles.pagerSize}>
              <span>Per page</span>
              <PillSelect
                value={pageSize}
                options={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))}
                onChange={choosePageSize}
                label="Results per page"
                placement="up"
              />
            </div>
          </nav>
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
