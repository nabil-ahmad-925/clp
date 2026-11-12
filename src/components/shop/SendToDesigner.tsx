'use client';

import { useState } from 'react';
import type { BulkRequest, RequestAction, RequestActionInput } from '@/content/bulk';
import st from './requestStage.module.css';

type Act = (action: RequestAction, input: RequestActionInput) => void;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const field = { flex: 1, minWidth: 180, height: 40, padding: '0 12px', border: '1px solid #ddddda', borderRadius: 8, font: 'inherit' } as const;

/**
 * "Send to My Designer" (the design's Quote Requests file block): their designer gets an upload link for the files still
 * needed, no account (we remind them after 2 days). Shown while files are still to send.
 */
export default function SendToDesigner({ r, busy, act }: { r: BulkRequest; busy: string; act: Act }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const toSend = Object.values(r.files ?? {}).some((f) => f?.required && (f.status === 'missing' || f.status === 'changes'));
  if (!toSend) return null;
  const send = () => {
    if (!EMAIL.test(email.trim())) return setError('Enter your designer’s e-mail address.');
    act('send-to-designer', { email: email.trim(), note: note.trim() });
    setOpen(false);
  };
  return (
    <span style={{ display: 'grid', gap: 6, fontSize: 13 }}>
      {r.designer && <span>{`Sent to your designer (${r.designer.email}) ${day(r.designer.at)}. They upload from the link, no account needed, and we remind them after 2 days.`}</span>}
      {!open ? (
        <button type="button" className={st.text} style={{ justifySelf: 'start', padding: 0 }} onClick={() => setOpen(true)}>
          {r.designer ? 'Send to Someone Else' : 'Send to My Designer'}
        </button>
      ) : (
        <span style={{ display: 'grid', gap: 6 }}>
          <span>Your designer gets a link to upload the files still needed, no account needed.</span>
          <span className={st.acts}>
            <input type="email" value={email} maxLength={200} placeholder="designer@example.com" aria-label="Your designer’s e-mail" onChange={(e) => (setEmail(e.target.value), setError(''))} style={field} />
          </span>
          <input value={note} maxLength={500} placeholder="A note for them (optional)" aria-label="A note for your designer" onChange={(e) => setNote(e.target.value)} style={field} />
          <span className={st.acts}>
            <button type="button" className={st.dark} disabled={Boolean(busy)} onClick={send}>
              {busy === 'send-to-designer' ? 'Sending…' : 'Send the Link'}
            </button>
            <button type="button" className={st.light} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </span>
          {error && (
            <span role="alert" style={{ color: '#B03A2E' }}>
              {error}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
