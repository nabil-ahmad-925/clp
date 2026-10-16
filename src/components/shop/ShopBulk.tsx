'use client';
/* eslint-disable @next/next/no-img-element -- the partner's own logo (their upload), shown as it is. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import BecomePartner from '@/components/partners/BecomePartner';
import {
  BULK_CATEGORIES,
  BULK_ITEMS,
  CUSTOM_ITEM,
  DECORATIONS,
  PRIORITIES,
  bulkItem,
  categoryOf,
  createDesign,
  deleteDesign,
  guestRequests,
  isApparel,
  leadWeeks,
  myDesigns,
  sendGuestQuote,
  type BulkItem,
  type BulkKind,
  type BulkRequest,
} from '@/content/bulk';
import { partnerSignOut, uploadImage } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import Mockup, { mockupPng, saveFile } from './Mockup';
import PartnerSignIn from './PartnerSignIn';
import { Chevron, LockIcon, SearchIcon } from './shopIcons';
import { useStudio, type StudioBrand } from './useStudio';
import b from './bulk.module.css';
import s from './shop.module.css';

/** The bulk tiles' colours for a partner without brand colours, and a guest's preview colour. */
const DEFAULT_SWATCHES = ['#111111', '#FFFFFF', '#0B2A5B', '#7A1F2B', '#1D6363', '#C8102E', '#2E7D32', '#DCBD7D'];
const GUEST_FILL = '#1F2A44';

const FILTERS = {
  src: { label: 'Availability', options: [['clp', 'Made to order'], ['stock', 'In stock · ships faster']] },
  deco: { label: 'Decoration', options: DECORATIONS.map((d) => [d.id, d.label]) },
  lead: { label: 'Lead time', options: [['fast', '2 weeks or less'], ['mid', '3–4 weeks'], ['long', '5+ weeks']] },
  min: { label: 'Minimum', options: [['one', 'Single units'], ['small', '24 or less'], ['mid', '100 or less']] },
} as const;
type FilterKey = keyof typeof FILTERS;
type Filters = Record<FilterKey, string>;
const NO_FILTERS: Filters = { src: '', deco: '', lead: '', min: '' };

