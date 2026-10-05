'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LuChevronDown, LuX } from 'react-icons/lu';
import styles from './FilterChip.module.css';

const PANEL_WIDTH = 320;

type Props = {
  /** The filter's name: the chip's text while nothing is applied, and the "Clear …" label. */
  name: string;
  /** Uppercase caption at the top of the panel (defaults to `name`). */
  heading?: string;
  icon: ReactNode;
  /** The chip's text (the applied value, or `name`). */
  label: string;
  /** A value is applied: the chip fills in and shows a clear button instead of its chevron. */
  active: boolean;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The draft differs from "nothing chosen", so the panel's "Clear" does something. */
  canClear: boolean;
  onClearDraft: () => void;
  onApply: () => void;
  applyLabel: string;
  children: ReactNode;
};

/**
 * Filter pill with a popover panel, as on tenpo.com's event filters: the panel edits a draft that its "Show …"
 * button applies; closing it any other way discards the draft (the chip's owner resets it on opening).
 */
export default function FilterPopover({
  name,
  heading,
  icon,
  label,
  active,
  onClear,
  open,
  onOpenChange,
  canClear,
  onClearDraft,
  onApply,
  applyLabel,
  children,
}: Props) {
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Panels (320px, see the CSS) of chips near the right edge open leftwards so they stay on screen.
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const left = ref.current.getBoundingClientRect().left;
    setAlignRight(left + PANEL_WIDTH > document.documentElement.clientWidth - 16);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onOpenChange(false);
      chipRef.current?.focus();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className={`${styles.wrap} ${active ? styles.active : ''} ${open ? styles.isOpen : ''}`}>
      <button
        ref={chipRef}
        type="button"
        className={styles.chip}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.text}>{label}</span>
        {!active && <LuChevronDown className={styles.chevron} aria-hidden />}
      </button>
      {active && (
        <button type="button" className={styles.chipClear} aria-label={`Clear ${name}`} onClick={onClear}>
          <LuX aria-hidden />
        </button>
      )}

      {open && (
        <div id={panelId} className={`${styles.panel} ${alignRight ? styles.right : ''}`} role="dialog" aria-label={`Filter by ${name}`}>
          <div className={styles.heading}>{heading ?? name}</div>
          {children}
          <div className={styles.footer}>
            <button type="button" className={styles.clear} onClick={onClearDraft} disabled={!canClear}>
              Clear
            </button>
            <button
              type="button"
              className={styles.apply}
              onClick={() => {
                onApply();
                onOpenChange(false);
              }}
            >
              {applyLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Show 6 results"; "Show … results" while the count is on its way; "Show results" when it can't be known. */
export const showLabel = (results: number | 'loading' | null | undefined) =>
  results === 'loading' ? 'Show … results' : results == null ? 'Show results' : `Show ${results} ${results === 1 ? 'result' : 'results'}`;

/** Counts the results of a panel's draft: at once (`resultsFor`), or by asking the API (`countFor`). */
export type DraftCount = {
  resultsFor?: (draft: string[]) => number | null;
  countFor?: (draft: string[]) => Promise<number>;
};

/**
 * The "Show N results" count of an open panel's draft. `countFor` is asked 250ms after the draft last changed (a
 * slider being dragged asks once it settles); meanwhile the count reads 'loading'.
 */
export function useDraftCount(open: boolean, draft: string[], { resultsFor, countFor }: DraftCount): number | 'loading' | null {
  const key = JSON.stringify(draft);
  const [fetched, setFetched] = useState<{ key: string; n: number | null } | null>(null);
  // Each opening counts afresh (the other filters may have changed since).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setFetched(null);
  }
  const ask = useRef(countFor);
  useEffect(() => {
    ask.current = countFor;
  });
  useEffect(() => {
    if (!open || !ask.current) return;
    let live = true;
    const timer = window.setTimeout(() => {
      ask.current?.(JSON.parse(key) as string[]).then(
        (n) => live && setFetched({ key, n }),
        () => live && setFetched({ key, n: null }),
      );
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [open, key]);
  if (!open) return null;
  if (resultsFor) return resultsFor(draft);
  if (countFor) return fetched?.key === key ? fetched.n : 'loading';
  return null;
}

/** An applied search shown in the filter bar (tenpo.com's query and location pills): filled, with a clear button. */
export function AppliedPill({ icon, label, onClear }: { icon: ReactNode; label: string; onClear: () => void }) {
  return (
    <div className={`${styles.wrap} ${styles.active}`}>
      <span className={styles.chip}>
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.text}>{label}</span>
      </span>
      <button type="button" className={styles.chipClear} aria-label={`Clear ${label}`} onClick={onClear}>
        <LuX aria-hidden />
      </button>
    </div>
  );
}
