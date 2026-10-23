'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { createDesign, sendGuestQuote, uploadGuestImage, type BulkKind, type BulkRequest, type StudioDesign } from '@/content/bulk';
import { uploadImage } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import {
  APPAREL,
  LOCN,
  METALS,
  SHAPES,
  SIZED,
  SIZES,
  WS_COLORS,
  WS_ITEMS,
  amountOf,
  breaksOf,
  firstLoc,
  handlerOf,
  money,
  tierOf,
  type WsAsset,
  type WsItem,
} from '@/content/wholesale';
import { ACCEPT, AssetChip, useUpload } from './BrandAssets';
import { mockupPng } from './Mockup';
import WholesaleCard, { SaveModal } from './WholesaleCard';
import WholesaleStudio from './WholesaleStudio';
import WsMock from './WsMock';
import { imageDataUrl, type StudioBrand } from './useStudio';
import type { Wholesale } from './wholesaleStore';
import { DEFAULT_PLAYERS, designSummary, emptyDesign, locsOf, rosterOf, spotOf, spotSummary, usedLocs, type WsDesign } from './wsDesign';
import w from './wholesale.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TRACK = ['Submitted', 'Artwork check', 'Quote / proof', 'In production', 'Shipped'];

/**
 * An item's page (the Wholesale board's): its mockup with the print spots under it, the item's price breaks, then item
 * colour, artwork for each spot, quantities by size and notes for our designers, a guest's details, and a check of
 * what's ready before Place order (approved art, in stock) or Request a quote. Design now opens the full-screen studio.
 * Under it, items teams add and more like it. A request goes to CLP's Wholesale desk as a custom request carrying the
 * item, sizes, design and mockup (the catalog is the board's sample until the API has it).
 */
