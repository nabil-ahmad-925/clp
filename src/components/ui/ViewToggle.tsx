'use client';

import { LuLayoutGrid, LuList } from 'react-icons/lu';
import styles from './ViewToggle.module.css';

export type ResultsView = 'grid' | 'list';

/** Grid / list switch (tenpo.com's "Results view" pill), black when on. */
export default function ViewToggle({ value, onChange }: { value: ResultsView; onChange: (view: ResultsView) => void }) {
  return (
    <div className={styles.viewToggle} role="group" aria-label="Results view">
      {(['grid', 'list'] as const).map((v) => (
        <button
          key={v}
          type="button"
          className={`${styles.viewBtn} ${value === v ? styles.viewOn : ''}`}
          aria-pressed={value === v}
          aria-label={v === 'grid' ? 'Grid view' : 'List view'}
          onClick={() => onChange(v)}
        >
          {v === 'grid' ? <LuLayoutGrid aria-hidden /> : <LuList aria-hidden />}
        </button>
      ))}
    </div>
  );
}
