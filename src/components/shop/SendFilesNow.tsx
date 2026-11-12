'use client';

import { useState } from 'react';
import { designAction, guestRequestAction, type BulkRequest, type RequestAction, type RequestActionInput } from '@/content/bulk';
import RequestFiles from './RequestFiles';
import st from './requestStage.module.css';

/** What still has to come from them: the required files not sent yet (or sent back to them), by name. */
export const filesToSend = (r: BulkRequest) => Object.values(r.files ?? {}).filter((f) => f?.required && (f.status === 'missing' || f.status === 'changes')).map((f) => f!.label);

/**
 * Right after a quote request or order is sent: its production files (the vector logo, the logo image, the small logo
 * and the rest its decoration needs, from the API), to send now instead of later from Quote Requests. Each upload goes
 * through the same checks as there. Collapsed to one line until they open it.
 */
export default function SendFilesNow({ request, partner }: { request: BulkRequest; partner: boolean }) {
  const [r, setR] = useState(request);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const left = filesToSend(r);
  const named = left.length > 1 ? `${left.slice(0, -1).join(', ')} and ${left.at(-1)}` : left[0];
  if (!Object.keys(r.files ?? {}).length) return null;
  const act = async (action: RequestAction, input: RequestActionInput) => {
    setBusy(action);
    setError('');
    try {
      setR(await (partner ? designAction : guestRequestAction)(r.id, action, input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t go through. Please try again.');
    } finally {
      setBusy('');
    }
  };
  return (
    <div style={{ display: 'grid', gap: 10, width: '100%', color: '#111', textAlign: 'left' }}>
      <div className={st.box} data-on={!open}>
        <strong>SEND YOUR FILES NOW</strong>
        <span>{left.length ? `We still need your ${named.toLowerCase()}. Send ${left.length === 1 ? 'it' : 'them'} now and we start sooner, or later from Quote Requests.` : 'Your files are with us. We check each one before your proof.'}</span>
        <span className={st.acts}>
          <button type="button" className={open ? st.light : st.dark} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide Files' : left.length ? 'Send Files Now' : 'See Your Files'}
          </button>
        </span>
      </div>
      {open && <RequestFiles r={r} busy={busy} act={(action, input) => void act(action, input)} />}
      {error && (
        <p role="alert" style={{ margin: 0, color: '#b42318', fontSize: 13 }}>
          {error}
        </p>
      )}
    </div>
  );
}
