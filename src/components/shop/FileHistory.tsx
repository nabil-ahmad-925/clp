'use client';

import { useState } from 'react';
import type { ProductionFile } from '@/content/bulk';
import { versionTag } from './fileWords';
import st from './requestStage.module.css';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Every version of a file, newest first (your original always stays): what it is and what we did. Behind a toggle. */
export default function FileHistory({ f }: { f: ProductionFile }) {
  const [open, setOpen] = useState(false);
  if (f.versions.length < 2) return null;
  return (
    <span style={{ display: 'grid', gap: 4 }}>
      <button type="button" className={st.text} aria-expanded={open} onClick={() => setOpen(!open)} style={{ justifySelf: 'start', padding: 0 }}>
        {open ? 'Hide history' : `History (${f.versions.length})`}
      </button>
      {open && (
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4, color: '#666', fontSize: 13 }} reversed>
          {[...f.versions].reverse().map((v, j) => {
            const i = f.versions.length - 1 - j;
            return (
              <li key={`${v.url ?? v.text}-${i}`}>
                {day(v.at)} · {v.text ? v.text : <a href={v.url} target="_blank" rel="noopener noreferrer">{v.name}</a>} · {versionTag(f, v, i)}
                {v.done ? ` · ${v.done}` : ''}
              </li>
            );
          })}
        </ol>
      )}
    </span>
  );
}
