'use client';

import type { ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';
import styles from './FilterChip.module.css';
import own from './ToggleChip.module.css';

type Props = {
  label: string;
  icon: ReactNode;
  on: boolean;
  /** The results with it on (shown while it is off; none while unknown). */
  count?: number;
  onChange: (on: boolean) => void;
};

/**
 * A filter that is on or off (an article's tag), as a pill of the filter bar: the gold "applied" pill with a check when
 * on, the results it would show beside its name when off.
 */
export default function ToggleChip({ label, icon, on, count, onChange }: Props) {
  return (
    <div className={`${styles.wrap} ${on ? styles.active : ''}`}>
      <button type="button" className={`${styles.chip} ${own.toggle}`} aria-pressed={on} onClick={() => onChange(!on)}>
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.text}>{label}</span>
        {on ? <LuCheck className={own.check} aria-hidden /> : count !== undefined && <span className={own.count}>{count}</span>}
      </button>
    </div>
  );
}
