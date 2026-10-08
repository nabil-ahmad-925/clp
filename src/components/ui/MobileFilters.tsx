'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { LuArrowUpDown, LuCheck, LuChevronDown, LuSlidersHorizontal } from 'react-icons/lu';
import type { ChipOption } from './FilterChip';
import { showLabel } from './FilterPopover';
import PillSelect from './PillSelect';
import styles from './MobileFilters.module.css';

/** One filter of the sheet: its options (with counts), the applied values, one at a time or several. */
export type SheetSection = { id: string; heading: string; options: ChipOption[]; value: string[]; single?: boolean };
/** The values of every section, by section id. */
export type SheetDraft = Record<string, string[]>;

type Props = {
  sections: SheetSection[];
  /** The sort, chosen in the sheet too (its first option is the default). */
  sort?: { value: string; options: readonly { value: string; label: string }[] };
  /** How many filters are applied (the button's badge). */
  applied: number;
  /** The results a draft would show: at once, by asking the API, or null when it can't be known. */
  countFor: (draft: SheetDraft, sort?: string) => number | Promise<number> | null;
  onApply: (draft: SheetDraft, sort?: string) => void;
};

const draftOf = (sections: SheetSection[]): SheetDraft => Object.fromEntries(sections.map((s) => [s.id, s.value]));

/**
 * Phones' filters (tenpo.com's mobile design): a "Filters" button opens a bottom sheet with every filter as a card of
 * options (and the sort first). Nothing applies until "Show N results"; "Clear all" empties the draft.
 */
export default function MobileFilters({ sections, sort, applied, countFor, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SheetDraft>({});
  const [draftSort, setDraftSort] = useState(sort?.value);
  const titleId = useId();
  const sheet = useRef<HTMLDivElement>(null);

  const show = () => {
    setDraft(draftOf(sections));
    setDraftSort(sort?.value);
    setOpen(true);
  };
  const close = () => setOpen(false);

  // While open: the page behind doesn't scroll, Escape closes, and focus starts in the sheet.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    sheet.current?.focus();
    // Escape in the sort menu closes only the menu.
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !(e.target as Element | null)?.closest?.('[role="listbox"]') && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  // "Show N results": counted 250ms after the draft last changed.
  const key = JSON.stringify([draft, draftSort]);
  const [counted, setCounted] = useState<{ key: string; n: number | null } | null>(null);
  const ask = useRef(countFor);
  useEffect(() => {
    ask.current = countFor;
  });
  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = window.setTimeout(() => {
      const [d, s] = JSON.parse(key) as [SheetDraft, string | undefined];
      Promise.resolve(ask.current(d, s)).then(
        (n) => live && setCounted({ key, n }),
        () => live && setCounted({ key, n: null }),
      );
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [open, key]);
  const results = counted?.key === key ? counted.n : 'loading';

  const toggle = (section: SheetSection, value: string, on: boolean) =>
    setDraft((d) => {
      const now = d[section.id] ?? [];
      const next = section.single ? (on ? [value] : []) : on ? [...now, value] : now.filter((v) => v !== value);
      return { ...d, [section.id]: next };
    });
  const anyChosen = Object.values(draft).some((v) => v.length > 0) || (sort !== undefined && draftSort !== sort.options[0]?.value);

  return (
    <>
      <button type="button" className={styles.trigger} aria-haspopup="dialog" aria-expanded={open} onClick={show}>
        <LuSlidersHorizontal aria-hidden />
        Filters
        {applied > 0 && <span className={styles.badge}>{applied}</span>}
      </button>
      {open && (
        <div className={styles.backdrop} onClick={close}>
          <div
            ref={sheet}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.head}>
              <span className={styles.handle} aria-hidden />
              <h2 id={titleId} className={styles.title}>
                Filters
              </h2>
              <button type="button" className={styles.close} aria-label="Close filters" onClick={close}>
                <LuChevronDown aria-hidden />
              </button>
            </div>
            <div className={styles.body}>
              {sort && (
                <section className={styles.card}>
                  <h3 className={styles.heading}>Sort by</h3>
                  {/* The desktop sort pill (not the browser's select), the sheet's width. */}
                  <div className={styles.sortPill}>
                    <PillSelect value={draftSort ?? sort.options[0]?.value ?? ''} options={sort.options} onChange={setDraftSort} label="Sort by" icon={<LuArrowUpDown />} />
                  </div>
                </section>
              )}
              {sections.map((section) => (
                <section key={section.id} className={styles.card}>
                  <h3 className={styles.heading}>{section.heading}</h3>
                  <div className={styles.options} role={section.single ? 'radiogroup' : 'group'} aria-label={section.heading}>
                    {section.options.map((o) => {
                      const on = (draft[section.id] ?? []).includes(o.value);
                      return (
                        <label key={o.value} className={styles.option}>
                          <input
                            type={section.single ? 'radio' : 'checkbox'}
                            name={`${titleId}-${section.id}`}
                            checked={on}
                            onChange={(e) => toggle(section, o.value, section.single ? true : e.target.checked)}
                            onClick={() => section.single && on && toggle(section, o.value, false)}
                          />
                          <span className={`${styles.box} ${section.single ? styles.round : ''}`} aria-hidden>
                            <LuCheck />
                          </span>
                          <span className={styles.label}>{o.label}</span>
                          {o.count !== undefined && <span className={styles.count}>{o.count}</span>}
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className={styles.foot}>
              <button
                type="button"
                className={styles.clear}
                disabled={!anyChosen}
                onClick={() => {
                  setDraft(Object.fromEntries(sections.map((s) => [s.id, []])));
                  setDraftSort(sort?.options[0]?.value);
                }}
              >
                Clear all
              </button>
              <button
                type="button"
                className={styles.apply}
                onClick={() => {
                  onApply(draft, draftSort);
                  close();
                }}
              >
                {showLabel(results)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
