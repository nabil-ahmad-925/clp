'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { LuAccessibility, LuCalendar, LuChartNoAxesColumn, LuDollarSign, LuHandshake, LuHeartPulse, LuMapPin, LuPlane, LuSparkles, LuUsers, LuVolleyball } from 'react-icons/lu';
import FilterChip from '@/components/ui/FilterChip';
import type { DirectoryFilter, DirectoryItem, DirectoryLayout } from '@/content/types';
import BioModal from './BioModal';
import TeamCard from './TeamCard';
import styles from './TeamDirectory.module.css';

type Props = { layout: DirectoryLayout; filters: DirectoryFilter[]; items: DirectoryItem[]; paging?: { first: number; more: number } };

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

/**
 * Filterable directory of partners (the team plugin's "filter" display): pill filters with checkbox panels above
 * a four-column card grid; a card shows only when it matches every filter. Cards open the full-screen bio.
 * Filters start on their `preset` option (the sport of the page); `hidden` ones apply without being shown.
 */
export default function TeamDirectory({ layout, filters, items, paging }: Props) {
  const [chosen, setChosen] = useState<string[][]>(() => filters.map((f) => (f.preset ? [f.preset] : [])));
  const [open, setOpen] = useState<DirectoryItem | null>(null);
  const [openFilter, setOpenFilter] = useState<number | null>(null);
  // Paged widgets start again from the first page whenever the filters change.
  const [pages, setPages] = useState({ key: '', count: paging?.first ?? Infinity });
  const filterKey = JSON.stringify(chosen);
  const limit = pages.key === filterKey ? pages.count : (paging?.first ?? Infinity);

  const filtered = useMemo(() => matching(items, chosen), [items, chosen]);

  // As on the original, "No Results Found" appears only when a filter change empties a grid that had cards
  // (a page whose preset already matches nothing stays blank), and goes away once cards match again.
  const [emptyShown, setEmptyShown] = useState(false);
  const apply = (next: string[][]) => {
    const count = matching(items, next).length;
    setEmptyShown((prev) => (count > 0 ? false : filtered.length > 0 ? true : prev));
    setChosen(next);
  };
  const withFilter = (i: number, values: string[]) => chosen.map((v, j) => (j === i ? values : v));

  // Every option is listed as on the original menus; the empty-valued one is the filter's "All …" choice.
  const shown = filters
    .map((filter, i) => ({ filter, i, all: filter.options.find((o) => !o.value), options: filter.options.filter((o) => o.value) }))
    .filter(({ filter }) => !filter.hidden && filter.options.length > 0);
  const anyChosen = shown.some(({ i }) => chosen[i].length > 0);

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
          <div className={styles.filters}>
            {shown.map(({ filter, i, all, options }) => {
              const { name, icon } = chipFor(filter);
              // Each option's count assumes the other filters as applied.
              const others = matching(items, withFilter(i, []));
              return (
                <FilterChip
                  key={filter.key ?? filter.label}
                  name={name}
                  icon={icon}
                  all={all && { ...all, count: others.length }}
                  options={options.map((o) => ({ ...o, count: others.filter((item) => item.tags.includes(o.value)).length }))}
                  value={chosen[i]}
                  open={openFilter === i}
                  onOpenChange={(isOpen) => setOpenFilter(isOpen ? i : null)}
                  resultsFor={(draft) => matching(items, withFilter(i, draft)).length}
                  onApply={(values) => apply(withFilter(i, values))}
                />
              );
            })}
            {anyChosen && (
              <button type="button" className={styles.clearAll} onClick={() => apply(chosen.map((v, j) => (filters[j].hidden ? v : [])))}>
                Clear all
              </button>
            )}
          </div>
          <div className={styles.found} role="status">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'} found
          </div>
        </div>
      )}
      <div className={styles.inner}>
        {/* Re-keying on the filter state replays the fade/scale-in, like the original's filtering animation. */}
        <div key={filterKey} className={styles.row}>
          {filtered.slice(0, limit).map((item) => (
            <div key={item.id} className={styles.col}>
              <TeamCard card={item} variant="wps" onOpen={() => setOpen(item)} />
            </div>
          ))}
        </div>
        {paging && limit < filtered.length && (
          <div className={styles.loadMore}>
            <button type="button" className={styles.loadMoreBtn} onClick={() => setPages({ key: filterKey, count: limit + paging.more })}>
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
        {filtered.length === 0 && emptyShown && (
          <div className={styles.emptyWrap} role="status">
            <div className={styles.empty}>No Results Found</div>
          </div>
        )}
      </div>

      {open && <BioModal card={open} variant="wps" onClose={() => setOpen(null)} />}
    </div>
  );
}
