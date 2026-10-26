'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import FilterPopover, { showLabel, useDraftCount } from './FilterPopover';
import styles from './FilterChip.module.css';

/** A price range as the address keeps it: "25-80" (dollars, cents allowed), "" for any price. */
export type PriceRange = [number, number];
export const priceRangeValue = ([min, max]: PriceRange) => `${min}-${max}`;
export const parsePriceRange = (value: string): PriceRange | null => {
  const m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(value);
  return m && Number(m[1]) <= Number(m[2]) ? [Number(m[1]), Number(m[2])] : null;
};
export const inPriceRange = (price: number, value: string) => {
  const r = parsePriceRange(value);
  return !r || (price >= r[0] && price <= r[1]);
};

const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;

/** The wording of a range within the slider's bounds (as the experiences' price chip): "Up to $50", "$25+", "$25 – $50". */
export function priceRangeLabel([min, max]: PriceRange, [lo, hi]: PriceRange) {
  if (min <= lo && max >= hi) return 'Any Price';
  if (min <= lo) return `Up to ${dollars(max)}`;
  if (max >= hi) return `${dollars(min)}+`;
  return `${dollars(min)} – ${dollars(max)}`;
}

type Props = {
  name: string;
  heading?: string;
  icon: ReactNode;
  /** The cheapest and dearest prices of the list: the slider's ends. */
  bounds: PriceRange;
  /** The applied range ("" for any price). */
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many results a range would show (the panel's "Show N results"). */
  count: (value: string) => number;
  onApply: (value: string) => void;
};

/**
 * The experiences' price chip (PriceChip's two-thumb dollar slider) over actual prices: the list's cheapest to its
 * dearest, whole dollars. The whole span is any price.
 */
export default function PriceRangeChip({ name, heading, icon, bounds, value, open, onOpenChange, count, onApply }: Props) {
  const lo = Math.floor(bounds[0]);
  const hi = Math.max(lo + 1, Math.ceil(bounds[1]));
  const step = hi - lo <= 200 ? 1 : 5;
  const span = hi - lo;
  const clamp = (r: PriceRange): PriceRange => [Math.max(lo, Math.min(r[0], hi)), Math.max(lo, Math.min(r[1], hi))];
  const applied = parsePriceRange(value);
  const isAll = (r: PriceRange) => r[0] <= lo && r[1] >= hi;
  const toValue = (r: PriceRange) => (isAll(r) ? '' : priceRangeValue(r));

  const [draft, setDraft] = useState<PriceRange>(() => (applied ? clamp(applied) : [lo, hi]));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(applied ? clamp(applied) : [lo, hi]);
  }
  const results = useDraftCount(open, [toValue(draft)], { resultsFor: (d) => count(d[0] ?? '') });
  const pct = (n: number) => ((Math.min(Math.max(n, lo), hi) - lo) / span) * 100;

  return (
    <FilterPopover
      name={name}
      heading={heading}
      icon={icon}
      label={applied ? priceRangeLabel(applied, [lo, hi]) : name}
      active={Boolean(applied)}
      onClear={() => onApply('')}
      open={open}
      onOpenChange={onOpenChange}
      canClear={!isAll(draft)}
      onClearDraft={() => setDraft([lo, hi])}
      onApply={() => onApply(toValue(draft))}
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
          onChange={(e) => setDraft((d) => [Math.min(Number(e.target.value), d[1]), d[1]])}
        />
        <input
          type="range"
          min={lo}
          max={hi}
          step={step}
          value={draft[1]}
          aria-label="Maximum price"
          aria-valuetext={dollars(draft[1])}
          style={{ zIndex: 1 }}
          onChange={(e) => setDraft((d) => [d[0], Math.max(Number(e.target.value), d[0])])}
        />
      </div>
      <div className={styles.priceText}>{priceRangeLabel(draft, [lo, hi])}</div>
    </FilterPopover>
  );
}
