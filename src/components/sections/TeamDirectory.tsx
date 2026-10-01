'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import DropSelect from '@/components/ui/DropSelect';
import type { DirectoryFilter, DirectoryItem, DirectoryLayout } from '@/content/types';
import BioModal from './BioModal';
import TeamCard from './TeamCard';
import styles from './TeamDirectory.module.css';

type Props = { layout: DirectoryLayout; filters: DirectoryFilter[]; items: DirectoryItem[]; paging?: { first: number; more: number } };

/** Cards matching every chosen filter value (an empty value matches all). */
const matching = (items: DirectoryItem[], values: string[]) =>
  items.filter((item) => values.every((value) => !value || item.tags.includes(value)));

/**
 * Filterable directory of partners (the team plugin's "filter" display): drop-menu filters above a
 * four-column card grid; a card shows only when it matches every chosen filter. Cards open the full-screen bio.
 * Filters start on their `preset` option (the sport of the page); `hidden` ones apply without being shown.
 */
export default function TeamDirectory({ layout, filters, items, paging }: Props) {
  const [chosen, setChosen] = useState<string[]>(() => filters.map((f) => f.preset ?? ''));
  const [open, setOpen] = useState<DirectoryItem | null>(null);
  // Paged widgets start again from the first page whenever the filters change.
  const [pages, setPages] = useState({ key: '', count: paging?.first ?? Infinity });
  const filterKey = chosen.join('|');
  const limit = pages.key === filterKey ? pages.count : (paging?.first ?? Infinity);

  const filtered = useMemo(() => matching(items, chosen), [items, chosen]);

  // As on the original, "No Results Found" appears only when a filter change empties a grid that had cards
  // (a page whose preset already matches nothing stays blank), and goes away once cards match again.
  const [emptyShown, setEmptyShown] = useState(false);
  const choose = (i: number, value: string) => {
    const next = chosen.map((v, j) => (j === i ? value : v));
    const count = matching(items, next).length;
    setEmptyShown((prev) => (count > 0 ? false : filtered.length > 0 ? true : prev));
    setChosen(next);
  };

  const shown = filters.map((filter, i) => ({ filter, i })).filter(({ filter }) => !filter.hidden);

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
        <div className={`${styles.filters} ${layout.filterColumns === 3 ? styles.thirds : ''}`}>
          {shown.map(({ filter, i }) => (
            <DropSelect
              key={filter.key ?? filter.label}
              label={`Select ${filter.label}`}
              options={filter.options}
              value={chosen[i]}
              onChange={(value) => choose(i, value)}
            />
          ))}
        </div>
      )}
      <div className={styles.inner}>
        {/* Re-keying on the filter state replays the fade/scale-in, like the original's filtering animation. */}
        <div key={chosen.join('|')} className={styles.row}>
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
