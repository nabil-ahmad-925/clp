'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import styles from './FilterChip.module.css';

export type ChipOption = { value: string; label: string; count: number };

type Props = {
  name: string;
  icon: ReactNode;
  /** The filter's own "All …" option, listed first; ticking it clears the others. */
  all?: ChipOption;
  options: ChipOption[];
  /** The applied values; the panel edits a draft copy until "Show" is pressed. */
  value: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * How many results the draft would show, for the "Show N results" button. Without it the button reads "Show
   * results" (results that come from a server are only fetched when it is pressed).
   */
  resultsFor?: (draft: string[]) => number;
  onApply: (values: string[]) => void;
};

/**
 * Filter pill with a checkbox panel: options are multi-select, each with its result count; "Clear" empties the
 * draft and "Show N results" applies it. Closing the panel any other way discards the draft.
 */
export default function FilterChip({ name, icon, all, options, value, open, onOpenChange, resultsFor, onApply }: Props) {
  const [draft, setDraft] = useState(value);
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Each opening starts from the applied values.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  // Panels of chips near the right edge open leftwards so they stay on screen.
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const left = ref.current.getBoundingClientRect().left;
    setAlignRight(left + 320 > document.documentElement.clientWidth - 16);
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

  const labels = new Map(options.map((o) => [o.value, o.label]));
  const first = value.find((v) => labels.has(v));
  const text = first == null ? name : value.length > 1 ? `${labels.get(first)} +${value.length - 1}` : labels.get(first);
  const toggle = (v: string) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  const results = open && resultsFor ? resultsFor(draft) : null;

  return (
    <div ref={ref} className={`${styles.wrap} ${open ? styles.isOpen : ''}`}>
      <button
        ref={chipRef}
        type="button"
        className={`${styles.chip} ${value.length > 0 ? styles.active : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.text}>{text}</span>
        <LuChevronDown className={styles.chevron} aria-hidden />
      </button>

      {open && (
        <div id={panelId} className={`${styles.panel} ${alignRight ? styles.right : ''}`} role="dialog" aria-label={`Filter by ${name}`}>
          <div className={styles.heading}>{name}</div>
          <div className={styles.options}>
            {all && (
              <label className={styles.option}>
                <input type="checkbox" checked={draft.length === 0} onChange={() => setDraft([])} />
                <span className={styles.box} aria-hidden>
                  <LuCheck />
                </span>
                <span className={styles.label}>{all.label}</span>
                <span className={styles.count}>{all.count}</span>
              </label>
            )}
            {options.map((o) => (
              <label key={o.value} className={styles.option}>
                <input type="checkbox" checked={draft.includes(o.value)} onChange={() => toggle(o.value)} />
                <span className={styles.box} aria-hidden>
                  <LuCheck />
                </span>
                <span className={styles.label}>{o.label}</span>
                <span className={styles.count}>{o.count}</span>
              </label>
            ))}
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.clear} onClick={() => setDraft([])} disabled={draft.length === 0}>
              Clear
            </button>
            <button
              type="button"
              className={styles.apply}
              onClick={() => {
                onApply(draft);
                onOpenChange(false);
              }}
            >
              {results === null ? 'Show results' : `Show ${results} ${results === 1 ? 'result' : 'results'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
