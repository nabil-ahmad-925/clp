'use client';

import { useState, type ReactNode } from 'react';
import type { FileKey, ProductionFile, RequestAction, RequestActionInput } from '@/content/bulk';
import FileApproval from './FileApproval';
import FileHistory from './FileHistory';
import { FILE_STATUS, REASON, infoWords } from './fileWords';
import st from './requestStage.module.css';

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

/**
 * One file of the order: where it stands, why we need a new one, our change to approve, its history, and sending it (a
 * file up to 350 KB, a link, or the text).
 */
export default function FileRow({ k, f, busy, act, children }: { k: FileKey; f: ProductionFile; busy: string; act: Act; children?: ReactNode }) {
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [chip, bg, fg] = FILE_STATUS[f.status];
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
      {infoWords(f.versions.at(-1)) && <span style={{ color: f.versions.at(-1)?.info?.low ? '#8A6F33' : '#666', fontSize: 13 }}>{infoWords(f.versions.at(-1))}</span>}
      {/* One CLP asked for (Request a File): what and why. */}
      {f.asked && f.status === 'missing' && <span style={{ color: '#8A6F33', fontSize: 13 }}>{`We asked for this file${f.note ? `: ${f.note}` : ''}`}</span>}
      {f.status === 'changes' && <span style={{ color: '#B03A2E', fontSize: 13 }}>{`${REASON[f.reason ?? 'other']}.`}{f.note ? ` ${f.note}` : ''}</span>}
      {f.status === 'client' && <FileApproval k={k} f={f} busy={busy} act={act} />}
      {f.status === 'declined' && f.reply && <span style={{ fontSize: 13 }}>You asked: “{f.reply.note}”. We’ll send you another version.</span>}
      {children}
      <FileHistory f={f} />
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