export default function WholesaleItem({ item, studio, ws, loc: shipTo, onSent, onShowRequests }: { item: WsItem; studio: StudioBrand; ws: Wholesale; loc: string; onSent: (r: BulkRequest) => void; onShowRequests: () => void }) {
  const partner = studio.partner;
  const sh = SHAPES[item.shape];
  const locs = locsOf(item);
  const [loc, setLoc] = useState(firstLoc(item));
  // A draft saved in the studio (this browser) comes back; else the logo in use on the first spot.
  const [draft] = useState<{ design?: WsDesign; rost?: string; color?: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(`clp-wholesale-draft-${item.id}`) ?? 'null');
    } catch {
      return null;
    }
  });
  const [design, setDesign] = useState<WsDesign>(() => draft?.design ?? emptyDesign(firstLoc(item), ws.lg));
  const [hist, setHist] = useState<WsDesign[]>([]);
  const [fut, setFut] = useState<WsDesign[]>([]);
  const [rost, setRost] = useState(draft?.rost ?? DEFAULT_PLAYERS);
  const [rIdx, setRIdx] = useState(0);
  const [metal, setMetal] = useState(sh.fixed && draft?.color ? draft.color : (sh.fixed ?? ''));
  const [studioOpen, setStudioOpen] = useState<false | string>(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState({ name: '', organization: '', email: '', inHands: '', deliverTo: shipTo });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<BulkKind | ''>('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ kind: BulkKind; ref: string } | null>(null);
  const mockRef = useRef<HTMLSpanElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** A change to the design, undoable in the studio. */
  const change = (patch: Partial<WsDesign>) => {
    setHist((h) => [...h, design].slice(-40));
    setFut([]);
    setDesign((d) => ({ ...d, ...patch }));
  };
  const undo = () => {
    if (!hist.length) return;
    setFut((f) => [...f, design]);
    setDesign(hist[hist.length - 1]);
    setHist((h) => h.slice(0, -1));
  };
  const redo = () => {
    if (!fut.length) return;
    setHist((h) => [...h, design]);
    setDesign(fut[fut.length - 1]);
    setFut((f) => f.slice(0, -1));
  };
  const { upload, busy: uploading, error: uploadError } = useUpload(studio, ws, (a) => change({ art: { ...design.art, [loc]: a.id } }));

  const color = sh.fixed ? metal : ws.ic;
  const players = rosterOf(rost);
  const player = players[Math.min(rIdx, Math.max(0, players.length - 1))] ?? { name: 'NAME', num: '00' };
  const sizes = SIZED.includes(item.shape) ? SIZES : ['Qty'];
  const total = sizes.reduce((n, z) => n + (Number(qty[z]) || 0), 0);
  const enough = total >= item.min;
  const over = item.stock === 'in' && total > item.avail;
  const used = usedLocs(item, design);
  const uniq = [...new Set(locs.map((l) => design.art[l]).filter(Boolean))].map((id) => ws.asset(id)).filter((a): a is WsAsset => Boolean(a));
  const pend = uniq.filter((a) => a.status !== 'ok');
  const amount = amountOf(item, total, Math.max(1, uniq.length));
  const tier = tierOf(item, total);
  const [stockDot, stockTxt] = item.back
    ? ['#B03A2E', `Back-ordered at the supplier · back about ${item.back} · min ${item.min}`]
    : item.stock === 'in'
      ? ['#1E7A45', `${item.avail} in stock · ships in ${item.lead} · min ${item.min}`]
      : ['#C9A44C', `Made to order · ${item.lead} · min ${item.min}`];
  const tagLine = item.src === 'brand' ? `${item.brand.toUpperCase()} · NAME BRAND` : item.src === 'direct' ? 'CLP DIRECT · MADE BY A MAKER PARTNER' : 'DISTRIBUTOR PARTNER · IN STOCK';
  const canOrder = partner && enough && !pend.length && uniq.length > 0 && item.stock === 'in' && !item.back && !over;
  const fav = ws.isFav(item.id);

  // The checks before sending, as the board's box shows them.
  const checks: [string, string, string, string][] = [];
  if (!uniq.length) checks.push(['!', '#999999', 'Choose artwork', 'Pick a logo from your brand assets or upload a file.']);
  else if (pend.length) checks.push(['!', '#B03A2E', `${pend.map((a) => a.name).join(', ')} needs approval`, 'New artwork gets a quick check from our team, usually within 1 business day. Send your quote request now and we check it with it.']);
  else checks.push(['✓', '#1E7A45', 'Artwork approved', `${uniq.map((a) => a.name).join(', ')} · ${uniq.length} ${uniq.length === 1 ? 'print spot' : 'print spots'}`]);
  checks.push(
    enough
      ? ['✓', '#1E7A45', `${total} pieces`, item.stock === 'in' ? (over ? `More than we have in stock (${item.avail}). We’ll quote the rest.` : `In stock · ships in ${item.lead}`) : `Made to order · ${item.lead}`]
      : ['!', '#999999', total ? `Add ${item.min - total} more` : 'Add quantities', `Minimum order is ${item.min} ${item.min === 1 ? 'piece' : 'pieces'}.`],
  );

  const send = async (kind: BulkKind) => {
    setError('');
    if (!enough) return setError(`Add at least ${item.min} pieces.`);
    if (!partner && (!contact.name.trim() || !EMAIL.test(contact.email.trim()))) return setError('Enter your name and a valid email for the quote.');
    setBusy(kind);
    try {
      // An uploaded logo goes with the request as a link (a guest's image is kept with their cart first).
      const imgs = uniq.filter((a) => a.kind === 'img' && a.src);
      let logo = '';
      for (const a of imgs) {
        const url = /^https:\/\//.test(a.src!) ? a.src! : await uploadGuestImage(await imageDataUrl(a.src!, 1500));
        if (!logo) logo = url;
      }
      let mockup = '';
      const svg = mockRef.current?.querySelector('svg');
      if (svg) {
        try {
          mockup = partner ? await uploadImage(await mockupPng(svg as SVGSVGElement)) : await uploadGuestImage(await imageDataUrl(await mockupPng(svg as SVGSVGElement, 800), 800));
        } catch {
          // The request goes without its picture.
        }
      }
      const sizeLine = sizes.filter((z) => Number(qty[z]) > 0).map((z) => (z === 'Qty' ? `${qty[z]}` : `${z} ${qty[z]}`)).join(' · ');
      const colorName = (sh.fixed ? METALS : WS_COLORS).find(([c]) => c === color)?.[1] ?? color;
      const brief = [
        `${item.name} (${item.brand}) · ${colorName} · ${total} pieces${sizeLine && sizes.length > 1 ? ` (${sizeLine})` : ''}`,
        `Design: ${designSummary(item, design, ws.asset, players.length) || 'no artwork yet'}`,
        Object.keys(design.ros).some((l) => design.ros[l]) ? `Names & numbers: ${players.map((p) => `${p.name} ${p.num}`).join(', ')}` : '',
        `${kind === 'order' ? 'Order' : 'Estimate'}: ${money(amount)} (${money(amount / total)}/ea, ${item.deco[0]})`,
        notes.trim() ? `Notes: ${notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const deliverTo = contact.deliverTo.trim();
      const input = {
        itemId: 'custom',
        kind,
        styles: [],
        qty: total,
        priorities: [],
        mode: 'design' as const,
        brief: brief.slice(0, 2000),
        // The API keeps a design as plain settings: here the item colour, the uploaded logo, the Wholesale item and its spots.
        design: { base: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#111111', logo, logoOn: Boolean(logo), wholesaleItem: item.id, spots: used } as unknown as StudioDesign,
        mockup,
        ...(partner
          ? deliverTo
            ? { contact: { name: '', organization: '', email: '', inHands: '', message: '', logoLink: '', deliverTo } }
            : {}
          : { contact: { ...contact, name: contact.name.trim(), email: contact.email.trim(), deliverTo, message: notes.trim(), logoLink: '' } }),
      };
      const r = partner ? await createDesign(input) : await sendGuestQuote(input);
      onSent(r);
      setDone({ kind, ref: r.ref ?? '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send it. Please try again.');
    } finally {
      setBusy('');
    }
  };

  // What the box's buttons do: a request's kind, or nothing yet (a disabled button).
  let primary: [string, BulkKind | null] = ['Request a quote', 'quote'];
  let secondary: [string, BulkKind] | null = null;
  let fine = `Quoted by ${handlerOf(item)} within 2 business days.`;
  if (!partner) {
    primary = [enough ? 'Request a quote' : `Add at least ${item.min} to request a quote`, enough ? 'quote' : null];
    fine = 'Anyone can request a quote. Partners get pricing, mockups and online ordering.';
  } else if (!uniq.length) {
    primary = ['Choose artwork to continue', null];
    secondary = ['Request a quote without art', 'quote'];
    fine = 'No logo yet? Our designers can make a proof from your notes.';
  } else if (!enough) primary = [`Add at least ${item.min} pieces`, null];
  else if (canOrder) {
    primary = [`Place order · ${money(amount)}`, 'order'];
    secondary = ['Request a quote instead', 'quote'];
    fine = 'We send a final proof before anything is made. Taxes and shipping on your invoice.';
  } else fine = `${item.stock === 'mto' ? 'Made to order. ' : pend.length ? 'New artwork is checked with your quote. ' : 'More than we have in stock. '}Quoted by ${handlerOf(item)} within 2 business days.`;

  const rel = WS_ITEMS.filter((x) => x.id !== item.id && x.cat === item.cat).slice(0, 4);
  const relWith = WS_ITEMS.filter((x) => x.id !== item.id && x.cat !== item.cat).slice(0, 4);
  const rows: [string, string, WsItem[], string, string][] = [
    ['Often ordered together', 'Teams that order this usually add these', relWith, 'Shop all', shopHref({ view: 'bulk' })],
    ['More like this', `Similar ${item.cat.toLowerCase()} from our brands and makers`, rel.length ? rel : WS_ITEMS.filter((x) => x.id !== item.id).slice(4, 8), `See all ${item.cat.toLowerCase()}`, shopHref({ view: 'bulk', wcat: item.cat })],
  ];
  const assetChips = [...ws.assets.filter((a) => a.id === design.art[loc]), ...ws.assets.filter((a) => a.id !== design.art[loc]).slice(0, design.art[loc] ? 1 : 2)];
  const summary = designSummary(item, design, ws.asset, players.length);

  return (
    <>
      <section className={w.itemWrap}>
        <nav className={w.crumbs} aria-label="Breadcrumb">
          <Link href={shopHref()}>Shop</Link>
          {'  ›  '}
          <Link href={shopHref({ view: 'bulk' })}>Wholesale</Link>
          {'  ›  '}
          <Link href={shopHref({ view: 'bulk', wcat: item.cat })}>{item.cat}</Link>
          {'  ›  '}
          <span>{item.name}</span>
        </nav>
        <div className={w.itemGrid}>
          <div className={w.itemLeft}>
            <span className={w.itemMock} ref={mockRef}>
              <WsMock item={item} loc={loc} asset={ws.asset(design.art[loc] ?? '')} color={color} design={spotOf(design, loc, player)} show={ws.mock} className={w.cardSvgFull} label={`${item.name}, ${LOCN[loc]}`} />
              <span className={w.spotTag}>{LOCN[loc]}</span>
              <button type="button" className={w.saveFav} aria-pressed={fav} onClick={() => setSaving(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? '#B03A2E' : 'none'} stroke={fav ? '#B03A2E' : '#111111'} strokeWidth="2" strokeLinejoin="round" aria-hidden>
                  <path d="M12 21 3.5 12.7A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.7z" />
                </svg>
                {fav ? 'Saved' : 'Save'}
              </button>
            </span>
            <div className={w.spots}>
              {locs.map((l) => {
                const s = spotSummary(design, l, ws.asset);
                return (
                  <button key={l} type="button" className={w.spot} aria-pressed={loc === l} onClick={() => setLoc(l)}>
                    <strong>{LOCN[l]}</strong>
                    <span data-has={s !== 'No artwork'}>{s}</span>
                  </button>
                );
              })}
            </div>
            <span className={w.muted}>Mockups are previews. You get a final proof before anything is made.</span>
          </div>

          <div className={w.itemRight}>
            <div className={w.itemHead}>
              <span className={w.kicker}>{tagLine}</span>
              <h1 className={w.itemName}>{item.name}</h1>
              <span className={w.stock}>
                <span style={{ background: stockDot }} />
                {stockTxt}
              </span>
              {item.back && (
                <div className={w.backBox}>
                  <span>Get an email the day it’s back in stock. You can still request a quote now and we’ll hold your spot in line.</span>
                </div>
              )}
              <span className={w.itemDesc}>{item.desc}</span>
              <div className={w.breaks}>
                {breaksOf(item).map(([q, f]) => (
                  <div key={q} data-on={tier === f && total > 0}>
                    <span>{q}+ pcs</span>
                    <strong>
                      {money(item.price * f)}
                      <span> /ea</span>
                    </strong>
                  </div>
                ))}
              </div>
              <span className={w.priceNote}>
                <span className={w.decoChip}>{item.deco[0]} included</span>
                {item.stock === 'in' ? 'Wholesale price per piece with one print spot. Each extra spot adds about 12%.' : 'Estimated wholesale price per piece. Your quote confirms it.'} Yours to use however you like: hand out, give away or resell.
              </span>
            </div>

            <div className={w.step}>
              <span className={w.stepHead}>
                <span className={w.stepN}>1</span>
                <strong>Item color</strong>
              </span>
              <div className={w.colorChips}>
                {(sh.fixed ? METALS : WS_COLORS).map(([c, name]) => (
                  <button key={c} type="button" className={w.colorChip} aria-pressed={color === c} onClick={() => (sh.fixed ? setMetal(c) : ws.update({ ic: c }))}>
                    <span style={{ background: c }} />
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className={w.step}>
              <span className={w.stepHead}>
                <span className={w.stepN}>2</span>
                <strong>Artwork</strong>
              </span>
              <span className={w.stepNote}>
                Pick artwork for <strong>{LOCN[loc]}</strong>.{locs.length > 1 ? ' Switch spots under the mockup.' : ''}
              </span>
              <div className={w.artRow}>
                <button type="button" className={w.noneBtn} aria-pressed={!design.art[loc]} onClick={() => change({ art: { ...design.art, [loc]: '' } })}>
                  None
                </button>
                {assetChips.map((a) => (
                  <AssetChip key={a.id} a={a} on={design.art[loc] === a.id} onPick={() => change({ art: { ...design.art, [loc]: a.id } })} />
                ))}
                <button type="button" className={w.moreBtn} onClick={() => setStudioOpen('brand')}>
                  All {ws.assets.length} assets →
                </button>
                <button type="button" className={w.addBtn} aria-label="Upload a file" title="Upload a file" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? '…' : '+'}
                </button>
                <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={upload} />
              </div>
              {uploadError && (
                <span className={w.error} role="alert">
                  {uploadError}
                </span>
              )}
              <div className={w.studioBox}>
                <span>
                  <strong>Want to design fully?</strong>
                  <span>{summary || 'Move, resize and rotate your logo, and add text, on each print spot.'}</span>
                </span>
                <button type="button" className={w.darkBtn} onClick={() => setStudioOpen('edit')}>
                  Design now
                </button>
              </div>
            </div>

            <div className={w.step}>
              <span className={w.stepHead}>
                <span className={w.stepN}>3</span>
                <strong>Quantity</strong>
              </span>
              <div className={w.qtyGrid} style={{ gridTemplateColumns: `repeat(${sizes.length > 1 ? sizes.length : 5}, minmax(0, 1fr))` }}>
                {sizes.map((z) => (
                  <label key={z} className={w.qtyCell}>
                    <span>{z}</span>
                    <input type="text" inputMode="numeric" value={qty[z] ?? ''} placeholder="0" aria-label={`Quantity ${z}`} onChange={(e) => setQty({ ...qty, [z]: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
                  </label>
                ))}
              </div>
              <span className={w.qtyFoot}>
                <span data-short={total > 0 && !enough}>
                  {total && !enough ? `Minimum ${item.min} pieces` : over ? 'Over stock: we’ll quote the extra' : `Minimum ${item.min} ${item.min === 1 ? 'piece' : 'pieces'}${sizes.length > 1 ? ' · mix sizes freely' : ''}`}
                </span>
                <strong>
                  {total} {total === 1 ? 'piece' : 'pieces'}
                  {total ? ` · ${money(amount)}` : ''}
                </strong>
              </span>
            </div>

            <div className={w.step}>
              <span className={w.stepHead}>
                <span className={w.stepN}>4</span>
                <strong>Notes for our designers</strong>
              </span>
              <textarea className={w.textarea} rows={3} maxLength={1500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Placement details, names and numbers, deadline, event date…" />
              {partner && (
                <label className={w.field}>
                  Deliver to
                  <input value={contact.deliverTo} maxLength={160} autoComplete="address-level2" onChange={(e) => setContact({ ...contact, deliverTo: e.target.value })} placeholder="City or ZIP" />
                </label>
              )}
            </div>

            {!partner && (
              <div className={w.step}>
                <span className={w.stepHead}>
                  <span className={w.stepN}>5</span>
                  <strong>Your details</strong>
                </span>
                <div className={w.fields}>
                  <label className={w.field}>
                    Name
                    <input value={contact.name} maxLength={120} autoComplete="name" onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Your name" />
                  </label>
                  <label className={w.field}>
                    Email
                    <input type="email" value={contact.email} maxLength={200} autoComplete="email" onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" />
                  </label>
                  <label className={w.field}>
                    Team, school or company
                    <input value={contact.organization} maxLength={120} autoComplete="organization" onChange={(e) => setContact({ ...contact, organization: e.target.value })} />
                  </label>
                  <label className={w.field}>
                    In-hands date
                    <input type="date" value={contact.inHands} onChange={(e) => setContact({ ...contact, inHands: e.target.value })} />
                  </label>
                  <label className={`${w.field} ${w.fieldWide}`}>
                    Deliver to
                    <input value={contact.deliverTo} maxLength={160} autoComplete="address-level2" onChange={(e) => setContact({ ...contact, deliverTo: e.target.value })} placeholder="City or ZIP" />
                  </label>
                </div>
              </div>
            )}

            {done ? (
              <div className={w.done}>
                <span className={w.doneHead}>
                  <span className={w.doneMark}>✓</span>
                  <span>
                    <strong>{done.kind === 'order' ? 'Order placed' : 'Quote requested'}</strong>
                    <span>{[done.ref, `${total} pieces`, item.name].filter(Boolean).join(' · ')}</span>
                  </span>
                </span>
                <span className={w.doneText}>
                  {done.kind === 'order' ? 'We’ll send a final proof before production.' : `You’ll get a quote from ${handlerOf(item)} within 2 business days. Track it in Quote Requests.`}
                </span>
                <span className={w.doneSteps}>
                  {TRACK.map((label, i) => (
                    <span key={label} data-on={i <= (done.kind === 'order' ? 3 : 2)}>
                      <i />
                      {label}
                    </span>
                  ))}
                </span>
                <span className={w.doneBtns}>
                  <button type="button" className={w.goldBtn} onClick={onShowRequests}>
                    View quote requests
                  </button>
                  <Link href={shopHref({ view: 'bulk' })} className={w.ghostBtn}>
                    Keep browsing
                  </Link>
                </span>
              </div>
            ) : (
              <div className={w.action}>
                {checks.map(([i, bg, t, d]) => (
                  <span key={t} className={w.check}>
                    <span style={{ background: bg }}>{i}</span>
                    <span>
                      <strong>{t}</strong>
                      <span>{d}</span>
                    </span>
                  </span>
                ))}
                {error && (
                  <span className={w.error} role="alert">
                    {error}
                  </span>
                )}
                <span className={w.actionBtns}>
                  <button type="button" className={w.primary} disabled={Boolean(busy) || !primary[1]} onClick={() => primary[1] && send(primary[1])}>
                    {busy ? 'Sending…' : primary[0]}
                  </button>
                  {secondary && (
                    <button type="button" className={w.secondary} disabled={Boolean(busy)} onClick={() => secondary && send(secondary[1])}>
                      {secondary[0]}
                    </button>
                  )}
                </span>
                <span className={w.fine}>{fine}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={w.related}>
        {rows.map(([title, sub, list, allLabel, allHref]) => (
          <div key={title} className={w.relRow}>
            <div className={w.relHead}>
              <span>
                <strong>{title}</strong>
                <span>{sub}</span>
              </span>
              <Link href={allHref}>{allLabel}</Link>
            </div>
            <div className={w.relGrid}>
              {list.map((it) => (
                <WholesaleCard key={it.id} item={it} href={shopHref({ view: 'bulk', item: it.id })} ws={ws} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {saving && <SaveModal item={item} ws={ws} onClose={() => setSaving(false)} />}
      {studioOpen && (
        <WholesaleStudio
          item={item}
          studio={studio}
          ws={ws}
          tool0={studioOpen}
          loc={loc}
          setLoc={setLoc}
          design={design}
          change={change}
          undo={hist.length ? undo : null}
          redo={fut.length ? redo : null}
          color={color}
          setColor={(c) => (sh.fixed ? setMetal(c) : ws.update({ ic: c }))}
          rost={rost}
          setRost={(t) => {
            setRost(t);
            setRIdx(0);
          }}
          rIdx={rIdx}
          setRIdx={setRIdx}
          apparel={APPAREL.includes(item.shape)}
          onFillQty={(n) => setQty({ ...qty, [sizes.includes('M') ? 'M' : 'Qty']: String(n) })}
          onClose={() => setStudioOpen(false)}
        />
      )}
    </>
  );
}
