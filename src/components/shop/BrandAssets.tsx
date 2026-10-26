'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { ASSET_STATUS, WS_COLORS, WS_KIT_OWNER, type WsAsset } from '@/content/wholesale';
import type { StudioBrand } from './useStudio';
import { uploadAsset, type Wholesale } from './wholesaleStore';
import { AssetMark } from './WsMock';
import w from './wholesale.module.css';

export const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';

export function AssetStatus({ status }: { status: WsAsset['status'] }) {
  const [label, fg, bg] = ASSET_STATUS[status];
  return (
    <span className={w.status} style={{ color: fg, background: bg }}>
      {label}
    </span>
  );
}

/** An asset to pick (the board's 52 px chip): its mark, name and status. */
export function AssetChip({ a, on, onPick }: { a: WsAsset; on: boolean; onPick: () => void }) {
  return (
    <button type="button" className={w.assetChip} aria-pressed={on} onClick={onPick}>
      <AssetMark a={a} />
      <span className={w.assetText}>
        <span>{a.name}</span>
        <AssetStatus status={a.status} />
      </span>
    </button>
  );
}

/**
 * Uploads a file as new art (waiting for approval) and uses it: a partner's goes to CLP's media, a guest's is kept in
 * this browser. `onAdded` gets the new asset (the item page puts it on the spot being designed).
 */
export function useUpload(studio: StudioBrand, ws: Wholesale, onAdded?: (a: WsAsset) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const a = await uploadAsset(file, await studio.upload(file));
      ws.addUpload(a);
      onAdded?.(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that file. Try a PNG, JPG or SVG.');
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy, error };
}

/**
 * The brand assets bar above the catalog (the board's): Mockup with the logo every card uses, four more to switch to,
 * all of them in a panel (search, filter, upload), the item colour and Show mockups.
 */
export function BrandAssetsBar({ studio, ws }: { studio: StudioBrand; ws: Wholesale }) {
  const [open, setOpen] = useState(false);
  const sel = ws.asset(ws.lg) ?? ws.assets[0];
  const quick = ws.assets.filter((a) => a.id !== ws.lg).slice(0, 4);
  return (
    <div className={w.kitWrap}>
      <div className={w.kitBar}>
        <span className={w.kitFor}>
          <span className={w.kicker}>MOCKUP WITH</span>
          <span>{studio.partner && studio.name ? studio.name : WS_KIT_OWNER}</span>
        </span>
        <button type="button" className={w.kitSel} aria-expanded={open} aria-label="Choose the logo for mockups" onClick={() => setOpen(!open)}>
          <AssetMark a={sel} />
          <span className={w.assetText}>
            <span>{sel?.name}</span>
            {sel && <AssetStatus status={sel.status} />}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <span className={w.quick}>
          {quick.map((a) => (
            <button key={a.id} type="button" className={w.quickBtn} aria-label={`Use ${a.name}`} title={a.name} onClick={() => ws.update({ lg: a.id, mock: true })}>
              <AssetMark a={a} />
            </button>
          ))}
          <button type="button" className={w.allBtn} onClick={() => setOpen(!open)}>
            All {ws.assets.length} assets
          </button>
        </span>
        <span className={w.kitRight}>
          <span className={w.colors}>
            <span className={w.colorsLabel}>Item color</span>
            {WS_COLORS.map(([c, name]) => (
              <button key={c} type="button" className={w.dot} aria-label={name} title={name} aria-pressed={ws.ic === c} style={{ background: c }} onClick={() => ws.update({ ic: c })} />
            ))}
          </span>
          <button type="button" className={w.toggle} aria-pressed={ws.mock} onClick={() => ws.update({ mock: !ws.mock })}>
            <span className={w.track}>
              <span />
            </span>
            Show Mockups
          </button>
        </span>
      </div>
      {open && (
        <AssetsPanel
          studio={studio}
          ws={ws}
          selected={ws.lg}
          onPick={(a) => {
            ws.update({ lg: a.id, mock: true });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** All brand assets (the board's panel): search, All / Approved / Needs approval, upload new art, pick one. */
export function AssetsPanel({ studio, ws, selected, onPick, onClose }: { studio: StudioBrand; ws: Wholesale; selected: string; onPick: (a: WsAsset) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'ok' | 'pending'>('all');
  const { upload, busy, error } = useUpload(studio, ws, onPick);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = ws.assets.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase()) && (filter === 'all' || (filter === 'ok') === (a.status === 'ok')));
  return (
    <div className={w.panel} role="dialog" aria-label="Brand assets">
      <div className={w.panelHead}>
        <span className={w.panelTitle}>
          <strong>Brand assets</strong>
          <span>
            {ws.assets.length} assets · {ws.assets.filter((a) => a.status === 'ok').length} approved
          </span>
        </span>
        <input className={w.panelSearch} type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search brand assets" placeholder="Search logos and art…" />
        <span className={w.pills}>
          {(
            [
              ['all', 'All'],
              ['ok', 'Approved'],
              ['pending', 'Needs approval'],
            ] as const
          ).map(([f, label]) => (
            <button key={f} type="button" className={w.pill} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {label}
            </button>
          ))}
        </span>
        <button type="button" className={w.panelClose} aria-label="Close brand assets" onClick={onClose}>
          ×
        </button>
      </div>
      <div className={w.assetGrid}>
        <button type="button" className={w.uploadTile} disabled={busy} onClick={() => fileRef.current?.click()}>
          <span className={w.plus}>+</span>
          {busy ? 'Adding…' : 'Upload Logo or Art'}
          <span className={w.uploadHint}>PNG, JPG, WebP or SVG</span>
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={upload} />
        {shown.map((a) => (
          <button key={a.id} type="button" className={w.assetCard} aria-pressed={a.id === selected} onClick={() => onPick(a)}>
            <span className={w.assetBig}>
              <AssetMark a={a} size={72} />
            </span>
            <span className={w.assetCardText}>
              <span>{a.name}</span>
              <AssetStatus status={a.status} />
            </span>
          </button>
        ))}
      </div>
      {shown.length === 0 && <span className={w.muted}>No assets match. Try another search or upload new art.</span>}
      {error && (
        <span className={w.error} role="alert">
          {error}
        </span>
      )}
      <span className={w.fine}>Approved assets are ready to order. New uploads get a quick check from our team, usually within 1 business day.</span>
    </div>
  );
}
