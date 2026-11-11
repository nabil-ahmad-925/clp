'use client';
/* eslint-disable @next/next/no-img-element -- photos from the workshop, shown as CLP shared them. */

import { useState } from 'react';
import type { BulkRequest, RequestAction, RequestActionInput, RequestSample } from '@/content/bulk';
import st from './requestStage.module.css';

const KIND: Record<RequestSample['kind'], string> = { proof: 'Proof', sample: 'Sample', finished: 'Your finished order' };
const STATUS: Record<RequestSample['status'], [string, string, string]> = {
  shared: ['From the workshop', '#F2F1ED', '#444444'],
  waiting: ['Please approve', '#111111', '#FFFFFF'],
  approved: ['Approved', '#E7F3EC', '#1E7A45'],
  changes: ['Change asked', '#FBEAE8', '#B03A2E'],
};
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
type Act = (action: RequestAction, input?: RequestActionInput) => void;

/** One shared or to-approve set: what it is, CLP's note, the pictures, and approving it or asking for a change. */
function SampleRow({ s, busy, act }: { s: RequestSample; busy: string; act: Act }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [chip, bg, fg] = STATUS[s.status];
  return (
    <div className={st.sample}>
      <span className={st.sampleHead}>
        <b>{`${KIND[s.kind]}${s.at ? ` · ${day(s.at)}` : ''}`}</b>
        <span className={st.chip} style={{ background: bg, color: fg }}>
          {chip}
        </span>
      </span>
      {s.note && <span>{s.note}</span>}
      <span className={st.shots}>
        {s.files.map((f, i) => (
          <a key={`${f.url}-${i}`} href={f.url} target="_blank" rel="noopener noreferrer" title={f.name}>
            {f.image ? <img src={f.url} alt={f.name} loading="lazy" /> : <span className={st.shotFile}>{f.name}</span>}
          </a>
        ))}
      </span>
      {s.status === 'changes' && s.reply && <span>You asked {day(s.reply.at)}: “{s.reply.note}”. We’ll send new photos.</span>}
      {s.status === 'waiting' && (
        <>
          {asking && (
            <label className={st.field}>
              What should we change?
              <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          )}
          <span className={st.acts}>
            {!asking && (
              <button type="button" className={st.dark} disabled={Boolean(busy)} onClick={() => act('approve-sample', { sampleId: s.id })}>
                {busy === 'approve-sample' ? 'Approving…' : 'Approve'}
              </button>
            )}
            <button type="button" className={asking ? st.dark : st.light} disabled={Boolean(busy) || (asking && !note.trim())} onClick={() => (asking ? act('sample-changes', { sampleId: s.id, note: note.trim() }) : setAsking(true))}>
              {busy === 'sample-changes' ? 'Sending…' : asking ? 'Send Change' : 'Ask for a Change'}
            </button>
            {asking && (
              <button type="button" className={st.text} onClick={() => setAsking(false)}>
                Cancel
              </button>
            )}
          </span>
        </>
      )}
    </div>
  );
}

/** Something from the workshop waits for their approval. */
export const sampleWaiting = (r: BulkRequest) => (r.samples ?? []).some((s) => s.status === 'waiting');

/**
 * Photos and samples from the workshop on Quote Requests (the design's "Photos from the maker"): what CLP shared, and
 * what it asks them to approve before it goes on (a finished order ships once they approve it). Newest first.
 */
export default function RequestSamples({ r, busy, act }: { r: BulkRequest; busy: string; act: Act }) {
  const list = [...(r.samples ?? [])].sort((x, y) => y.at.localeCompare(x.at));
  if (!list.length) return null;
  return (
    <div className={st.box} data-on={sampleWaiting(r)}>
      <strong>PHOTOS FROM THE WORKSHOP</strong>
      <span>{sampleWaiting(r) ? 'Please take a look and approve, or tell us what to change.' : 'How your order is coming along.'}</span>
      {list.map((s) => (
        <SampleRow key={s.id} s={s} busy={busy} act={act} />
      ))}
    </div>
  );
}
