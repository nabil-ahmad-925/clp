'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FileKey, ProductionFile, RequestAction, RequestActionInput } from '@/content/bulk';
import { fetchUpload, sendUpload, type UploadFile, type UploadState } from '@/content/upload';
import FileRow from '@/components/shop/FileRow';
import s from '@/components/track/track.module.css';

const CLP_EMAIL = 'hello@competelikepros.com';
const WORDS: Record<UploadFile['status'], string> = { missing: 'Needed', review: 'We’re checking it', approved: 'Approved', changes: 'A new one needed', clp: 'We’re making it', optional: 'Optional', client: 'With the client', declined: 'With the client' };
/** A file of the link as the shop's file row takes it (it has no versions to show: those stay the client's). */
const asFile = (f: UploadFile): ProductionFile => ({ label: f.label, hint: f.hint, type: f.type, accept: f.accept, required: true, status: f.status, note: f.note, versions: [] });

/**
 * The upload link's page (no account): the item, the files still needed (each sent as a file up to 350 KB, a link, or
 * the text, with the same checks as Quote Requests), and the ones already in. CLP checks each before production.
 */
export default function UploadPage() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const key = params.get('k') ?? '';
  const [state, setState] = useState<UploadState | { status: 'loading' } | { status: 'error'; message: string }>({ status: 'loading' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  useEffect(() => {
    let live = true;
    fetchUpload(id, key).then(
      (next) => live && setState(next),
      (err: unknown) => live && setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the files.' }),
    );
    return () => {
      live = false;
    };
  }, [id, key]);
  const act = (k: FileKey) => async (action: RequestAction, input: RequestActionInput) => {
    if (action !== 'add-file') return;
    setBusy('add-file');
    setError('');
    try {
      const request = await sendUpload(id, key, { fileKey: k, name: input.name, data: input.data, link: input.link, text: input.text });
      setState({ status: 'ready', request });
      setSent(request.files.find((f) => f.key === k)?.label ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t go through. Please try again.');
    } finally {
      setBusy('');
    }
  };
  return (
    <div className={s.page} data-header-tone="dark">
      <div className={s.wrap}>
        <span className={s.kicker}>PRODUCTION FILES</span>
        <h1 className={s.title}>Send the Files</h1>
        {state.status === 'loading' && <p className={s.sub}>Loading the files…</p>}
        {state.status === 'invalid' && <p className={s.note}>This upload link doesn’t work any more. Ask whoever sent it for a new one, or contact us.</p>}
        {state.status === 'done' && <p className={s.note}>These files are all in. Thank you.</p>}
        {state.status === 'error' && <p className={s.note} role="alert">{state.message}</p>}
        {state.status === 'ready' && (
          <>
            <p className={s.sub}>{`${state.request.ref} · ${state.request.qty} × ${state.request.itemName}`}</p>
            {state.request.note && <p className={s.note}>{`Their note: “${state.request.note}”`}</p>}
            {sent && <p className={s.note}>{`Thank you. We got the ${sent.toLowerCase()} and check it before production.`}</p>}
            <div style={{ display: 'grid', gap: 4, padding: '4px 16px', border: '1px solid #ebe8e1', borderRadius: 12 }}>
              {state.request.files.filter((f) => f.open).map((f) => (
                <FileRow key={f.key} k={f.key as FileKey} f={asFile(f)} busy={busy} act={(a, i) => void act(f.key as FileKey)(a, i)} />
              ))}
              {!state.request.files.some((f) => f.open) && <p style={{ fontSize: 14 }}>Nothing left to send. Thank you.</p>}
            </div>
            {state.request.files.some((f) => !f.open) && (
              <p className={s.help}>{`Already in: ${state.request.files.filter((f) => !f.open).map((f) => `${f.label} (${WORDS[f.status].toLowerCase()})`).join(', ')}.`}</p>
            )}
            {error && (
              <p role="alert" style={{ color: '#B03A2E', fontSize: 14 }}>
                {error}
              </p>
            )}
          </>
        )}
        <p className={s.help}>
          Files over 350 KB? Paste a link to them (Google Drive, Dropbox, WeTransfer). Questions? Email <a href={`mailto:${CLP_EMAIL}`}>{CLP_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
