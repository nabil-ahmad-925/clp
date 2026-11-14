'use client';

import { useState } from 'react';
import { proofFilesOf, type BulkRequest, type RequestAction, type RequestActionInput } from '@/content/bulk';
import { proofWaiting } from '@/content/bulkStages';
import st from './requestStage.module.css';
import EarlierProofs from './EarlierProofs';
import ProofFiles from './ProofFiles';

const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * A request's proof on the shop: being prepared, to approve (every file of it shown: pictures, PDFs, links; New when
 * it replaced an earlier one) or change, or the change they asked. The earlier proofs follow. (Paying is RequestPay.)
 * Nothing for any other status.
 */
export default function RequestStage({ r, busy, act }: { r: BulkRequest; busy: string; act: (action: RequestAction, input?: RequestActionInput) => void }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  if (r.status !== 'proof') return null;
  const paid = r.po ? `Purchase order ${r.po.number} received.` : r.money?.paid ? `${money(r.money.paid)} received.` : '';
  if (!r.proof) return <div className={st.box}><strong>YOUR PROOF IS NEXT</strong><span>{paid} We’re preparing your proof and will e-mail you to approve it before anything is made.</span></div>;
  if (r.proof.state === 'changes') {
    return (
      <div className={st.box}>
        <strong>YOUR CHANGE</strong>
        <span>You asked {r.proof.reply ? `${day(r.proof.reply.at)}: “${r.proof.reply.note}”` : 'for a change'}. We’ll send a new proof.</span>
        <ProofFiles files={proofFilesOf(r.proof)} />
        <EarlierProofs list={r.proofHistory} />
      </div>
    );
  }
  return (
    <div className={st.box} data-on={proofWaiting(r)}>
      <span className={st.sampleHead}>
        <strong>YOUR PROOF</strong>
        {(r.proofHistory?.length ?? 0) > 0 && (
          <span className={st.chip} style={{ background: '#111111', color: '#FFFFFF' }}>
            New
          </span>
        )}
      </span>
      <span>
        {paid} Here’s exactly how it will be made.{r.proof.note ? ` ${r.proof.note}.` : ''}
      </span>
      <ProofFiles files={proofFilesOf(r.proof)} />
      {r.proof.details && (
        <span style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px', fontSize: 13 }}>
          {[['Product color', r.proof.details.color], ['Logo placement', r.proof.details.placement], ['Logo size', r.proof.details.size], ['Method', r.proof.details.method]].map(([k, v]) => (
            <span key={k} style={{ display: 'contents' }}>
              <b>{k}</b>
              <span>{v}</span>
            </span>
          ))}
        </span>
      )}
      {proofWaiting(r) && (
        <>
          {asking && (
            <label className={st.field}>
              What should we change?
              <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          )}
          <span className={st.acts}>
            {!asking && (
              <button type="button" className={st.dark} disabled={Boolean(busy)} onClick={() => act('approve-proof')}>
                {busy === 'approve-proof' ? 'Approving…' : 'Approve Proof'}
              </button>
            )}
            <button type="button" className={asking ? st.dark : st.light} disabled={Boolean(busy) || (asking && !note.trim())} onClick={() => (asking ? act('proof-changes', { note: note.trim() }) : setAsking(true))}>
              {busy === 'proof-changes' ? 'Sending…' : asking ? 'Send Change' : 'Ask for a Change'}
            </button>
            {asking && (
              <button type="button" className={st.text} onClick={() => setAsking(false)}>
                Cancel
              </button>
            )}
          </span>
        </>
      )}
      <EarlierProofs list={r.proofHistory} />
    </div>
  );
}
