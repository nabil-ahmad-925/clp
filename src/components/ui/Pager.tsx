'use client';

import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import PillSelect from './PillSelect';
import styles from './Pager.module.css';

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

type Props = {
  /** The current page, 0-based, and how many there are. */
  page: number;
  pageCount: number;
  /** Results on every page, and on this one. */
  total: number;
  shown: number;
  pageSize: number;
  sizes: readonly number[];
  /** A page is being fetched: the range reads "Loading…". */
  loading?: boolean;
  /** Paging is paused (results being refreshed). */
  disabled?: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  className?: string;
};

/** Pager under a list of cards: "1–12 of 33 results", Previous / page numbers / Next, and the page size. */
export default function Pager({ page, pageCount, total, shown, pageSize, sizes, loading, disabled, onPage, onPageSize, className }: Props) {
  return (
    <nav className={`${styles.pager} ${className ?? ''}`} aria-label="Pages">
      <span className={styles.pagerInfo} role="status">
        {loading ? 'Loading…' : `${page * pageSize + 1}–${page * pageSize + shown} of ${total} results`}
      </span>
      <div className={styles.pagerPages}>
        <button type="button" className={styles.pagerStep} onClick={() => onPage(page - 1)} disabled={page === 0 || loading || disabled}>
          <LuChevronLeft aria-hidden /> Previous
        </button>
        {pageNumbers(page, pageCount).map((n, i) =>
          n === null ? (
            <span key={`gap${i}`} className={styles.pagerGap} aria-hidden>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`${styles.pagerNum} ${n === page ? styles.pagerOn : ''}`}
              aria-label={`Page ${n + 1}`}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => n !== page && onPage(n)}
              disabled={loading || disabled}
            >
              {n + 1}
            </button>
          ),
        )}
        <button type="button" className={styles.pagerStep} onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1 || loading || disabled}>
          Next <LuChevronRight aria-hidden />
        </button>
      </div>
      <div className={styles.pagerSize}>
        <span>Per page</span>
        <PillSelect value={pageSize} options={sizes.map((n) => ({ value: n, label: String(n) }))} onChange={onPageSize} label="Results per page" placement="up" />
      </div>
    </nav>
  );
}