const matches = (it: BulkItem, f: Filters, cat: string, q: string) => {
  if (cat && it.category !== cat) return false;
  if (f.src === 'clp' && it.stock) return false;
  if (f.src === 'stock' && !it.stock) return false;
  if (f.deco && !it.decoration.some((d) => d.toLowerCase().includes(f.deco))) return false;
  const wk = leadWeeks(it.lead);
  if (f.lead === 'fast' && wk > 2) return false;
  if (f.lead === 'mid' && (wk <= 2 || wk > 4)) return false;
  if (f.lead === 'long' && wk <= 4) return false;
  if (f.min === 'one' && it.min !== 1) return false;
  if (f.min === 'small' && it.min > 24) return false;
  if (f.min === 'mid' && it.min > 100) return false;
  if (q && !`${it.name} ${it.description} ${it.material} ${categoryOf(it.category)?.label ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
  return true;
};

const KIND_LABEL: Record<BulkKind, string> = { saved: 'Saved ✓', quote: 'Quote requested ✓', order: 'Ordered ✓' };
const STATUS: Record<string, [string, string, string]> = {
  saved: ['Saved design', '#F0EEE9', '#444444'],
  quote: ['Quote requested', '#E6F2E9', '#1E5B33'],
  order: ['Ordered', '#FBF0D6', '#7A5A12'],
  quoted: ['Quote sent', '#E6F2E9', '#1E5B33'],
  'in-production': ['In production', '#FBF0D6', '#7A5A12'],
  shipped: ['Shipped', '#E6EEF8', '#1B4F8C'],
  closed: ['Closed', '#F0EEE9', '#666666'],
};
const statusOf = (r: BulkRequest) => STATUS[r.kind === 'saved' ? 'saved' : r.status !== 'new' ? r.status : r.kind] ?? STATUS.quote;

/** The partner's or guest's requests (saved designs, quotes, orders), loaded again when they sign in or out. */
function useRequests(partner: boolean, ready: boolean) {
  const [items, setItems] = useState<BulkRequest[]>([]);
  const reload = useCallback(() => {
    (partner ? myDesigns() : guestRequests()).then(setItems, () => setItems([]));
  }, [partner]);
  useEffect(() => {
    if (ready) reload();
  }, [ready, reload]);
  return { items, setItems, reload };
}

/**
 * Bulk & Operations (/shop/?view=bulk, the Shop design): team kits, staff gear, event supplies, inflatables, awards and
 * promo, made to order and quoted direct from manufacturing. A signed-in CLP partner sees every item in their brand
 * (logo and colours), designs it in the studio, saves designs and asks for a quote or orders at partner pricing; a guest
 * requests a quote. "My designs" / "My quote requests" lists what they sent.
 */
export default function ShopBulk() {
  const params = useSearchParams();
  const router = useRouter();
  const studio = useStudio();
  const { partner } = studio;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(params.get('cat') ?? '');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [open, setOpen] = useState<string | null>(null);
  const [reqsOpen, setReqsOpen] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const reqs = useRequests(partner, !studio.loading);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const items = BULK_ITEMS.filter((it) => matches(it, filters, cat, q));
  const any = Boolean(q || cat || Object.values(filters).some(Boolean));
  const clear = () => {
    setQ('');
    setCat('');
    setFilters(NO_FILTERS);
  };
  const latest = (id: string) => reqs.items.find((r) => r.itemId === id);
  const swatches = studio.kit.locked && studio.kit.colors.length ? studio.kit.colors : studio.kit.colors.length ? [...new Set([...studio.kit.colors, ...DEFAULT_SWATCHES])].slice(0, 8) : DEFAULT_SWATCHES;

  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      studio.setLogo(await studio.upload(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload your logo.');
    } finally {
      setUploading(false);
    }
  };
  const openItem = (it: BulkItem) => (partner && it.id !== 'custom' ? router.push(shopHref({ view: 'studio', item: it.id })) : setOpen(it.id));
  const reqTitle = partner ? 'My designs' : 'My quote requests';

  return (
    <div className={b.bulk}>
      <section className={b.hero}>
        <div className={b.heroInner}>
          <div className={b.heroTop}>
            <nav className={s.crumbs} aria-label="Breadcrumb">
              <Link href={shopHref()}>Shop</Link>
              {'  ›  '}Bulk &amp; Operations
            </nav>
            <span className={b.who}>
              {partner ? `SIGNED IN AS · ${studio.name || 'PARTNER'}` : 'CLP PARTNER?'}
              <span className={b.whoPill}>
                {partner ? (
                  <button type="button" onClick={() => partnerSignOut()}>
                    Sign out
                  </button>
                ) : (
                  <button type="button" className={b.whoOn} onClick={() => setSignIn(true)}>
                    Partner sign in
                  </button>
                )}
              </span>
            </span>
          </div>
          <div className={s.headCenter}>
            <span className={s.kicker}>BULK &amp; OPERATIONS</span>
            <h1 className={b.heroTitle}>Outfit your team, staff or event</h1>
            <p className={b.heroText}>
              {partner
                ? 'Design team kits, staff gear, event supplies and more in the CLP studio, then save, buy at partner pricing or get a quote.'
                : 'Team kits, staff gear, event supplies, inflatables and promo, made direct from our factories and shipped in bulk. Request a quote on anything.'}
            </p>
          </div>
        </div>
      </section>

      <section className={b.wrap}>
        <form className={s.search} role="search" onSubmit={(e) => e.preventDefault()}>
          <input className={s.searchInput} type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bulk items" placeholder="Search jerseys, socks, tents, medals…" />
          <span className={s.searchRule} aria-hidden />
          <span className={s.searchSelect}>
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {BULK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <Chevron className={s.chevron} color="#666666" />
          </span>
          <button type="submit" className={s.searchBtn} aria-label="Search">
            <SearchIcon />
          </button>
        </form>

        <div className={b.toolbar}>
          <div className={b.filters}>
            {(Object.keys(FILTERS) as FilterKey[]).map((key) => {
              const on = Boolean(filters[key]);
              return (
                <span key={key} className={b.pillSelect}>
                  <select className={on ? b.pillOn : undefined} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} aria-label={FILTERS[key].label}>
                    <option value="">{FILTERS[key].label}</option>
                    {FILTERS[key].options.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <Chevron className={b.pillChevron} color={on ? '#FFFFFF' : '#666666'} />
                </span>
              );
            })}
            {any && (
              <button type="button" className={b.clear} onClick={clear}>
                Clear
              </button>
            )}
          </div>
          <div className={b.toolbarEnd}>
            <span className={s.count}>
              <strong>{items.length}</strong> items
            </span>
            <button type="button" className={b.reqBtn} onClick={() => setReqsOpen(true)}>
              {reqTitle}
              <span>{reqs.items.length}</span>
            </button>
          </div>
        </div>

        {partner ? (
          <div className={b.kit}>
            <span className={b.kitLabel}>YOUR BRAND KIT</span>
            <span className={b.kitFor}>
              For <strong>{studio.name || 'your team'}</strong>
            </span>
            {studio.kit.locked && (
              <span className={b.locked}>
                <LockIcon size={14} stroke="currentColor" />
                Guidelines on
              </span>
            )}
            <span className={b.kitLogo}>
              <span className={b.logoBox} style={{ background: studio.logo ? studio.color : '#FBFAF7' }}>
                {studio.logo ? <img src={studio.logo} alt="Your logo" /> : <span>LOGO</span>}
              </span>
              {!studio.kit.locked && (
                <>
                  <button type="button" className={b.logoBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? 'Uploading…' : studio.logo ? 'Change logo' : 'Upload logo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onLogo} />
                </>
              )}
              {studio.kit.logos.length > 1 && (
                <select className={b.kitSelect} value={studio.logo} onChange={(e) => studio.setLogo(e.target.value)} aria-label="Brand logo">
                  {studio.kit.logos.map((l) => (
                    <option key={l.src} value={l.src}>
                      {l.label}
                    </option>
                  ))}
                </select>
              )}
            </span>
            <span className={b.kitRule} />
            <span className={b.kitSwatches}>
              {swatches.map((c) => (
                <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={studio.color === c} className={b.kitSwatch} style={{ background: c, boxShadow: studio.color === c ? '0 0 0 2px #111111' : undefined }} onClick={() => studio.setColor(c)} />
              ))}
            </span>
            <span className={b.kitNote}>{uploadError || 'Every item previews with your brand. Open one to design it in the studio.'}</span>
          </div>
        ) : (
          <div className={b.guestBar}>
            <span className={b.kitLabel}>CLP PARTNERS</span>
            <span>Mockups, saved designs and the design studio are for approved CLP partners. Anyone can request a quote.</span>
            <BecomePartner className={b.guestLink}>Apply to become a partner →</BecomePartner>
          </div>
        )}
      </section>

      <section className={b.gridWrap}>
        <div className={b.grid}>
          {!any && (
            <button type="button" className={b.item} onClick={() => setOpen('custom')}>
              <span className={b.custom}>
                <span className={b.customPlus}>+</span>
                <span className={b.customKicker}>DIRECT FROM MANUFACTURING</span>
                <span className={b.customTitle}>Design something new</span>
                <span className={b.customText}>Custom patterns, colors, materials and shapes. Our designers and factories make it from scratch.</span>
              </span>
              <span className={b.itemCat}>FULLY CUSTOM</span>
              <strong className={b.itemName}>Bring us your idea</strong>
              <span className={b.itemMeta}>{partner ? 'Free design concepts for partners' : 'Quoted by our team · partners get concepts'}</span>
              <span className={b.customFoot}>
                <span className={b.customCta}>{partner ? 'Start a design' : 'Request a quote'}</span>
              </span>
            </button>
          )}
          {items.map((it) => {
            const req = latest(it.id);
            return (
              <div key={it.id} className={b.item}>
                <button type="button" className={b.tile} aria-label={it.name} onClick={() => openItem(it)}>
                  <Mockup shape={it.shape} base={partner ? studio.color : GUEST_FILL} logo={partner ? studio.logo : undefined} placeholder={partner} place="front" className={b.tileSvg} />
                  {it.badge && <span className={b.badge}>{it.badge}</span>}
                  {req && <span className={b.onLabel}>{KIND_LABEL[req.kind]}</span>}
                </button>
                <span className={b.itemCat}>{categoryOf(it.category)?.label.toUpperCase()}</span>
                <strong className={b.itemName}>{it.name}</strong>
                {it.stock && (
                  <span className={b.stock}>
                    <span />
                    In stock · ready to decorate
                  </span>
                )}
                <span className={b.itemMeta}>
                  <span>{it.styles.length} styles</span>
                  <span className={b.metaRule} />
                  <span>
                    Min {it.min} {it.unit}
                  </span>
                  <span className={b.metaRule} />
                  <span>{it.lead}</span>
                </span>
                <button type="button" className={b.itemBtn} onClick={() => openItem(it)}>
                  {partner ? 'Mock It Up' : 'Request a quote'}
                </button>
              </div>
            );
          })}
        </div>
        {items.length === 0 && (
          <div className={b.empty}>
            No items match those filters.
            <button type="button" onClick={clear}>
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className={b.howWrap}>
        <div className={b.how}>
          <div className={b.howHead}>
            <div className={b.howTitleWrap}>
              <span className={s.kicker}>HOW IT WORKS</span>
              <span className={b.howTitle}>{partner ? 'Design to doorstep' : 'Request, quote, deliver'}</span>
            </div>
            <span className={b.howText}>Every order is quoted direct from manufacturing, with options from value to premium so you get the best fit.</span>
          </div>
          <div className={b.steps}>
            {(partner
              ? [
                  ['01', 'Mock it up', 'Design on CLP-made items and in-stock blanks.'],
                  ['02', 'Approve your proof', 'Save, share with your team and sign off.'],
                  ['03', 'We produce it', 'Our team handles sourcing and production.'],
                  ['04', 'Shipped & tracked', 'Tracking and status sync back to your account.'],
                ]
              : [
                  ['01', 'Pick items & styles', 'Choose what you need and how many.'],
                  ['02', 'Send a quote request', 'Tell us your idea, date and a link to your logo.'],
                  ['03', 'Get a custom quote', 'Direct from manufacturing, with 2–3 options to compare.'],
                  ['04', 'Made & shipped in bulk', 'With a proof to approve before production.'],
                ]
            ).map(([n, t, d]) => (
              <div key={n} className={b.step}>
                <span className={b.stepN}>{n}</span>
                <strong>{t}</strong>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {open && (
        <BulkDialog
          key={open}
          item={bulkItem(open) ?? CUSTOM_ITEM}
          studio={studio}
          onClose={() => setOpen(null)}
          onSent={(r) => reqs.setItems((list) => [r, ...list.filter((x) => x.id !== r.id)])}
          onShowRequests={() => {
            setOpen(null);
            setReqsOpen(true);
          }}
          onSignIn={() => setSignIn(true)}
          swatches={swatches}
        />
      )}
      {reqsOpen && (
        <Requests
          title={reqTitle}
          partner={partner}
          items={reqs.items}
          onClose={() => setReqsOpen(false)}
          onOpen={(r) => router.push(shopHref({ view: 'studio', item: r.itemId, design: r.id }))}
          onRemove={async (r) => {
            await deleteDesign(r.id);
            reqs.setItems((list) => list.filter((x) => x.id !== r.id));
          }}
        />
      )}
      {signIn && <PartnerSignIn onClose={() => setSignIn(false)} />}
    </div>
  );
}

/* ---------------------------------------------------------------- an item */

/** The design's item popup: the mockup (partners design it; guests see it), the styles, then save, quote or buy. */
function BulkDialog({
  item,
  studio,
  swatches,
  onClose,
  onSent,
  onShowRequests,
  onSignIn,
}: {
  item: BulkItem;
  studio: StudioBrand;
  swatches: string[];
  onClose: () => void;
  onSent: (r: BulkRequest) => void;
  onShowRequests: () => void;
  onSignIn: () => void;
}) {
  const partner = studio.partner;
  const custom = item.id === 'custom';
  const [styles, setStyles] = useState<Record<number, string>>(() => (item.styles.length ? { 0: String(item.styles[0].min) } : ({} as Record<number, string>)));
  const [qty, setQty] = useState(String(item.min));
  const [mode, setMode] = useState<'logo' | 'design'>(custom ? 'design' : 'logo');
  const [brief, setBrief] = useState('');
  const [place, setPlace] = useState('front');
  const [text, setText] = useState('');
  const [prio, setPrio] = useState<string[]>([]);
  const [contact, setContact] = useState({ name: '', organization: '', email: '', inHands: '', message: '', logoLink: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState<BulkKind | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const svgWrap = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const chosen = Object.entries(styles).map(([i, q]) => ({ name: item.styles[Number(i)].name, qty: Number(q) || 0 }));
  const total = item.styles.length ? chosen.reduce((n, x) => n + x.qty, 0) : Number(qty) || 0;
  const styleSum = item.styles.length ? (chosen.length ? `${chosen.length} ${chosen.length === 1 ? 'style' : 'styles'} · ${total} total` : 'Select at least one style') : `${total} ${item.unit}`;
  const step = (n: number) => (item.styles.length ? n + 1 : n);
  const toggleStyle = (i: number) => {
    const next = { ...styles };
    if (next[i] !== undefined) delete next[i];
    else next[i] = String(item.styles[i].min);
    setStyles(next);
  };
  const svg = () => svgWrap.current?.querySelector('svg') as SVGSVGElement | null;

  const send = async (kind: BulkKind) => {
    setError('');
    if (item.styles.length && !chosen.length && kind !== 'saved') return setError('Select at least one style.');
    if (!partner) {
      if (!contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) return setError('Enter your name and a valid email.');
    }
    setBusy(kind);
    try {
      let mockup = '';
      if (partner && kind !== 'saved' && svg()) {
        try {
          mockup = await uploadImage(await mockupPng(svg()!));
        } catch {
          // The request goes without its picture.
        }
      }
      const input = {
        itemId: item.id,
        kind,
        styles: chosen,
        qty: total || item.min,
        priorities: prio,
        ...(partner
          ? { mode, brief, design: { base: studio.color, accent: '#DCBD7D', pattern: 'none', trim: false, logoOn: true, logo: studio.logo, place: isApparel(item.shape) && place === 'chest' ? 'chest' : 'center', logoScale: 1, dx: 0, dy: 0, text, font: 'mont', textColor: '', textPlace: 'below', textScale: 1, playerName: 'PLAYER', playerNumber: '10', numberColor: '', numberFont: 'college', locations: [], style: 0 }, mockup }
          : { contact: { ...contact, name: contact.name.trim(), email: contact.email.trim() } }),
      };
      const r = partner ? await createDesign(input) : await sendGuestQuote(input);
      onSent(r);
      if (kind === 'saved') setSaved(true);
      else setDone(kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send it. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const download = async () => {
    const el = svg();
    if (!el) return;
    saveFile(await mockupPng(el), `${item.id}-mockup.png`);
    setDownloaded(true);
  };
  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('logo');
    try {
      studio.setLogo(await studio.upload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload your logo.');
    } finally {
      setBusy('');
    }
  };

  const mock = (
    <div ref={svgWrap} className={b.dialogMock}>
      <Mockup
        shape={item.shape}
        base={partner ? studio.color : GUEST_FILL}
        logo={partner ? studio.logo : undefined}
        placeholder={partner}
        place={isApparel(item.shape) ? place : 'center'}
        text={partner ? text : ''}
        className={b.dialogSvg}
        label={`${item.name} mockup`}
      />
    </div>
  );
  const priorities = (
    <div className={b.prio}>
      <span className={b.prioHead}>
        What matters most? <span>Pick any</span>
      </span>
      <div className={b.prioChips}>
        {PRIORITIES.map((p) => {
          const on = prio.includes(p.id);
          return (
            <button key={p.id} type="button" aria-pressed={on} className={`${b.prioChip} ${on ? b.prioOn : ''}`} onClick={() => setPrio(on ? prio.filter((x) => x !== p.id) : [...prio, p.id])}>
              {p.label}
            </button>
          );
        })}
      </div>
      <span className={b.prioNote}>We’ll send 2–3 options to compare, from value to premium.</span>
    </div>
  );

  return createPortal(
    <div className={b.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={b.dialog} role="dialog" aria-modal="true" aria-label={item.name}>
        <div className={b.dialogLeft}>
          {partner ? (
            <div className={b.leftStack}>
              <span className={b.leftHead}>
                <span className={b.leftKicker}>DESIGN STUDIO</span>
                <span className={b.leftNote}>Partner tool</span>
              </span>
              {mock}
              <div className={b.row}>
                <span className={b.rowLabel}>Color</span>
                {swatches.map((c) => (
                  <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={studio.color === c} className={b.rowSwatch} style={{ background: c, boxShadow: studio.color === c ? '0 0 0 2px #111111' : undefined }} onClick={() => studio.setColor(c)} />
                ))}
              </div>
              {isApparel(item.shape) && (
                <div className={b.row}>
                  <span className={b.rowLabel}>Placement</span>
                  {[
                    ['front', 'Front center'],
                    ['chest', 'Left chest'],
                  ].map(([v, l]) => (
                    <button key={v} type="button" className={`${b.place} ${place === v ? b.placeOn : ''}`} aria-pressed={place === v} onClick={() => setPlace(v)}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              {!studio.kit.locked && (
                <div className={b.row}>
                  <span className={b.rowLabel}>Logo</span>
                  <button type="button" className={b.logoBtn} onClick={() => fileRef.current?.click()} disabled={busy === 'logo'}>
                    {busy === 'logo' ? 'Uploading…' : studio.logo ? 'Change logo' : 'Upload logo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onLogo} />
                </div>
              )}
              <div className={b.row}>
                <span className={`${b.rowLabel} ${b.rowLabelFixed}`}>Text</span>
                <input className={b.input} value={text} maxLength={18} onChange={(e) => setText(e.target.value)} placeholder="Team name, event or year" />
              </div>
              <button type="button" className={b.underline} onClick={download}>
                {downloaded ? 'Downloaded ✓' : 'Download mockup'}
              </button>
            </div>
          ) : (
            <div className={b.leftStack}>
              <span className={b.leftKicker}>{categoryOf(item.category)?.label.toUpperCase() ?? 'FULLY CUSTOM'}</span>
              {mock}
              <div className={b.partnerBox}>
                <span className={b.partnerBoxKicker}>FOR CLP PARTNERS</span>
                <strong>Mockups are for approved partners</strong>
                <span>Approved CLP partners get the design studio, live mockups, saved designs and partner pricing.</span>
                <span className={b.partnerBoxLinks}>
                  <BecomePartner className={b.goldBtn}>Apply to become a partner</BecomePartner>
                  <button type="button" onClick={onSignIn}>
                    Partner sign in
                  </button>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={b.dialogRight}>
          <button type="button" className={b.dialogClose} aria-label="Close" onClick={onClose}>
            ×
          </button>
          {done ? (
            <div className={b.done}>
              <span className={b.doneMark}>✓</span>
              <span className={b.doneTitle}>{done === 'order' ? 'Order placed' : 'Quote request sent'}</span>
              <span className={b.doneText}>
                {done === 'order'
                  ? `${item.name} is in production review. We’ll send a final proof to approve, then it’s made and shipped in bulk.`
                  : `${item.name} is with our sourcing team. Expect your custom quote within 2 business days.`}
              </span>
              <div className={b.doneBtns}>
                <button type="button" className={b.btnDark} onClick={onClose}>
                  Keep browsing
                </button>
                <button type="button" className={b.btnLight} onClick={onShowRequests}>
                  {partner ? 'My designs' : 'My quote requests'}
                </button>
              </div>
            </div>
          ) : (
            <div className={b.form}>
              <div className={b.formHead}>
                <span className={b.leftKicker}>{categoryOf(item.category)?.label.toUpperCase() ?? 'FULLY CUSTOM'}</span>
                <span className={b.formTitle}>{item.name}</span>
                <span className={b.formDesc}>{item.description}</span>
                <span className={b.formSpec}>{custom ? 'Any product · any decoration' : `${item.decoration.join(', ')} · ${item.sizes} · ${item.lead}`}</span>
              </div>

              {item.styles.length > 0 ? (
                <div className={b.block}>
                  <span className={b.blockHead}>
                    <strong>1. Choose styles</strong>
                    <span>Pick one or more</span>
                  </span>
                  <div className={b.styles}>
                    {item.styles.map((v, i) => {
                      const on = styles[i] !== undefined;
                      return (
                        <div key={v.name} className={`${b.style} ${on ? b.styleOn : ''}`}>
                          <button type="button" className={`${b.box} ${on ? b.boxOn : ''}`} aria-pressed={on} aria-label={`Select ${v.name}`} onClick={() => toggleStyle(i)}>
                            {on ? '✓' : ''}
                          </button>
                          <span className={b.styleText}>
                            <strong>{v.name}</strong>
                            <span>{v.note}</span>
                          </span>
                          {on && (
                            <input
                              type="number"
                              className={b.styleQty}
                              min={v.min}
                              value={styles[i]}
                              aria-label={`Quantity for ${v.name}`}
                              onChange={(e) => setStyles({ ...styles, [i]: e.target.value })}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className={b.styleSum}>{styleSum}</span>
                </div>
              ) : (
                <label className={b.block}>
                  <strong className={b.stepTitle}>Quantity</strong>
                  <input type="number" className={b.input} min={item.min} value={qty} onChange={(e) => setQty(e.target.value)} />
                </label>
              )}

              {partner ? (
                <>
                  <div className={b.block}>
                    <strong className={b.stepTitle}>{step(1)}. Design it</strong>
                    <div className={b.modes}>
                      {(
                        [
                          ['logo', 'Design it myself', 'Use the studio. Save, buy or quote anytime.'],
                          ['design', 'Have our designers create it', 'Original artwork made direct at the factory. Free concepts.'],
                        ] as const
                      )
                        .filter(([v]) => !(custom && v === 'logo'))
                        .map(([v, t, d]) => (
                          <button key={v} type="button" aria-pressed={mode === v} className={`${b.mode} ${mode === v ? b.modeOn : ''}`} onClick={() => setMode(v)}>
                            <strong>{t}</strong>
                            <span>{d}</span>
                          </button>
                        ))}
                    </div>
                    {mode === 'logo' && !custom && (
                      <Link href={shopHref({ view: 'studio', item: item.id })} className={b.studioLink}>
                        Open the full design studio →
                      </Link>
                    )}
                    {mode === 'design' && (
                      <label className={b.field}>
                        Brief for our designers
                        <textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Theme, colors, patterns, materials, who it’s for" />
                      </label>
                    )}
                  </div>
                  <div className={b.priceBox}>
                    <span className={b.priceHead}>
                      <strong>{step(2)}. Price &amp; checkout</strong>
                      <span>PARTNER PRICING</span>
                    </span>
                    <div className={b.priceRow}>
                      <span>{styleSum}</span>
                      <span className={b.priceValue}>
                        <strong>Quoted</strong>
                        <span>Partner pricing on your quote · before shipping</span>
                      </span>
                    </div>
                    {priorities}
                  </div>
                  {saved && <span className={b.savedNote}>Saved to My designs ✓ · share it with your team or come back later</span>}
                  {error && <span className={b.error}>{error}</span>}
                  <div className={b.actions}>
                    <button type="button" className={b.btnLight} disabled={Boolean(busy)} onClick={() => send('saved')}>
                      {busy === 'saved' ? 'Saving…' : saved ? 'Saved ✓' : 'Save design'}
                    </button>
                    <button type="button" className={b.btnLight} disabled={Boolean(busy)} onClick={() => send('quote')}>
                      {busy === 'quote' ? 'Sending…' : 'Get a quote'}
                    </button>
                    <button type="button" className={b.btnDark} disabled={Boolean(busy)} onClick={() => send('order')}>
                      {busy === 'order' ? 'Placing…' : 'Buy now'}
                    </button>
                  </div>
                  <span className={b.finePrint}>Buy now places a production order at partner pricing. We confirm a final proof before anything is made.</span>
                </>
              ) : (
                <>
                  <div className={b.block}>
                    <strong className={b.stepTitle}>{step(1)}. Your details</strong>
                    <div className={b.fields}>
                      <label className={b.field}>
                        Name
                        <input value={contact.name} maxLength={120} autoComplete="name" onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Your name" />
                      </label>
                      <label className={b.field}>
                        Organization
                        <input value={contact.organization} maxLength={120} autoComplete="organization" onChange={(e) => setContact({ ...contact, organization: e.target.value })} placeholder="Team, school or company" />
                      </label>
                      <label className={b.field}>
                        Email
                        <input type="email" value={contact.email} maxLength={200} autoComplete="email" onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" />
                      </label>
                      <label className={b.field}>
                        In-hands date
                        <input type="date" value={contact.inHands} onChange={(e) => setContact({ ...contact, inHands: e.target.value })} />
                      </label>
                    </div>
                    <label className={b.field}>
                      What do you have in mind?
                      <textarea rows={3} maxLength={2000} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Colors, logo placement, sizes, anything you want designed" />
                    </label>
                    <label className={b.attach}>
                      <span>Link to your logo or inspiration (optional)</span>
                      <input type="url" maxLength={500} value={contact.logoLink} onChange={(e) => setContact({ ...contact, logoLink: e.target.value })} placeholder="https://" />
                    </label>
                  </div>
                  <div className={b.guestPrice}>
                    <span>
                      <strong>Options for every budget.</strong> <span>We quote direct from manufacturing.</span>
                    </span>
                    {priorities}
                  </div>
                  {error && <span className={b.error}>{error}</span>}
                  <div className={b.guestActions}>
                    <button type="button" className={b.btnDark} disabled={Boolean(busy)} onClick={() => send('quote')}>
                      {busy ? 'Sending…' : 'Send quote request'}
                    </button>
                    <span className={b.finePrint}>Free to request. Our sourcing team replies within 2 business days.</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------- my designs / requests */

function Requests({
  title,
  partner,
  items,
  onClose,
  onOpen,
  onRemove,
}: {
  title: string;
  partner: boolean;
  items: BulkRequest[];
  onClose: () => void;
  onOpen: (r: BulkRequest) => void;
  onRemove: (r: BulkRequest) => Promise<void>;
}) {
  const [tab, setTab] = useState<'all' | BulkKind>('all');
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const list = useMemo(() => items.filter((r) => !partner || tab === 'all' || r.kind === tab), [items, partner, tab]);
  const tabs: ['all' | BulkKind, string][] = [
    ['all', 'All'],
    ['saved', 'Saved'],
    ['quote', 'Quotes'],
    ['order', 'Orders'],
  ];
  return createPortal(
    <div className={s.cartScrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={s.cart} role="dialog" aria-modal="true" aria-label={title}>
        <div className={b.reqHead}>
          <div className={b.reqTop}>
            <strong>{title}</strong>
            <button type="button" className={s.cartClose} aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
          {partner && (
            <div className={b.reqTabs}>
              {tabs.map(([id, label]) => (
                <button key={id} type="button" className={tab === id ? b.reqTabOn : undefined} onClick={() => setTab(id)}>
                  {label} {id === 'all' ? items.length : items.filter((r) => r.kind === id).length}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={s.cartBody}>
          {list.length === 0 && <span className={b.reqEmpty}>{partner ? 'Nothing here yet. Open any item to design it, then save, buy or get a quote.' : 'No requests yet. Open any item and send a quote request.'}</span>}
          {list.map((r) => {
            const it = bulkItem(r.itemId) ?? CUSTOM_ITEM;
            const [label, bg, fg] = statusOf(r);
            return (
              <div key={r.id} className={b.reqRow}>
                <span className={b.reqThumb}>
                  {r.mockup ? (
                    <img src={r.mockup} alt="" />
                  ) : (
                    <Mockup shape={it.shape} base={r.design?.base ?? GUEST_FILL} accent={r.design?.accent} pattern={r.design?.pattern} logo={r.design?.logo || undefined} placeholder={Boolean(r.design)} place={r.design?.place} />
                  )}
                </span>
                <span className={b.reqText}>
                  <strong>{r.itemName}</strong>
                  <span>{r.styles.length ? `${r.styles.length} ${r.styles.length === 1 ? 'style' : 'styles'} · Qty ${r.qty}` : r.itemId === 'custom' ? 'New product idea' : `Qty ${r.qty}`}</span>
                  <span className={b.reqChips}>
                    <span style={{ background: bg, color: fg }}>{label}</span>
                    {r.mode === 'design' && <span className={b.reqBrief}>Designer brief</span>}
                  </span>
                </span>
                {partner && r.kind === 'saved' && (
                  <span className={b.reqActions}>
                    {r.itemId !== 'custom' && (
                      <button type="button" onClick={() => onOpen(r)}>
                        Open
                      </button>
                    )}
                    <button type="button" className={b.reqRemove} onClick={() => onRemove(r)}>
                      Remove
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className={s.cartFoot}>
          <span className={b.reqFoot}>
            {partner
              ? 'Saved designs stay in your CLP account. Quotes and orders go straight to our sourcing team, who confirm a final proof before production.'
              : 'Our sourcing team reviews every request and emails a custom quote within 2 business days.'}
          </span>
          <button type="button" className={s.checkoutBtn} onClick={onClose}>
            Keep browsing
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
