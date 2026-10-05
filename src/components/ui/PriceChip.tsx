'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
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
 * tenpo.com's price chip: a two-thumb dollar slider from the cheapest to the dearest price that has results. The
 * chosen range applies as the price options it overlaps, so it filters exactly like ticking those options would.
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
  const available = buckets.filter((b) => (counts(b.value) ?? 1) > 0 || value.includes(b.value));
  const shown = available.length ? available : buckets;
  // The open-ended top option ("$10k+") ends the slider at its lowest price.
  const lo = Math.min(...shown.map((b) => b.min));
  const top = Math.max(lo + 1, ...shown.map((b) => (Number.isFinite(b.max) ? b.max : b.min)));
  const step = top - lo <= 100 ? 1 : top - lo <= 1000 ? 5 : 10;
  // The top end rounds up to a whole step, so the maximum thumb can always reach the end of the track.
  const hi = lo + Math.ceil((top - lo) / step) * step;
  const bounds: [number, number] = [lo, hi];
  const span = hi - lo;

  // The whole span applies as no price filter at all.
  const toValues = ([min, max]: [number, number]) =>
    min <= lo && max >= hi ? [] : buckets.filter((b) => b.min <= max && b.max >= min).map((b) => b.value);
  // The range last applied here, or (applied elsewhere) the span of the applied options.
  const [applied, setApplied] = useState<[number, number] | null>(null);
  const toRange = (values: string[]): [number, number] => {
    if (applied && JSON.stringify(toValues(applied)) === JSON.stringify(values)) return applied;
    const picked = buckets.filter((b) => values.includes(b.value));
    if (!picked.length) return bounds;
    const max = Math.max(...picked.map((b) => b.max));
    return [Math.max(lo, Math.min(...picked.map((b) => b.min))), Number.isFinite(max) ? Math.min(hi, max) : hi];
  };

  const [draft, setDraft] = useState<[number, number]>(() => toRange(value));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(toRange(value));
  }

  const isAll = draft[0] <= lo && draft[1] >= hi;
  const results = useDraftCount(open, toValues(draft), { resultsFor, countFor });
  const pct = (n: number) => ((Math.min(Math.max(n, lo), hi) - lo) / span) * 100;

  return (
    <FilterPopover
      name={name}
      heading={heading}
      icon={icon}
      label={value.length ? rangeLabel(toRange(value), bounds) : name}
      active={value.length > 0}
      onClear={() => onApply([])}
      open={open}
      onOpenChange={onOpenChange}
      canClear={!isAll}
      onClearDraft={() => setDraft(bounds)}
      onApply={() => {
        setApplied(isAll ? null : draft);
        onApply(toValues(draft));
      }}
      applyLabel={showLabel(results)}
    >
      <div className={styles.slider} style={{ '--from': `${pct(draft[0])}%`, '--to': `${pct(draft[1])}%` } as CSSProperties}>
        <div className={styles.track}>
          <div className={styles.range} />
        </div>
        <input
          type="range"
          min={lo}
          max={hi}
          step={step}
          value={draft[0]}
          aria-label="Minimum price"
          aria-valuetext={dollars(draft[0])}
          // Both thumbs at the top: the minimum one stays on top so it can still be pulled back.
          style={{ zIndex: draft[0] >= hi - step ? 2 : 1 }}
          onChange={(e) => setDraft(([, max]) => [Math.min(Number(e.target.value), max), max])}
        />
        <input
          type="range"
          min={lo}
          max={hi}
          step={step}
          value={draft[1]}
          aria-label="Maximum price"
          aria-valuetext={draft[1] >= hi ? `${dollars(hi)}+` : dollars(draft[1])}
          style={{ zIndex: 1 }}
          onChange={(e) => setDraft(([min]) => [min, Math.max(Number(e.target.value), min)])}
        />
      </div>
      <div className={styles.priceText}>{rangeLabel(draft, bounds)}</div>
    </FilterPopover>
  );
}
