'use client';
/* eslint-disable @next/next/no-img-element -- CLP's own photos of a catalog item (admin uploads), shown as they are. */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { backDay, colorsOf, money, type WsItem } from '@/content/wholesale';
import s from './specSheet.module.css';

/** The sheet's stock line: the item's total (not one color's), back-order date or made to order. */
const stockText = (item: WsItem) =>
  item.back ? `Back-ordered · back about ${backDay(item.back)}` : item.stock === 'in' ? `${item.avail.toLocaleString('en-US')} in stock · ships in ${item.lead}` : `Made to order · ${item.lead}`;

/** The photos on an item's spec sheet: the ones CLP picked, else its first photo. */
export const specPhotosOf = (item: WsItem) => (item.specPhotos?.length ? item.specPhotos : item.photos.slice(0, 1));

/**
 * "Spec Sheet" on an item's page: a one-page sheet (the photos CLP picked for it, colors, sizes, decoration, minimum,
 * lead time, stock and the starting price) to read or print. Printing shows only the sheet.
 */
export default function SpecSheet({ item }: { item: WsItem }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);
  const colors = (
    <span className={s.swatches}>
      {colorsOf(item).map(([hex, name]) => (
        <span key={hex}>
          <i style={{ background: hex }} aria-hidden />
          {name.startsWith('#') ? hex.toUpperCase() : name}
        </span>
      ))}
    </span>
  );
  const rows: [string, React.ReactNode][] = [
    ['Category', item.cat],
    ...(item.brand ? ([['Brand', item.brand]] as [string, string][]) : []),
    ['Colors', colors],
    ['Sizes', item.sizes.length ? item.sizes.join(', ') : 'One size'],
    ['Decoration', item.deco.join(', ') || 'Ask us'],
    ['Minimum order', `${item.min} ${item.min === 1 ? 'piece' : 'pieces'}`],
    ['Stock', stockText(item)],
    ['From', `${money(item.price)} per piece with one print spot`],
  ];
  return (
    <>
      <button type="button" className={s.open} onClick={() => setOpen(true)}>
        Spec Sheet
      </button>
      {open &&
        createPortal(
          <div className={s.root} role="dialog" aria-modal="true" aria-label={`${item.name} spec sheet`} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <article className={s.sheet}>
              <div className={`${s.bar} ${s.noPrint}`}>
                <button type="button" onClick={() => window.print()}>
                  Print or Save PDF
                </button>
                <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                  ✕
                </button>
              </div>
              <span className={s.kicker}>CLP WHOLESALE · SPEC SHEET</span>
              <h2 className={s.title}>{item.name}</h2>
              {item.desc && <p className={s.desc}>{item.desc}</p>}
              {specPhotosOf(item).length > 0 && (
                <div className={s.photos}>
                  {specPhotosOf(item).map((src, i) => (
                    <img key={src} src={src} alt={`${item.name}, spec photo ${i + 1}`} />
                  ))}
                </div>
              )}
              <dl className={s.rows}>
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>,
          document.body,
        )}
    </>
  );
}
