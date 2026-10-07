'use client';

import { useId, useState, type ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';
import FilterPopover, { showLabel, useDraftCount, type DraftCount } from './FilterPopover';
import styles from './FilterChip.module.css';

/** `count` omitted: not known (the option is listed without a number). */
export type ChipOption = { value: string; label: string; count?: number };

type Props = DraftCount & {
  name: string;
  /** The panel's caption (e.g. "Age group"); defaults to `name`. */
  heading?: string;
  /** Plural noun for several applied values: "2 cities". */
  plural?: string;
  icon: ReactNode;
  options: ChipOption[];
  /** The applied values; the panel edits a draft copy until "Show" is pressed. */
  value: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (values: string[]) => void;
  /** One option at a time (round buttons): choosing another replaces it. */
  single?: boolean;
};

/**
 * Filter pill with a checkbox panel (tenpo.com's Sport / When / Age chips): options are multi-select (or one at a time
 * with `single`), each with its result count; "Clear" empties the draft and "Show N results" applies it.
 */
export default function FilterChip({
  name,
  heading,
  plural,
  icon,
  options,
  value,
  open,
  onOpenChange,
  resultsFor,
  countFor,
  onApply,
  single = false,
}: Props) {
  const [draft, setDraft] = useState(value);
  const group = useId();

  // Each opening starts from the applied values.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const results = useDraftCount(open, draft, { resultsFor, countFor });

  const labels = new Map(options.map((o) => [o.value, o.label]));
  const applied = value.filter((v) => labels.has(v));
  const label = applied.length === 0 ? name : applied.length === 1 ? labels.get(applied[0])! : `${applied.length} ${plural ?? 'selected'}`;
  const toggle = (v: string) => setDraft((d) => (single ? [v] : d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));

  return (
    <FilterPopover
      name={name}
      heading={heading}
      icon={icon}
      label={label}
      active={value.length > 0}
      onClear={() => onApply([])}
      open={open}
      onOpenChange={onOpenChange}
      canClear={draft.length > 0}
      onClearDraft={() => setDraft([])}
      onApply={() => onApply(draft)}
      applyLabel={showLabel(results)}
    >
      <div className={styles.options}>
        {options.map((o) => (
          <label key={o.value} className={`${styles.option} ${single ? styles.single : ''}`}>
            <input type={single ? 'radio' : 'checkbox'} name={single ? group : undefined} checked={draft.includes(o.value)} onChange={() => toggle(o.value)} />
            <span className={styles.box} aria-hidden>
              <LuCheck />
            </span>
            <span className={styles.label}>{o.label}</span>
            {o.count != null && <span className={styles.count}>{o.count}</span>}
          </label>
        ))}
      </div>
    </FilterPopover>
  );
}
