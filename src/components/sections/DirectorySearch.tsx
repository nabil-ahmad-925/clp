'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { LuMapPin, LuSearch } from 'react-icons/lu';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import styles from './DirectorySearch.module.css';

/** A place to search for (a city or destination of the cards), with how many results it has. */
export type Place = { value: string; label: string; count?: number };

type Props = {
  /** The search field's placeholder (the page's category: "Search Advancement & Workshops…"). */
  placeholder?: string;
  /** The applied search and location. */
  query: string;
  location: string;
  /** The page's places with results, suggested under the location field (just their names). */
  places?: Place[];
  onSearch: (query: string, location: string) => void;
  /** The location field (false: the search field alone, e.g. articles). */
  withLocation?: boolean;
  /** The search field's hidden label. */
  label?: string;
};

/** Accents, case and extra spaces don't matter when matching what's typed ("barca" finds "Barça"), as in the API. */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * tenpo.com's search bar: "Sport or event" (searched in the cards' title, subtitle and description) and "Location"
 * (a city or destination of the cards, suggested as you type), applied by the search button, Enter or a suggestion.
 * Both are searched by the listings API.
 */
export default function DirectorySearch({ query, location, places = [], onSearch, placeholder = 'Search camps, clinics, programs…', withLocation = true, label = 'Sport or event' }: Props) {
  const [q, setQ] = useState(query);
  const [loc, setLoc] = useState(location);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const locRef = useRef<HTMLDivElement>(null);
  const qId = useId();
  const locId = useId();
  const listId = useId();

  // Applied from elsewhere (a cleared pill, "Clear all"): the fields follow.
  const [applied, setApplied] = useState({ query, location });
  if (applied.query !== query || applied.location !== location) {
    setApplied({ query, location });
    setQ(query);
    setLoc(location);
  }

  // Suggestions: the places whose name contains what's typed (all of them while the field is empty or holds the
  // applied place).
  const typed = fold(loc);
  const suggestions = places.filter((p) => !typed || typed === fold(location) || fold(p.label).includes(typed)).slice(0, 8);
  const shown = open && suggestions.length > 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!locRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    onSearch(q.trim(), loc.trim());
  };
  const pick = (p: Place) => {
    setLoc(p.label);
    setOpen(false);
    onSearch(q.trim(), p.label);
  };

  return (
    <form role="search" className={`${styles.search} ${withLocation ? '' : styles.single}`} onSubmit={submit}>
      {/* Location first, then the search words (the black button searches both). */}
      {withLocation && (
        <div ref={locRef} className={`${styles.seg} ${styles.locSeg}`}>
          <label className={styles.segLabel} htmlFor={locId}>
            <LuMapPin className={styles.segIcon} aria-hidden />
            <span className={styles.field}>
              <span className={styles.srOnly}>Location</span>
              <input
                id={locId}
                className={styles.input}
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={shown}
                aria-controls={listId}
                aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
                autoComplete="off"
                placeholder="City or destination"
                value={loc}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onChange={(e) => {
                  setLoc(e.target.value);
                  setActive(-1);
                  setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setOpen(true);
                    const n = suggestions.length;
                    if (n) setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n));
                  } else if (e.key === 'Enter' && shown && active >= 0 && suggestions[active]) {
                    e.preventDefault();
                    pick(suggestions[active]);
                  } else if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
              />
            </span>
          </label>
          {shown && (
            <ul id={listId} className={styles.suggestions} role="listbox" aria-label="Locations">
              {suggestions.map((p, i) => (
                <li
                  key={p.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={styles.suggestion}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(p)}
                >
                  <LuMapPin className={styles.suggestionIcon} aria-hidden />
                  <span className={styles.suggestionLabel}>{p.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <label className={styles.seg} htmlFor={qId}>
        <LuSearch className={styles.segIcon} aria-hidden />
        <span className={styles.field}>
          <span className={styles.srOnly}>{label}</span>
          <input
            id={qId}
            className={styles.input}
            type="search"
            autoComplete="off"
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </span>
      </label>
      <button type="submit" className={styles.submit} aria-label="Search">
        <PiMagnifyingGlassBold aria-hidden />
        <span className={styles.submitText}>Search</span>
      </button>
    </form>
  );
}

/** The applied search: words of the title, subtitle or excerpt, and a place among the tags. */
export type Search = { q: string; loc: string };
export const NO_SEARCH: Search = { q: '', loc: '' };

type SearchContext = {
  search: Search;
  setSearch: (search: Search) => void;
  /** Runs a search: through the page's directory (which asks the API), else (none yet) only stored. */
  run: (search: Search) => void;
  /** The directory takes over running searches; the returned function hands them back. */
  register: (runner: (search: Search) => void) => () => void;
  /** The places the location field suggests (set by the directory from the API's counts). */
  places: Place[];
  setPlaces: (places: Place[]) => void;
  /** The search field's placeholder and hidden label, and whether the bar has the location field (see DirectorySearch). */
  placeholder?: string;
  label?: string;
  withLocation: boolean;
};
const SearchContext = createContext<SearchContext | null>(null);

/**
 * Shares the search of a page whose bar is rendered under the page heading (DirectorySearchSlot) with its directory
 * (TeamDirectory) or article list (PostFilter), so the bar is in the page's HTML from the start rather than appearing once the directory loads.
 */
export function DirectorySearchProvider({
  children,
  placeholder,
  label,
  withLocation = true,
}: {
  children: ReactNode;
  placeholder?: string;
  label?: string;
  withLocation?: boolean;
}) {
  const [search, setSearch] = useState(NO_SEARCH);
  const [places, setPlaces] = useState<Place[]>([]);
  const runner = useRef<((search: Search) => void) | null>(null);
  const [actions] = useState(() => ({
    run: (next: Search) => (runner.current ? runner.current(next) : setSearch(next)),
    register: (fn: (search: Search) => void) => {
      runner.current = fn;
      return () => {
        if (runner.current === fn) runner.current = null;
      };
    },
  }));
  return <SearchContext.Provider value={{ search, setSearch, places, setPlaces, placeholder, label, withLocation, ...actions }}>{children}</SearchContext.Provider>;
}

/** The page's search when its bar is in the slot under the heading (null: the directory shows its own bar). */
export const useSharedSearch = () => useContext(SearchContext);

/** The search bar straddling the bottom edge of the page heading, as on tenpo.com (see DirectorySearchProvider). */
export function DirectorySearchSlot() {
  const ctx = useContext(SearchContext);
  if (!ctx) return null;
  return (
    <div className={styles.slot}>
      <DirectorySearch
        query={ctx.search.q}
        location={ctx.search.loc}
        places={ctx.places}
        placeholder={ctx.placeholder}
        label={ctx.label}
        withLocation={ctx.withLocation}
        onSearch={(q, loc) => ctx.run({ q, loc })}
      />
    </div>
  );
}
