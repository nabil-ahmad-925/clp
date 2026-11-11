'use client';

import { useState } from 'react';
import type { BulkRequest, FileKey, ProductionFile, RequestAction, RequestActionInput } from '@/content/bulk';
import st from './requestStage.module.css';

const STATUS: Record<ProductionFile['status'], [string, string, string]> = {
  missing: ['Needed', '#FBF3E2', '#8A6F33'],
  review: ['We’re checking it', '#F2F1ED', '#444444'],
  approved: ['Approved', '#E7F3EC', '#1E7A45'],
  changes: ['Send a new one', '#FBEAE8', '#B03A2E'],
  clp: ['We’re making it', '#F2F1ED', '#444444'],
  optional: ['Optional', '#F2F1ED', '#666666'],
};
// Every open request (from the first ask): the files are what CLP checks, there's no separate artwork check.
const OPEN = ['art', 'changes', 'quote', 'maker', 'maker-in', 'quoted', 'deposit', 'proof', 'in-production'];
const MAX = 350 * 1024;
type Act = (action: RequestAction, input: RequestActionInput) => void;

const read = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ''));
    r.onerror = () => reject(new Error('That file couldn’t be read.'));
    r.readAsDataURL(file);
  });

const field = { flex: 1, minWidth: 180, height: 40, padding: '0 12px', border: '1px solid #ddddda', borderRadius: 8, font: 'inherit' } as const;

/** What was sent for a category: the text (thread colors…), or each file (all of them for a category that takes several). */
function Sent({ f }: { f: ProductionFile }) {
  const shown = f.multiple ? f.versions : f.versions.slice(-1);
  if (!shown.length) return <span style={{ color: '#666', fontSize: 13 }}>{f.hint}</span>;
  return (
    <span style={{ color: '#666', fontSize: 13, display: 'grid', gap: 2 }}>
      {shown.map((v, i) =>
        v.text ? (
          <span key={i}>Sent: {v.text}</span>
        ) : (
          <span key={i}>
            Sent: <a href={v.url} target="_blank" rel="noopener noreferrer">{v.name}</a>
          </span>
        ),
      )}
    </span>
  );
}

/** One category: where it stands, CLP's note, what was sent, and sending it (a file, a link, or the text). */
function FileRow({ k, f, busy, act }: { k: FileKey; f: ProductionFile; busy: string; act: Act }) {
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [chip, bg, fg] = STATUS[f.status];
  const accept = f.accept ?? [];
  const canSend = Boolean(f.multiple) || (f.status !== 'approved' && f.status !== 'clp');
  const upload = async (file: File | undefined) => {
    setError('');
    if (!file) return;
    const ext = /\.([a-z0-9]{2,4})$/i.exec(file.name)?.[1]?.toLowerCase() ?? '';
    if (!accept.includes(ext)) return setError(`This needs a ${accept.map((a) => a.toUpperCase()).join(', ')} file.`);
    if (file.size > MAX) return setError('That file is over 350 KB. Paste a link to it instead (Google Drive, Dropbox, WeTransfer).');
    try {
      act('add-file', { fileKey: k, name: file.name, data: await read(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file couldn’t be read.');
    }
  };
  return (
    <div style={{ display: 'grid', gap: 6, padding: '10px 0', borderTop: '1px solid #ebe8e1' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <b style={{ flex: 1, minWidth: 140 }}>{f.label}</b>
        <span style={{ padding: '3px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 700 }}>{chip}</span>
      </span>
      <Sent f={f} />
      {f.status === 'changes' && f.note && <span style={{ color: '#B03A2E', fontSize: 13 }}>{f.note}</span>}
      {canSend && f.type === 'text' && (
        <span className={st.acts}>
          <input value={text} maxLength={300} placeholder={f.hint} aria-label={f.label} onChange={(e) => setText(e.target.value)} style={field} />
          <button type="button" className={st.light} disabled={Boolean(busy) || !text.trim()} onClick={() => act('add-file', { fileKey: k, text: text.trim() })}>
            {f.versions.length ? 'Send New' : 'Send'}
          </button>
        </span>
      )}
      {canSend && f.type === 'file' && (
        <span className={st.acts}>
          <label className={st.light} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {busy === 'add-file' ? 'Uploading…' : f.multiple && f.versions.length ? 'Add Another' : f.versions.length ? 'Upload a New File' : 'Upload File'}
            <input type="file" accept={accept.map((a) => `.${a}`).join(',')} hidden aria-label={`Upload ${f.label}`} disabled={Boolean(busy)} onChange={(e) => (void upload(e.target.files?.[0]), (e.target.value = ''))} />
          </label>
          <input value={link} placeholder="or paste a link (https://…)" aria-label={`Link to your ${f.label}`} maxLength={590} onChange={(e) => setLink(e.target.value)} style={field} />
          <button type="button" className={st.text} disabled={Boolean(busy) || !link.trim()} onClick={() => act('add-file', { fileKey: k, link: link.trim() })}>
            Send Link
          </button>
        </span>
      )}
      {error && (
        <span role="alert" style={{ color: '#B03A2E', fontSize: 13 }}>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * The order's production files on Quote Requests: the required ones its decoration needs (the logo, a placement
 * mockup, a stitch file and thread colors, ink colors, print-ready artwork, a roster…), then the optional extras. Each
 * is sent as a file (up to 350 KB), a link, or text. CLP checks each before the proof.
 */
export default function RequestFiles({ r, busy, act }: { r: BulkRequest; busy: string; act: Act }) {
  const [more, setMore] = useState(false);
  const all = Object.entries(r.files ?? {}) as [FileKey, ProductionFile][];
  if (!all.length || !OPEN.includes(r.status)) return null;
  const required = all.filter(([, f]) => f.required);
  const optional = all.filter(([, f]) => !f.required);
  const done = required.every(([, f]) => f.status === 'approved');
  return (
    <div className={st.box}>
      <strong>PRODUCTION FILES</strong>
      <span>
        {done ? 'All required files are approved. Thank you.' : 'We make your order from these. Send each one, we check it before your proof.'}
        {r.needsMethod ? ' We’ll confirm how it’s made, and the optional files marked “If we use…” may be needed then.' : ''}
      </span>
      {required.map(([k, f]) => (
        <FileRow key={k} k={k} f={f} busy={busy} act={act} />
      ))}
      {optional.length > 0 && (
        <button type="button" className={st.text} aria-expanded={more} onClick={() => setMore(!more)} style={{ justifySelf: 'start', padding: 0 }}>
          {more ? 'Hide optional files' : `Optional files (${optional.length})`}
        </button>
      )}
      {more && optional.map(([k, f]) => <FileRow key={k} k={k} f={f} busy={busy} act={act} />)}
    </div>
  );
}
