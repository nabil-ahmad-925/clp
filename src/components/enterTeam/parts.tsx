import type { ReactNode } from 'react';
import type { Tag as TagData } from './entryRules';
import s from './steps.module.css';

/** A status tag on a row (Eligible, On File, Missing…). */
export function Tag({ tag }: { tag: TagData }) {
  return <span className={`${s.tag} ${s[tag.tone]}`}>{tag.label}</span>;
}

/** A row's title and the line under it. */
export function RowText({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <span className={s.rowText}>
      <span className={s.rowTitle}>{title}</span>
      {sub && <span className={s.rowSub}>{sub}</span>}
    </span>
  );
}

/** The design's amber note with its warning sign. */
export function Warn({ children }: { children: ReactNode }) {
  return (
    <div className={s.warn} role="note">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a5a00" strokeWidth="2" aria-hidden>
        <path d="M12 3l9 16H3z" />
        <path d="M12 10v4M12 17v.5" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
