'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { firstLoc, money, stockOf, tagOf, type WsItem } from '@/content/wholesale';
import type { Wholesale } from './wholesaleStore';
import WsMock from './WsMock';
import w from './wholesale.module.css';

const Heart = ({ on }: { on: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? '#B03A2E' : 'none'} stroke={on ? '#B03A2E' : '#111111'} strokeWidth="2" strokeLinejoin="round" aria-hidden>
    <path d="M12 21 3.5 12.7A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.7z" />
  </svg>
);

/**
 * A catalog item as the Wholesale board's card: its mockup in the item colour with the logo in use (unless mockups
 * are off), its tag (brand, CLP direct, distributor partner), name, minimum and decoration, stock, and its price
 * from. The heart saves it to a favorites folder. As a list row it ends with the price, the heart and Customize.
 */
export default function WholesaleCard({ item, href, ws, list = false }: { item: WsItem; href: string; ws: Wholesale; list?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [tag, direct] = tagOf(item);
  const [stock, dot] = stockOf(item);
  const fav = ws.isFav(item.id);
  const mock = <WsMock item={item} loc={firstLoc(item)} asset={ws.asset(ws.lg)} color={ws.ic} show={ws.mock} className={w.cardSvgFull} />;
  const heart = (
    <button type="button" className={list ? w.heartRow : w.heart} aria-label={`Save ${item.name} to favorites`} aria-pressed={fav} onClick={() => setSaving(true)}>
      <Heart on={fav} />
    </button>
  );
  const info = (
    <>
      <span className={w.cardInfo}>{`Min ${item.min} · ${item.deco[0]}`}</span>
      <span className={w.stock}>
        <span style={{ background: dot }} />
        {stock}
      </span>
    </>
  );
  const price = (
    <span className={w.price}>
      <strong>From {money(item.price)}</strong>
      <span>/ea</span>
    </span>
  );
  const modal = saving && <SaveModal item={item} ws={ws} onClose={() => setSaving(false)} />;
  if (list) {
    return (
      <div className={w.row}>
        <Link href={href} className={w.rowMock} aria-label={`Open ${item.name}`}>
          <span className={w.cardMockSm}>{mock}</span>
        </Link>
        <Link href={href} className={w.rowBody}>
          <span className={w.rowTag}>{tag}</span>
          <strong className={w.cardName}>{item.name}</strong>
          {info}
        </Link>
        <span className={w.rowEnd}>
          {price}
          {heart}
          <Link href={href} className={w.customize}>
            Customize
          </Link>
        </span>
        {modal}
      </div>
    );
  }
  return (
    <div className={w.cardWrap}>
      <Link href={href} className={w.card}>
        <span className={w.cardMock}>
          {mock}
          <span className={w.tag} data-direct={direct}>
            {tag}
          </span>
        </span>
        <span className={w.cardText}>
          <strong className={w.cardName}>{item.name}</strong>
          {info}
          {price}
        </span>
      </Link>
      {heart}
      {modal}
    </div>
  );
}

/** Save to favorites (the board's): tick the folders it goes in, or make a new folder for it. */
export function SaveModal({ item, ws, onClose }: { item: WsItem; ws: Wholesale; onClose: () => void }) {
  const [name, setName] = useState('');
  const mine = ws.favs[item.id] ?? [];
  const count = (fid: string) => Object.values(ws.favs).filter((f) => f.includes(fid)).length;
  const toggle = (fid: string) => ws.update((s) => ({ favs: { ...s.favs, [item.id]: (s.favs[item.id] ?? []).includes(fid) ? (s.favs[item.id] ?? []).filter((x) => x !== fid) : [...(s.favs[item.id] ?? []), fid] } }));
  const create = () => {
    const n = name.trim();
    if (!n) return;
    const id = `f${Date.now()}`;
    ws.update((s) => ({ folders: [...s.folders, { id, name: n.slice(0, 40) }], favs: { ...s.favs, [item.id]: [...(s.favs[item.id] ?? []), id] } }));
    setName('');
  };
  return createPortal(
    <div className={w.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={w.saveBox} role="dialog" aria-modal="true" aria-label="Save to favorites">
        <div className={w.saveHead}>
          <span>
            <strong>Save to favorites</strong>
            <span>{item.name}</span>
          </span>
          <button type="button" className={w.panelClose} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={w.folders}>
          {ws.folders.map((f) => {
            const on = mine.includes(f.id);
            return (
              <button key={f.id} type="button" className={w.folder} aria-pressed={on} onClick={() => toggle(f.id)}>
                <span className={w.folderBox}>{on ? '✓' : ''}</span>
                <span className={w.folderName}>{f.name}</span>
                <span className={w.folderN}>{count(f.id)} saved</span>
              </button>
            );
          })}
        </div>
        <div className={w.newFolder}>
          <input value={name} maxLength={40} aria-label="New folder name" placeholder="New folder, e.g. Fall tournament" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <button type="button" onClick={create}>
            + Create
          </button>
        </div>
        <button type="button" className={w.doneDark} onClick={onClose}>
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** The board's dark card at the end of the catalog: anything we don't list, made from scratch. */
export function CustomCard({ href, list = false }: { href: string; list?: boolean }) {
  return (
    <Link href={href} className={list ? w.customRow : w.customCard}>
      <span className={w.customText}>
        <span className={w.customKicker}>CAN’T FIND IT?</span>
        <span className={w.customTitle}>Tell us what you need</span>
        <span className={w.customLine}>Send a photo, how many and when. We’ll find it through our makers and suppliers.</span>
      </span>
      <span className={w.customBtn}>Start a request →</span>
    </Link>
  );
}
