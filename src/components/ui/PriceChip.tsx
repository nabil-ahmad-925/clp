'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';
import FilterPopover, { showLabel, useDraftCount, type DraftCount } from './FilterPopover';
import styles from './FilterChip.module.css';

/** A price option ("free", "25-to-49", "10k") as a dollar range; `max` is Infinity for the open-ended top one. */
export type PriceBucket = { value: string; min: number; max: number };

/** Price options as ranges, cheapest first; null when an option isn't a price range (the filter keeps its checkboxes). */
export function priceBuckets(options: { value: string }[]): PriceBucket[] | null {
  const buckets = options.map(({ value }): PriceBucket | null => {
    if (value === 'free') return { value, min: 0, max: 0 };
    const range = /^(\d+)-to-(\d+)$/.exec(value);
    if (range) return { value, min: Number(range[1]), max: Number(range[2]) };
    const open = /^(\d+)(k?)\+?$/.exec(value);
    if (open) return { value, min: Number(open[1]) * (open[2] ? 1000 : 1), max: Infinity };
    return null;
  });
  if (buckets.length < 2 || buckets.some((b) => b == null)) return null;
  return (buckets as PriceBucket[]).sort((a, b) => a.min - b.min);
}

const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;

/** tenpo's price wording for the dollar range `[min, max]` within the slider's `bounds`. */
function rangeLabel([min, max]: [number, number], [lo, hi]: [number, number]) {
  if (min <= lo && max >= hi) return 'Any price';
  if (max === 0) return 'Free';
  if (min <= lo) return `Up to ${dollars(max)}`;
  if (max >= hi) return `${dollars(min)}+`;
  return `${dollars(min)} – ${dollars(max)}`;
}

type Props = DraftCount & {
  name: string;
  heading?: string;
  icon: ReactNode;
  buckets: PriceBucket[];
  /** Result counts by bucket value; the slider spans the cheapest to the dearest bucket that has results. */
  counts: (value: string) => number | undefined;
  value: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (values: string[]) => void;
};

/**
 * tenpo.com's price chip: a "Free" checkbox (when the filter has a free option) and a two-thumb dollar slider over the
 * paid prices, from the cheapest to the dearest with results. The choice applies as the price options it covers, so it
 * filters exactly like ticking those options would: Free alone is the free listings, Free with a range adds that range,
 * a range alone is that range, and neither is any price.
 */
