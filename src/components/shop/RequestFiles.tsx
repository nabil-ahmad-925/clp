'use client';

import { useState } from 'react';
import type { BulkRequest, FileKey, ProductionFile, RequestAction, RequestActionInput } from '@/content/bulk';
import CollapsibleBox from './CollapsibleBox';
import FileRow from './FileRow';
import FileServiceOffer from './FileServiceOffer';
import type { PhotoItem } from '@/content/wsDrawing';
import HaveClpDoIt from './HaveClpDoIt';
import LogoOnItem from './LogoOnItem';
import SendToDesigner from './SendToDesigner';
import st from './requestStage.module.css';

// Every open request (from the first ask): the files are what CLP checks, there's no separate artwork check.
const OPEN = ['art', 'changes', 'quote', 'maker', 'maker-in', 'quoted', 'deposit', 'proof', 'in-production'];
type Act = (action: RequestAction, input: RequestActionInput) => void;

/** Their choice: CLP may make technical fixes without asking. Design changes always come to them. */
function FixesChoice({ r, busy, act }: { r: BulkRequest; busy: string; act: Act }) {
  const on = Boolean(r.fileAuth?.technical);
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
      <input type="checkbox" checked={on} disabled={Boolean(busy)} onChange={() => act('authorize-fixes', { on: !on })} style={{ marginTop: 3 }} />
      <span>
        <b>Let CLP make technical fixes without asking me</b> (vectorizing, removing a background, improving resolution, making a stitch file). Changes to colors, proportions or the artwork always come to you to approve.
      </span>
    </label>
  );
}
/**
 * The order's production files on Quote Requests: the required ones its decoration needs (the logo, a placement
 * mockup, a stitch file and thread colors, ink colors, print-ready artwork, a roster…), then the optional extras. Each
 * is sent as a file (up to 350 KB), a link, or text. CLP checks each for production, makes technical fixes (with their
 * say-so, else they approve them) and sends any design change to them to approve. Every version stays in its history.
 * Closed by default: its header says where they stand (what's needed, what we're checking, what waits on them).
 */
export default function RequestFiles({ r, busy, act, defaultOpen = false, item, color = '#F4F4F2' }: { r: BulkRequest; busy: string; act: Act; defaultOpen?: boolean; item?: PhotoItem; color?: string }) {
  const [more, setMore] = useState(false);
  const all = Object.entries(r.files ?? {}) as [FileKey, ProductionFile][];
  if (!all.length || !OPEN.includes(r.status)) return null;
  const required = all.filter(([, f]) => f.required);
  const optional = all.filter(([, f]) => !f.required);
  const done = required.every(([, f]) => f.status === 'approved');
  // The summary on its (closed by default) header: where the required files stand, what waits on them.
  const count = (test: (f: ProductionFile) => boolean) => required.filter(([, f]) => test(f)).length;
  const needed = count((f) => f.status === 'missing' || f.status === 'changes');
  const checking = count((f) => f.status === 'review');
  const toApprove = all.filter(([, f]) => f.status === 'client').length;
  const summary = done
    ? 'All approved'
    : [`${count((f) => f.status === 'approved')} of ${required.length} approved`, needed ? `${needed} needed` : '', checking ? `${checking} we’re checking` : '', toApprove ? `${toApprove} to approve` : ''].filter(Boolean).join(' · ');
  return (
    <CollapsibleBox title="PRODUCTION FILES" summary={summary} on={toApprove > 0} defaultOpen={defaultOpen}>
      <span>
        {done ? 'All required files are approved. Thank you.' : 'We make your order from these. Send each one, we check it before your proof.'}
        {r.needsMethod ? ' We’ll confirm how it’s made, and the optional files marked “If we use…” may be needed then.' : ''}
      </span>
      {r.mockup && (
        <a href={r.mockup} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'inherit' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- their own mockup, as the studio made it. */}
          <img src={r.mockup} alt="Your design on the item" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #ebe8e1' }} />
          <span>Your design on the item. We check your files against it.</span>
        </a>
      )}
      <LogoOnItem r={r} item={item} color={color} />
      {!done && <FixesChoice r={r} busy={busy} act={act} />}
      <SendToDesigner r={r} busy={busy} act={act} />
      {required.map(([k, f]) => (
        <FileRow key={k} k={k} f={f} busy={busy} act={act}>
          <FileServiceOffer r={r} k={k} busy={busy} act={act} />
          <HaveClpDoIt r={r} k={k} f={f} busy={busy} act={act} />
        </FileRow>
      ))}
      {optional.length > 0 && (
        <button type="button" className={st.text} aria-expanded={more} onClick={() => setMore(!more)} style={{ justifySelf: 'start', padding: 0 }}>
          {more ? 'Hide optional files' : `Optional files (${optional.length})`}
        </button>
      )}
      {more &&
        optional.map(([k, f]) => (
          <FileRow key={k} k={k} f={f} busy={busy} act={act}>
            <FileServiceOffer r={r} k={k} busy={busy} act={act} />
          </FileRow>
        ))}
    </CollapsibleBox>
  );
}
