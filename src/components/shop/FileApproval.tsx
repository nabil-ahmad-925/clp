'use client';

import { useState } from 'react';
import type { FileKey, ProductionFile, RequestAction, RequestActionInput } from '@/content/bulk';
import { changeWords } from './fileWords';
import st from './requestStage.module.css';

type Act = (action: RequestAction, input: RequestActionInput) => void;

/** Our change to their file waits on them: what we changed and did, then Approve Change or Ask for a Change (their note). */
export default function FileApproval({ k, f, busy, act }: { k: FileKey; f: ProductionFile; busy: string; act: Act }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const v = f.versions.at(-1);
  return (
    <span style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13 }}>
        We prepared it for production: <b>{changeWords(v)}</b>.{v?.done ? ` ${v.done}.` : ''} Please check it before we go on.
      </span>
      {asking && (
        <label className={st.field}>
          What should we change?
          <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      )}
      <span className={st.acts}>
        {!asking && (
          <button type="button" className={st.dark} disabled={Boolean(busy)} onClick={() => act('approve-file-change', { fileKey: k })}>
            {busy === 'approve-file-change' ? 'Approving…' : 'Approve Change'}
          </button>
        )}
        <button type="button" className={asking ? st.dark : st.light} disabled={Boolean(busy) || (asking && !note.trim())} onClick={() => (asking ? act('decline-file-change', { fileKey: k, note: note.trim() }) : setAsking(true))}>
          {busy === 'decline-file-change' ? 'Sending…' : asking ? 'Send Change' : 'Ask for a Change'}
        </button>
        {asking && (
          <button type="button" className={st.text} onClick={() => setAsking(false)}>
            Cancel
          </button>
        )}
      </span>
    </span>
  );
}