export default function PriceChip({
  name,
  heading,
  icon,
  buckets,
  counts,
  value,
  open,
  onOpenChange,
  resultsFor,
  countFor,
  onApply,
}: Props) {
  const free = buckets.find((b) => b.max === 0);
  const paid = buckets.filter((b) => b !== free);
  const available = paid.filter((b) => (counts(b.value) ?? 1) > 0 || value.includes(b.value));
  const shown = available.length ? available : paid;
  // The open-ended top option ("$10k+") ends the slider at its lowest price.
  const lo = shown.length ? Math.min(...shown.map((b) => b.min)) : 0;
  const top = Math.max(lo + 1, ...shown.map((b) => (Number.isFinite(b.max) ? b.max : b.min)));
  const step = top - lo <= 100 ? 1 : top - lo <= 1000 ? 5 : 10;
  // The top end rounds up to a whole step, so the maximum thumb can always reach the end of the track.
  const hi = lo + Math.ceil((top - lo) / step) * step;
  const bounds: [number, number] = [lo, hi];
  const span = hi - lo;

  type Draft = { free: boolean; range: [number, number] };
  const isAllRange = ([min, max]: [number, number]) => min <= lo && max >= hi;
  const paidValues = (range: [number, number]) => paid.filter((b) => b.min <= range[1] && b.max >= range[0]).map((b) => b.value);
  const toValues = ({ free: withFree, range }: Draft) => {
    if (isAllRange(range)) return withFree && free ? [free.value] : [];
    return [...(withFree && free ? [free.value] : []), ...paidValues(range)];
  };
  // The range last applied here, or (applied elsewhere) the span of the applied paid options.
  const [applied, setApplied] = useState<[number, number] | null>(null);
  const toDraft = (values: string[]): Draft => {
    const withFree = Boolean(free && values.includes(free.value));
    const paidPicked = paid.filter((b) => values.includes(b.value));
    if (!paidPicked.length) return { free: withFree, range: bounds };
    if (applied && JSON.stringify(paidValues(applied)) === JSON.stringify(paidPicked.map((b) => b.value)))
      return { free: withFree, range: applied };
    const max = Math.max(...paidPicked.map((b) => b.max));
    return {
      free: withFree,
      range: [Math.max(lo, Math.min(...paidPicked.map((b) => b.min))), Number.isFinite(max) ? Math.min(hi, max) : hi],
    };
  };
  /** The chip's / panel's wording: "Free", "Free, Up to $99", "$50 – $99", "Any price". */
  const describe = ({ free: withFree, range }: Draft) =>
    withFree ? (isAllRange(range) ? 'Free' : `Free, ${rangeLabel(range, bounds)}`) : rangeLabel(range, bounds);

  const [draft, setDraft] = useState<Draft>(() => toDraft(value));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(toDraft(value));
  }

  const isAll = !draft.free && isAllRange(draft.range);
  const results = useDraftCount(open, toValues(draft), { resultsFor, countFor });
  const pct = (n: number) => ((Math.min(Math.max(n, lo), hi) - lo) / span) * 100;
  const freeCount = free ? counts(free.value) : undefined;

  return (
    <FilterPopover
      name={name}
      heading={heading}
      icon={icon}
      label={value.length ? describe(toDraft(value)) : name}
      active={value.length > 0}
      onClear={() => onApply([])}
      open={open}
      onOpenChange={onOpenChange}
      canClear={!isAll}
      onClearDraft={() => setDraft({ free: false, range: bounds })}
      onApply={() => {
        setApplied(isAllRange(draft.range) ? null : draft.range);
        onApply(toValues(draft));
      }}
      applyLabel={showLabel(results)}
    >
      {free && (
        <label className={`${styles.option} ${styles.freeOption}`}>
          <input type="checkbox" checked={draft.free} onChange={(e) => setDraft((d) => ({ ...d, free: e.target.checked }))} />
          <span className={styles.box} aria-hidden>
            <LuCheck />
          </span>
          <span className={styles.label}>Free</span>
          {freeCount != null && <span className={styles.count}>{freeCount}</span>}
        </label>
      )}
      {paid.length > 0 && (
        <>
          <div
            className={styles.slider}
            style={{ '--from': `${pct(draft.range[0])}%`, '--to': `${pct(draft.range[1])}%` } as CSSProperties}
          >
            <div className={styles.track}>
              <div className={styles.range} />
            </div>
            <input
              type="range"
              min={lo}
              max={hi}
              step={step}
              value={draft.range[0]}
              aria-label="Minimum price"
              aria-valuetext={dollars(draft.range[0])}
              // Both thumbs at the top: the minimum one stays on top so it can still be pulled back.
              style={{ zIndex: draft.range[0] >= hi - step ? 2 : 1 }}
              onChange={(e) => setDraft((d) => ({ ...d, range: [Math.min(Number(e.target.value), d.range[1]), d.range[1]] }))}
            />
            <input
              type="range"
              min={lo}
              max={hi}
              step={step}
              value={draft.range[1]}
              aria-label="Maximum price"
              aria-valuetext={draft.range[1] >= hi ? `${dollars(hi)}+` : dollars(draft.range[1])}
              style={{ zIndex: 1 }}
              onChange={(e) => setDraft((d) => ({ ...d, range: [d.range[0], Math.max(Number(e.target.value), d.range[0])] }))}
            />
          </div>
          <div className={styles.priceText}>{draft.free && isAllRange(draft.range) ? 'Free only' : describe(draft)}</div>
        </>
      )}
    </FilterPopover>
  );
}
