'use client';

import { useState } from 'react';
import { proofFilesOf, type BulkRequest } from '@/content/bulk';
import ProofFiles from './ProofFiles';
import st from './requestStage.module.css';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const STATE = { sent: 'Replaced', changes: 'You asked for a change', approved: 'Approved' } as const;

/** The proofs we sent before the one now (newest first), behind a toggle: their files and the change they asked. */
export default function EarlierProofs({ list = [] }: { list?: BulkRequest['proofHistory'] }) {
  const [open, setOpen] = useState(false);
  if (!list.length) return null;
  return (
    <span className={st.earlier}>
      <button type="button" className={st.text} aria-expanded={open} onClick={() => setOpen(!open)}>
        {`${open ? 'Hide' : 'Show'} Earlier Proofs (${list.length})`}
      </button>
      {open &&
        list.map((p, i) => (
          <span key={`${p.sentAt}-${i}`} className={st.sample}>
            <span className={st.sampleHead}>
              <b>{`Proof · ${day(p.sentAt)}`}</b>
              <span className={st.chip} style={{ background: '#F2F1ED', color: '#444444' }}>
                {STATE[p.state]}
              </span>
            </span>
            <ProofFiles files={proofFilesOf(p)} />
            {p.reply && <span>{`You asked: “${p.reply.note}”`}</span>}
          </span>
        ))}
    </span>
  );
}
