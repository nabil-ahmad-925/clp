'use client';

import { useState } from 'react';
import type { BulkRequest } from '@/content/bulk';
import st from './requestStage.module.css';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const OPEN = ['quoted', 'deposit', 'proof', 'in-production', 'shipped'];

/** One checkpoint: done (with its date) or still to come. */
function Point({ done, at, label, next }: { done: boolean; at?: string; label: string; next: string }) {
  return (
    <span className={st.chip} style={{ background: done ? '#E7F3EC' : '#F2F1ED', color: done ? '#1E7A45' : '#666666' }}>
      {done ? `✓ ${label}${at ? ` · ${day(at)}` : ''}` : next}
    </span>
  );
}

/**
 * The two checkpoints of their order (the client's rules): Manufacturing files cleared (we checked every file is ready
 * to make) and Proof approved (they authorized production), then their own history with dates.
 */
export default function RequestCheckpoints({ r }: { r: BulkRequest }) {
  const [open, setOpen] = useState(false);
  const c = r.checkpoints;
  const history = r.history ?? [];
  if (!c || (!OPEN.includes(r.status) && !history.length)) return null;
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {OPEN.includes(r.status) && (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Point done={c.files.cleared} at={c.files.at} label="Files cleared for production" next="Files being checked" />
          <Point done={c.proof.approved} at={c.proof.at} label="Proof approved" next="Proof to approve" />
        </span>
      )}
      {history.length > 0 && (
        <button type="button" className={st.text} aria-expanded={open} onClick={() => setOpen(!open)} style={{ justifySelf: 'start', padding: 0 }}>
          {open ? 'Hide Your History' : `Your History (${history.length})`}
        </button>
      )}
      {open && (
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 3, color: '#555', fontSize: 13 }}>
          {history.map((h, i) => (
            <li key={`${h.at}-${i}`}>
              {day(h.at)} · {h.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
