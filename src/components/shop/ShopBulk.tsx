'use client';
/* eslint-disable @next/next/no-img-element -- the partner's or guest's own logo (their upload), shown as it is. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LuBox, LuClock, LuLayers, LuPalette, LuShapes } from 'react-icons/lu';
import BecomePartner from '@/components/partners/BecomePartner';
import lc from '@/components/sections/ListingCard.module.css';
import t from '@/components/sections/TeamDirectory.module.css';
import Pager from '@/components/ui/Pager';
import { type ResultsView } from '@/components/ui/ViewToggle';
import {
  BULK_CATEGORIES,
  BULK_ITEMS,
  CUSTOM_ITEM,
  DECORATIONS,
  PRIORITIES,
  VIEWS,
  bulkItem,
  categoryOf,
  createDesign,
  deleteDesign,
  designAction,
  guestRequestAction,
  guestRequests,
  isApparel,
  leadWeeks,
  myDesigns,
  sendGuestQuote,
  uploadGuestImage,
  type BulkItem,
  type BulkKind,
  type BulkRequest,
  type RequestAction,
  type RequestActionInput,
} from '@/content/bulk';
import { partnerSignOut, uploadImage } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import Mockup, { mockupPng, saveFile } from './Mockup';
import PartnerSignIn from './PartnerSignIn';
import { LockIcon } from './shopIcons';
import { CardGrid, LIST_SIZES, ListToolbar, ShopSearch, hasWords, titleCase, type ListChip } from './shopListing';
import { imageDataUrl, useStudio, type StudioBrand } from './useStudio';
import b from './bulk.module.css';
import s from './shop.module.css';

/** The bulk tiles' colours (a partner's brand colours first, when they have any). */
const DEFAULT_SWATCHES = ['#111111', '#FFFFFF', '#0B2A5B', '#7A1F2B', '#1D6363', '#C8102E', '#2E7D32', '#DCBD7D'];
/** A request without a design (sent before guests could add their logo) in the requests list. */
const GUEST_FILL = '#1F2A44';

/** The list's filters besides its category: each pill's "All …" name, its panel heading, icon and options. */
const FILTERS = {
  src: { name: 'All Availability', heading: 'Availability', icon: <LuBox />, plural: 'options', options: [['clp', 'Made to Order'], ['stock', 'In Stock · Ships Faster']] },
  deco: { name: 'All Decorations', heading: 'Decoration', icon: <LuPalette />, plural: 'decorations', options: DECORATIONS.map((d) => [d.id, d.label]) },
  lead: { name: 'All Lead Times', heading: 'Lead Time', icon: <LuClock />, plural: 'lead times', options: [['fast', '2 Weeks or Less'], ['mid', '3–4 Weeks'], ['long', '5+ Weeks']] },
  min: { name: 'All Minimums', heading: 'Minimum Order', icon: <LuLayers />, plural: 'minimums', options: [['one', 'Single Units'], ['small', '24 or Less'], ['mid', '100 or Less']] },
} as const;
type FilterKey = keyof typeof FILTERS;
type Filters = Record<FilterKey | 'cat', string>;

const matches = (it: BulkItem, f: Filters, q: string) => {
  if (f.cat && it.category !== f.cat) return false;
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
  return hasWords(`${it.name} ${it.description} ${it.material} ${it.decoration.join(' ')} ${categoryOf(it.category)?.label ?? ''}`, q);
};

type BulkSort = 'recommended' | 'lead' | 'min' | 'az';
const BULK_SORTS: { value: BulkSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'lead', label: 'Fastest Lead Time' },
  { value: 'min', label: 'Lowest Minimum' },
  { value: 'az', label: 'A–Z' },
];
const bulkSortBy = (sort: BulkSort) => (a: BulkItem, b2: BulkItem) =>
  sort === 'lead' ? leadWeeks(a.lead) - leadWeeks(b2.lead) : sort === 'min' ? a.min - b2.min : sort === 'az' ? a.name.localeCompare(b2.name) : 0;

/** The address of an item's page (with the destination searched, its quote's delivery place). */
const itemHref = (id: string, loc: string) => shopHref({ view: 'bulk', item: id, loc });

const KIND_LABEL: Record<BulkKind, string> = { saved: 'Saved ✓', quote: 'Quote requested ✓', order: 'Ordered ✓' };
const STATUS: Record<string, [string, string, string]> = {
  saved: ['Saved design', '#F0EEE9', '#444444'],
  quote: ['Preparing your quote', '#F2F1ED', '#444444'],
  order: ['Ordered', '#FBF0D6', '#7A5A12'],
  updating: ['Updating your quote', '#F2F1ED', '#444444'],
  art: ['Artwork in review', '#FBF3E2', '#8A6F33'],
  changes: ['Changes requested', '#FBEAE8', '#B03A2E'],
  quoted: ['Quote ready', '#111111', '#FFFFFF'],
  expired: ['Quote expired', '#F0EEE9', '#666666'],
  'in-production': ['In production', '#E7F3EC', '#1E7A45'],
  shipped: ['Shipped', '#E6EEF8', '#1B4F8C'],
  declined: ['Declined', '#F0EEE9', '#666666'],
  closed: ['Closed', '#F0EEE9', '#666666'],
};
/** CLP's desk steps while it prices the request (a maker's cost…) read as preparing the quote (or, for an order, ordered). */
const PRICING = ['new', 'quote', 'maker', 'maker-in'];
const expired = (r: BulkRequest) => r.status === 'quoted' && Boolean(r.quote) && new Date(r.quote!.validUntil).getTime() < Date.now();
const statusKey = (r: BulkRequest) => {
  if (r.kind === 'saved') return 'saved';
  if (PRICING.includes(r.status)) return r.reply?.kind === 'changes' ? 'updating' : r.kind === 'order' ? 'order' : 'quote';
  if (r.status === 'quoted') return expired(r) ? 'expired' : 'quoted';
  if (r.status === 'closed' && r.reply?.kind === 'declined') return 'declined';
  return r.status;
};
const statusOf = (r: BulkRequest) => STATUS[statusKey(r)] ?? STATUS.quote;
/** What needs the requester: a quote to approve, or new artwork to send. */
const needsYou = (r: BulkRequest) => r.status === 'changes' || (r.status === 'quoted' && Boolean(r.quote) && !expired(r));

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
 * promo, made to order and quoted direct from manufacturing. The shop's search (what, and where it ships), the
 * experiences' bar (All Categories and the other filters, the sort, grid or list), the items as the experiences'
 * cards, and pages; an item opens on its own page (?item=). Everyone previews every item with their logo and colour (the
 * brand kit: a partner's from their account, a guest's kept in this browser); a signed-in CLP partner designs it in the
 * studio, a guest requests a quote with it. "My designs" / "My quote requests" lists what they sent. The search,
 * filters, sort, page and view live in the address.
 */
export default function ShopBulk() {
  const params = useSearchParams();
  const router = useRouter();
  const studio = useStudio();
  const { partner } = studio;
  const get = (key: string) => params.get(key) ?? '';
  const set = (next: Record<string, string>, step = false) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    if (!('page' in next)) q.delete('page');
    const query = q.toString();
    const href = `${window.location.pathname}${query ? `?${query}` : ''}`;
    if (step) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  };
  const [reqsOpen, setReqsOpen] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const reqs = useRequests(partner, !studio.loading);
  const fileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const q = get('q');
  const loc = get('loc');
  const filters: Filters = {
    cat: BULK_CATEGORIES.some((c) => c.id === get('cat')) ? get('cat') : '',
    ...(Object.fromEntries((Object.keys(FILTERS) as FilterKey[]).map((k) => [k, FILTERS[k].options.some(([v]) => v === get(k)) ? get(k) : ''])) as Record<FilterKey, string>),
  };
  const sort: BulkSort = BULK_SORTS.some((o) => o.value === get('sort')) ? (get('sort') as BulkSort) : 'recommended';
  const view: ResultsView = get('cards') === 'list' ? 'list' : 'grid';
  const per = (LIST_SIZES as readonly number[]).includes(Number(get('per'))) ? Number(get('per')) : LIST_SIZES[0];
  const matching = (f: Filters) => BULK_ITEMS.filter((it) => matches(it, f, q));
  const items = matching(filters).sort(bulkSortBy(sort));
  const any = Boolean(q || Object.values(filters).some(Boolean));
  // The whole catalog leads with the fully custom product, counted in its first page.
  const list = any ? items : [CUSTOM_ITEM, ...items];
  const pageCount = Math.max(1, Math.ceil(list.length / per));
  const page = Math.min(Math.max(0, (Number(get('page')) || 1) - 1), pageCount - 1);
  const onPage = list.slice(page * per, page * per + per);
  const latest = (id: string) => reqs.items.find((r) => r.itemId === id);
  const swatches = studio.kit.locked && studio.kit.colors.length ? studio.kit.colors : studio.kit.colors.length ? [...new Set([...studio.kit.colors, ...DEFAULT_SWATCHES])].slice(0, 8) : DEFAULT_SWATCHES;
  const chip = (id: FilterKey | 'cat', name: string, heading: string, icon: ReactNode, plural: string, options: [string, string][]): ListChip => ({
    id,
    name,
    heading,
    icon,
    plural,
    options: options.map(([value, label]) => ({ value, label, count: matching({ ...filters, [id]: value }).length })),
    value: filters[id],
    onChange: (v) => set({ [id]: v }),
    count: (v) => matching({ ...filters, [id]: v }).length,
  });
  const chips = [
    chip('cat', 'All Categories', 'Category', <LuShapes />, 'categories', BULK_CATEGORIES.map((c) => [c.id, c.label] as [string, string]).sort((a, z) => a[1].localeCompare(z[1]))),
    ...(Object.keys(FILTERS) as FilterKey[]).map((k) => chip(k, FILTERS[k].name, FILTERS[k].heading, FILTERS[k].icon, FILTERS[k].plural, FILTERS[k].options.map(([v, l]) => [v, l] as [string, string]))),
  ];

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
  // A partner designs a catalog item in the studio; anyone else (and the custom item) opens its page.
  // Every catalog item opens its design studio page (guests ask for a quote there); the fully custom one its own page.
  const hrefOf = (it: BulkItem) => (it.id !== 'custom' ? shopHref({ view: 'studio', item: it.id }) : itemHref(it.id, loc));
  const reqTitle = partner ? 'My designs' : 'My quote requests';
  const drawers = (
    <>
      {(reqsOpen || get('requests') === '1') && (
        <Requests
          title={reqTitle}
          partner={partner}
          items={reqs.items}
          onChange={(r) => reqs.setItems((list) => list.map((x) => (x.id === r.id ? r : x)))}
          onClose={() => {
            setReqsOpen(false);
            // Opened from an e-mail's link (?requests=1): the address goes back to the list.
            if (get('requests')) set({ requests: '' });
          }}
          onOpen={(r) => router.push(shopHref({ view: 'studio', item: r.itemId, design: r.id }))}
          onRemove={async (r) => {
            await deleteDesign(r.id);
            reqs.setItems((list) => list.filter((x) => x.id !== r.id));
          }}
        />
      )}
      {signIn && <PartnerSignIn onClose={() => setSignIn(false)} />}
    </>
  );

  // An item's own page.
  const itemId = get('item');
  if (itemId) {
    const it = bulkItem(itemId);
    return (
      <div className={b.bulk}>
        {it ? (
          <BulkItemPage
            key={it.id}
            item={it}
            studio={studio}
            swatches={swatches}
            loc={loc}
            onBack={() => router.push(shopHref({ view: 'bulk', loc }))}
            onSent={(r) => reqs.setItems((list) => [r, ...list.filter((x) => x.id !== r.id)])}
            onShowRequests={() => setReqsOpen(true)}
            onSignIn={() => setSignIn(true)}
          />
        ) : (
          <>
            <section className={s.thinBand} data-header-tone="light" />
            <div className={`${s.section} ${s.spacedSm}`}>
              <div className={s.empty}>
                This item isn&rsquo;t in the catalog anymore.
                <Link href={shopHref({ view: 'bulk' })} className={s.btnDark}>
                  Back to Bulk &amp; Operations
                </Link>
              </div>
            </div>
            <div className={s.bottomSpace} />
          </>
        )}
        {drawers}
      </div>
    );
  }

  return (
    <div className={b.bulk}>
      <section className={b.hero} data-header-tone="light">
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
            <h1 className={b.heroTitle}>Outfit Your Team, Staff or Event</h1>
            <p className={b.heroText}>
              {partner
                ? 'Design team kits, staff gear, event supplies and more in the CLP studio, then save, buy at partner pricing or get a quote.'
                : 'Team kits, staff gear, event supplies, inflatables and promo, made direct from our factories and shipped in bulk. Request a quote on anything.'}
            </p>
            <span className={s.kicker}>BULK &amp; OPERATIONS</span>
          </div>
        </div>
      </section>
      <ShopSearch q={q} loc={loc} places={[]} placeholder="Search jerseys, socks, tents, medals…" label="Bulk items" onSearch={(nq, nloc) => set({ q: nq, loc: nloc })} />

      <section ref={topRef} className={b.wrap} data-listing="">
        <ListToolbar
          chips={chips}
          sort={{ value: sort, options: BULK_SORTS, onChange: (v) => set({ sort: v === 'recommended' ? '' : v }) }}
          view={view}
          onView={(v) => set({ cards: v === 'list' ? 'list' : '', page: get('page') })}
        />
        <div className={b.kit}>
          <span className={b.kitLabel}>YOUR BRAND KIT</span>
          {/* Once the partner's page has loaded: their name, never a placeholder in the meantime. */}
          {partner && !studio.loading && (
            <span className={b.kitFor}>
              For <strong>{studio.name || 'your team'}</strong>
            </span>
          )}
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
                  {uploading ? 'Adding…' : studio.logo ? 'Change logo' : 'Upload logo'}
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onLogo} />
                <button type="button" className={b.sampleBtn} onClick={studio.trySample}>
                  Try sample
                </button>
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
          <span className={`${b.kitNote} ${uploadError ? b.kitError : ''}`} role={uploadError ? 'alert' : undefined}>
            {uploadError || (partner ? 'Every item previews with your brand. Open one to design it in the studio.' : 'Every item previews with your logo and color. Send them with your quote request.')}
          </span>
        </div>
      </section>

      <section className={b.gridWrap} data-listing="">
        {items.length === 0 ? (
          <div className={b.empty}>
            No items match. Try other words or filters.
            <button type="button" onClick={() => set({ q: '', cat: '', src: '', deco: '', lead: '', min: '' })}>
              Clear All
            </button>
          </div>
        ) : (
          <CardGrid view={view}>
            {onPage.map((it) => (
              <div key={it.id} className={t.listingItem}>
                {it.id === 'custom' ? (
                  <BulkCard item={it} href={itemHref('custom', loc)} partner={partner} studio={studio} view={view} custom />
                ) : (
                  <BulkCard item={it} href={hrefOf(it)} partner={partner} studio={studio} view={view} sent={latest(it.id)?.kind} />
                )}
              </div>
            ))}
          </CardGrid>
        )}
        {list.length > LIST_SIZES[0] && (
          <div data-listing className={s.pager}>
            <Pager
              page={page}
              pageCount={pageCount}
              total={list.length}
              shown={onPage.length}
              pageSize={per}
              sizes={LIST_SIZES}
              onPage={(n) => {
                set({ page: n ? String(n + 1) : '' }, true);
                topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              onPageSize={(n) => set({ per: n === LIST_SIZES[0] ? '' : String(n) })}
            />
          </div>
        )}
      </section>

      {/* How it works: a centred heading over four numbered steps, joined by a line. */}
      <section className={b.howWrap}>
        <div className={b.how}>
          <div className={b.howHead}>
            <h2 className={b.howTitle}>{partner ? 'Design to doorstep' : 'Request, quote, deliver'}</h2>
            <p className={b.howText}>Every order is quoted direct from manufacturing, with options from value to premium so you get the best fit.</p>
            <span className={s.kicker}>HOW IT WORKS</span>
          </div>
          <ol className={b.steps}>
            {(partner
              ? [
                  ['Mock it up', 'Design on CLP-made items and in-stock blanks.'],
                  ['Approve your proof', 'Save, share with your team and sign off.'],
                  ['We produce it', 'Our team handles sourcing and production.'],
                  ['Shipped & tracked', 'Tracking and status sync back to your account.'],
                ]
              : [
                  ['Pick items & styles', 'Choose what you need and how many.'],
                  ['Send a quote request', 'Add your logo, then tell us your idea and date.'],
                  ['Get a custom quote', 'Direct from manufacturing, with 2–3 options to compare.'],
                  ['Made & shipped in bulk', 'With a proof to approve before production.'],
                ]
            ).map(([title, text], i) => (
              <li key={title} className={b.step}>
                <span className={b.stepN} aria-hidden>
                  {i + 1}
                </span>
                <strong className={b.stepTitle}>{title}</strong>
                <span className={b.stepText}>{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {drawers}
    </div>
  );
}

/**
 * A catalog item as the experiences' card: its mockup (in the partner's or guest's logo and colour) with its maker's
 * badge and what was sent for it, its category, name, In stock, styles, minimum and lead time, and Request a Quote
 * (Mock It Up for a partner). The fully custom product: a dark card that starts a design or a quote.
 */
function BulkCard({
  item,
  href,
  partner,
  studio,
  view,
  sent,
  custom = false,
}: {
  item: BulkItem;
  href: string;
  partner: boolean;
  studio: StudioBrand;
  view: ResultsView;
  sent?: BulkKind;
  custom?: boolean;
}) {
  return (
    <Link href={href} className={[lc.card, view === 'list' && lc.list, b.card].filter(Boolean).join(' ')}>
      <span className={`${lc.media} ${b.cardMedia} ${custom ? b.cardMediaCustom : ''}`}>
        {custom ? (
          <span className={b.cardCustom}>
            <span className={b.customPlus}>+</span>
            <span className={b.customKicker}>DIRECT FROM MANUFACTURING</span>
            <span className={b.cardCustomTitle}>Design something new</span>
          </span>
        ) : (
          <Mockup shape={item.shape} base={studio.color} logo={studio.logo || undefined} placeholder place="front" className={b.cardSvg} />
        )}
        {!custom && item.badge && <span className={b.badge}>{item.badge}</span>}
        {sent && <span className={b.onLabel}>{KIND_LABEL[sent]}</span>}
      </span>
      <span className={lc.body}>
        <span className={lc.provider}>{custom ? 'Fully Custom' : titleCase(categoryOf(item.category)?.label ?? '')}</span>
        <span className={lc.title}>{custom ? 'Bring us your idea' : item.name}</span>
        {custom ? (
          <span className={b.cardLine}>Custom patterns, colors, materials and shapes. Our designers and factories make it from scratch.</span>
        ) : (
          <>
            {item.stock && (
              <span className={b.stock}>
                <span />
                In stock · ready to decorate
              </span>
            )}
            <span className={b.itemMeta}>
              <span>{item.styles.length} styles</span>
              <span className={b.metaRule} />
              <span>
                Min {item.min} {item.unit}
              </span>
              <span className={b.metaRule} />
              <span>{item.lead}</span>
            </span>
          </>
        )}
        {/* A row of the list: the button on the right of its foot, as the experiences' rows. */}
        <span className={view === 'list' ? lc.footer : lc.facilityFooter}>
          {view === 'list' && <span />}
          <span className={`${lc.cta} ${view === 'list' ? '' : lc.ctaWide}`}>{custom ? (partner ? 'Start a Design' : 'Request a Quote') : partner ? 'Mock It Up' : 'Request a Quote'}</span>
        </span>
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------------- an item */

/**
 * An item's page (as a product's page on the shop): the breadcrumb, its mockup with its views (front, back, sides) and,
 * under it, the colour, placement, logo and text (a guest's too, then the partner sign-up); beside it its name, minimum
 * and lead time, description, then the styles and quantities, how it gets designed (partners) or who is asking
 * (guests), where it ships, what matters most, and save, quote or buy. A guest's quote carries their design, logo and
 * mockup.
 */
function BulkItemPage({
  item,
  studio,
  swatches,
  loc,
  onBack,
  onSent,
  onShowRequests,
  onSignIn,
}: {
  item: BulkItem;
  studio: StudioBrand;
  swatches: string[];
  /** The searched destination: where it ships (editable). */
  loc: string;
  onBack: () => void;
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
  const [contact, setContact] = useState({ name: '', organization: '', email: '', inHands: '', message: '', logoLink: '', deliverTo: loc });
  const views = VIEWS[item.shape] ?? [['front', 'Front']];
  const [shown, setShown] = useState(views[0][0]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState<BulkKind | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const svgWrap = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const chosen = Object.entries(styles).map(([i, q]) => ({ name: item.styles[Number(i)].name, qty: Number(q) || 0 }));
  const total = item.styles.length ? chosen.reduce((n, x) => n + x.qty, 0) : Number(qty) || 0;
  const styleSum = custom
    ? 'New product idea'
    : item.styles.length
      ? chosen.length
        ? `${chosen.length} ${chosen.length === 1 ? 'style' : 'styles'} · ${total} total`
        : 'Select at least one style'
      : `${total} ${item.unit}`;
  const step = (n: number) => (item.styles.length ? n + 1 : n);
  const toggleStyle = (i: number) => {
    const next = { ...styles };
    if (next[i] !== undefined) delete next[i];
    else next[i] = String(item.styles[i].min);
    setStyles(next);
  };
  const svg = () => svgWrap.current?.querySelector('svg') as SVGSVGElement | null;
  const design = (logo: string) => ({
    base: studio.color,
    accent: '#DCBD7D',
    pattern: 'none',
    trim: false,
    logoOn: true,
    logo,
    place: isApparel(item.shape) && place === 'chest' ? 'chest' : 'center',
    logoScale: 1,
    dx: 0,
    dy: 0,
    text,
    font: 'mont',
    textColor: '',
    textPlace: 'below',
    textScale: 1,
    playerName: 'PLAYER',
    playerNumber: '10',
    numberColor: '',
    numberFont: 'college',
    locations: [],
    style: 0,
  });
  /** A guest's logo as a link for their quote: their image (or the sample) kept with the cart, then used from there. */
  const guestLogo = async () => {
    const logo = studio.logo;
    if (!logo || /^https:\/\//.test(logo)) return logo;
    const url = await uploadGuestImage(await imageDataUrl(logo));
    studio.setLogo(url);
    return url;
  };

  const send = async (kind: BulkKind) => {
    setError('');
    if (item.styles.length && !chosen.length && kind !== 'saved') return setError('Select at least one style.');
    if (!partner) {
      if (!contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) return setError('Enter your name and a valid email.');
    }
    setBusy(kind);
    try {
      let logo = studio.logo;
      if (!partner) {
        try {
          logo = await guestLogo();
        } catch (err) {
          throw new Error(err instanceof Error && err.message ? `${err.message} Or remove your logo and send a link to it instead.` : 'Could not add your logo. Try again.');
        }
      }
      let mockup = '';
      if (kind !== 'saved' && svg()) {
        try {
          mockup = partner ? await uploadImage(await mockupPng(svg()!)) : await uploadGuestImage(await imageDataUrl(await mockupPng(svg()!, 800), 800));
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
          ? {
              ...(contact.deliverTo.trim() ? { contact: { name: '', organization: '', email: '', inHands: '', message: '', logoLink: '', deliverTo: contact.deliverTo.trim() } } : {}),
              mode,
              brief,
              design: design(logo),
              mockup,
            }
          : { contact: { ...contact, name: contact.name.trim(), email: contact.email.trim(), deliverTo: contact.deliverTo.trim() }, design: design(logo), mockup }),
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
    setError('');
    try {
      studio.setLogo(await studio.upload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add your logo.');
    } finally {
      setBusy('');
    }
  };

  const mock = (
    <div ref={svgWrap} className={b.dialogMock}>
      <Mockup
        shape={item.shape}
        base={studio.color}
        logo={studio.logo || undefined}
        placeholder
        place={isApparel(item.shape) ? place : 'center'}
        text={text}
        view={shown}
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

  const category = categoryOf(item.category);
  // The mockup's views (front, back, sides) as the product page's photos: thumbnails beside the large one.
  const gallery = (
    <div className={`${s.gallery} ${views.length < 2 ? b.galleryOne : ''}`}>
      {views.length > 1 && (
        <div className={s.thumbs}>
          {views.map(([v, label]) => (
            <button key={v} type="button" className={`${s.thumb} ${b.viewThumb} ${shown === v ? s.thumbOn : ''}`} aria-label={label} aria-pressed={shown === v} onClick={() => setShown(v)}>
              <Mockup shape={item.shape} base={studio.color} logo={studio.logo || undefined} placeholder place={isApparel(item.shape) ? place : 'center'} text={text} view={v} className={b.dialogSvg} />
            </button>
          ))}
        </div>
      )}
      <div className={`${s.mainPhoto} ${b.pageMock}`}>{mock}</div>
    </div>
  );

  return (
    <>
      <section className={s.thinBand} data-header-tone="light" />
      <section className={`${s.section} ${s.productSection}`}>
        <nav className={`${s.crumbs} ${s.crumbsLight}`} aria-label="Breadcrumb">
          <Link href={shopHref()}>Shop</Link>
          {'  ›  '}
          <Link href={shopHref({ view: 'bulk', loc })}>Bulk &amp; Operations</Link>
          {category && (
            <>
              {'  ›  '}
              <Link href={shopHref({ view: 'bulk', cat: category.id, loc })}>{titleCase(category.label)}</Link>
            </>
          )}
          {'  ›  '}
          {item.name}
        </nav>
        <div className={s.productLayout}>
          <div className={b.pageLeft}>
            <div className={b.leftStack}>
              <span className={b.leftHead}>
                <span className={b.leftKicker}>{partner ? 'DESIGN STUDIO' : 'PREVIEW'}</span>
                <span className={b.leftNote}>{partner ? 'Partner tool' : 'Your logo and color'}</span>
              </span>
              {gallery}
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
                    {busy === 'logo' ? 'Adding…' : studio.logo ? 'Change logo' : 'Upload logo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onLogo} />
                  <button type="button" className={b.sampleBtn} onClick={studio.trySample}>
                    Try sample
                  </button>
                  {studio.logo && (
                    <button type="button" className={b.sampleBtn} onClick={() => studio.setLogo('')}>
                      Remove
                    </button>
                  )}
                </div>
              )}
              <div className={b.row}>
                <span className={`${b.rowLabel} ${b.rowLabelFixed}`}>Text</span>
                <input className={b.input} value={text} maxLength={18} onChange={(e) => setText(e.target.value)} placeholder="Team name, event or year" />
              </div>
              <button type="button" className={b.underline} onClick={download}>
                {downloaded ? 'Downloaded ✓' : 'Download mockup'}
              </button>
              {!partner && (
                <div className={b.partnerBox}>
                  <span className={b.partnerBoxKicker}>FOR CLP PARTNERS</span>
                  <strong>The full design studio is for approved partners</strong>
                  <span>Approved CLP partners also get templates, patterns, print locations, saved designs and partner pricing.</span>
                  <span className={b.partnerBoxLinks}>
                    <BecomePartner className={b.goldBtn}>Apply to become a partner</BecomePartner>
                    <button type="button" onClick={onSignIn}>
                      Partner sign in
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={b.pageRight}>
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
              <button type="button" className={b.btnDark} onClick={onBack}>
                Keep Browsing
              </button>
              <button type="button" className={b.btnLight} onClick={onShowRequests}>
                {partner ? 'My designs' : 'My quote requests'}
              </button>
            </div>
          </div>
        ) : (
          <div className={b.form}>
            {/* As a product page's heading: the name, what it takes to order, the description. */}
            <div className={s.buyHead}>
              <span className={b.leftKicker}>{category?.label.toUpperCase() ?? 'FULLY CUSTOM'}</span>
              <h1 className={s.productName}>{item.name}</h1>
              {!custom && <strong className={s.productPrice}>{`Min ${item.min} ${item.unit} · ${item.lead}`}</strong>}
              <span className={s.productText}>{item.description}</span>
              <span className={b.formSpec}>{custom ? 'Any product · any decoration' : `${item.decoration.join(', ')} · ${item.sizes}`}</span>
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
              // A fully custom idea has no quantity yet (the design): it's in the brief.
              !custom && (
                <label className={b.block}>
                  <strong className={b.stepTitle}>Quantity</strong>
                  <input type="number" className={b.input} min={item.min} value={qty} onChange={(e) => setQty(e.target.value)} />
                </label>
              )
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
                  <label className={b.field}>
                    Deliver to
                    <input value={contact.deliverTo} maxLength={160} autoComplete="address-level2" onChange={(e) => setContact({ ...contact, deliverTo: e.target.value })} placeholder="City or destination" />
                  </label>
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
                    <label className={b.field}>
                      Deliver to
                      <input value={contact.deliverTo} maxLength={160} autoComplete="address-level2" onChange={(e) => setContact({ ...contact, deliverTo: e.target.value })} placeholder="City or destination" />
                    </label>
                  </div>
                  <label className={b.field}>
                    What do you have in mind?
                    <textarea rows={3} maxLength={2000} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Colors, logo placement, sizes, anything you want designed" />
                  </label>
                  <label className={b.attach}>
                    <span>{studio.logo ? 'A link to your logo files or inspiration (optional)' : 'Or a link to your logo or inspiration (optional)'}</span>
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
      </section>
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- my designs / requests */

const TRACK_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  DHL: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?tracking-id=',
};
const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
/** Where a request is on its way: requested, quoted, in production, shipped. */
const STEPS = ['Requested', 'Quote', 'Production', 'Shipped'];
const stepOf = (r: BulkRequest) => (r.status === 'shipped' ? 3 : r.status === 'in-production' ? 2 : r.status === 'quoted' ? 1 : 0);

function Requests({
  title,
  partner,
  items,
  onClose,
  onOpen,
  onRemove,
  onChange,
}: {
  title: string;
  partner: boolean;
  items: BulkRequest[];
  onClose: () => void;
  onOpen: (r: BulkRequest) => void;
  onRemove: (r: BulkRequest) => Promise<void>;
  onChange: (r: BulkRequest) => void;
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
  const waiting = items.filter(needsYou).length;
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
          {items.some((r) => r.kind !== 'saved') && (
            <span className={waiting ? b.reqAttention : b.reqCalm}>{waiting ? `${waiting} ${waiting === 1 ? 'needs' : 'need'} your attention` : 'Nothing needs you right now'}</span>
          )}
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
              <div key={r.id} className={`${b.reqItem} ${needsYou(r) ? b.reqItemOn : ''}`}>
                <div className={b.reqRow}>
                  <span className={b.reqThumb}>
                    {r.mockup ? (
                      <img src={r.mockup} alt="" />
                    ) : (
                      <Mockup shape={it.shape} base={r.design?.base ?? GUEST_FILL} accent={r.design?.accent} pattern={r.design?.pattern} logo={r.design?.logo || undefined} placeholder={Boolean(r.design)} place={r.design?.place} />
                    )}
                  </span>
                  <span className={b.reqText}>
                    <strong>{r.itemName}</strong>
                    <span>
                      {[
                        r.ref,
                        r.styles.length ? `${r.styles.length} ${r.styles.length === 1 ? 'style' : 'styles'} · Qty ${r.qty}` : r.itemId === 'custom' ? 'New product idea' : `Qty ${r.qty}`,
                        r.kind !== 'saved' && `Sent ${day(r.createdAt)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
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
                {r.kind !== 'saved' && <RequestDetail r={r} partner={partner} onChange={onChange} />}
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

/**
 * A quote request or order in My quote requests: how far along it is, and what CLP sent. Its quote (per piece,
 * total, when it's ready, until when it holds) to approve, change or decline; CLP's artwork note with a way to send a
 * new file; the approval; each box's tracking once it ships.
 */
function RequestDetail({ r, partner, onChange }: { r: BulkRequest; partner: boolean; onChange: (r: BulkRequest) => void }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState<'' | 'changes' | 'decline'>('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const act = async (action: RequestAction, input: RequestActionInput = {}) => {
    setBusy(action);
    setError('');
    try {
      onChange(await (partner ? designAction : guestRequestAction)(r.id, action, input));
      setOpen('');
      setNote('');
      setLink('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t go through. Please try again.');
    } finally {
      setBusy('');
    }
  };
  const sendFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('new-artwork');
    setError('');
    try {
      const logo = partner ? await uploadImage(file) : await uploadGuestImage(await imageDataUrl(file, 1500));
      await act('new-artwork', { logo, note: note.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file didn’t upload. Try a PNG or JPG.');
      setBusy('');
    }
  };
  const q = r.quote;
  const step = stepOf(r);
  const closed = r.status === 'closed';
  return (
    <div className={b.reqDetail}>
      {!closed && (
        <div className={b.reqSteps} aria-label={`Step ${step + 1} of 4: ${STEPS[step]}`}>
          {STEPS.map((label, i) => (
            <span key={label} data-on={i <= step}>
              <i />
              {label}
            </span>
          ))}
        </div>
      )}

      {r.status === 'changes' && (
        <div className={b.reqNoteRed}>
          <span className={b.reqWho}>FROM THE CLP TEAM · {r.art ? day(r.art.at).toUpperCase() : ''}</span>
          <span>{r.art?.note || 'Your artwork needs a change before production.'}</span>
          <label className={b.reqField}>
            Note for our team (optional)
            <textarea rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className={b.reqBtns}>
            <button type="button" className={b.reqDark} disabled={Boolean(busy)} onClick={() => fileRef.current?.click()}>
              {busy === 'new-artwork' ? 'Sending…' : 'Upload a new file'}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={sendFile} />
          </div>
          <label className={b.reqField}>
            Or paste a link to a vector file (AI, EPS, SVG, PDF)
            <span className={b.reqLinkRow}>
              <input type="url" inputMode="url" placeholder="https://" value={link} maxLength={490} onChange={(e) => setLink(e.target.value)} />
              <button type="button" className={b.reqLight} disabled={Boolean(busy) || !link.trim()} onClick={() => act('new-artwork', { link: link.trim(), note: note.trim() })}>
                Send link
              </button>
            </span>
          </label>
        </div>
      )}

      {r.status === 'art' && r.art?.state === 'resubmitted' && <div className={b.reqNote}>New file sent {day(r.art.at)}. Our team is checking it, usually the same day.</div>}
      {r.status === 'art' && r.art?.state !== 'resubmitted' && <div className={b.reqNote}>Our team is checking your artwork before we price it.</div>}
      {PRICING.includes(r.status) &&
        (r.art?.state === 'resubmitted' ? (
          <div className={b.reqNote}>New file sent {day(r.art.at)}. We’re checking it and preparing your quote.</div>
        ) : r.reply?.kind === 'changes' ? (
          <div className={b.reqNote}>
            You asked for changes {day(r.reply.at)}: “{r.reply.note}”. We’ll send an updated quote.
          </div>
        ) : (
          <div className={b.reqNote}>{r.kind === 'order' ? 'Our team is confirming your order. You’ll get a final price to approve before production.' : 'We’re preparing your quote. Expect it within 2 business days.'}</div>
        ))}

      {r.status === 'quoted' && !q && <div className={b.reqNote}>We e-mailed you your quote. Reply to that e-mail to approve it or ask for changes.</div>}
      {r.status === 'quoted' && q && (
        <div className={b.reqQuote}>
          <span className={b.reqWho}>QUOTE FROM THE CLP TEAM · {day(q.sentAt).toUpperCase()}</span>
          <div className={b.reqQuoteRows}>
            <span>Per piece</span>
            <strong>{money(q.unitPrice)}</strong>
            <span>
              {q.qty} {q.qty === 1 ? 'piece' : 'pieces'}
            </span>
            <strong>{money(q.total)}</strong>
            {q.lead && (
              <>
                <span>Ready in</span>
                <span>{q.lead}</span>
              </>
            )}
            <span>{expired(r) ? 'Expired' : 'Valid until'}</span>
            <span>{day(q.validUntil)}</span>
          </div>
          {expired(r) && <span className={b.reqWarn}>This quote has expired. Ask for changes and we’ll send an updated one.</span>}
          <div className={b.reqBtns}>
            {!expired(r) && (
              <button type="button" className={b.reqGold} disabled={Boolean(busy)} onClick={() => act('approve-quote')}>
                {busy === 'approve-quote' ? 'Approving…' : `Approve quote · ${money(q.total)}`}
              </button>
            )}
            <button type="button" className={b.reqLight} aria-expanded={open === 'changes'} disabled={Boolean(busy)} onClick={() => setOpen(open === 'changes' ? '' : 'changes')}>
              Ask for changes
            </button>
            <button type="button" className={b.reqText2} aria-expanded={open === 'decline'} disabled={Boolean(busy)} onClick={() => setOpen(open === 'decline' ? '' : 'decline')}>
              Decline
            </button>
          </div>
          {open && (
            <div className={b.reqAsk}>
              <label className={b.reqField}>
                {open === 'changes' ? 'What should we change? Quantity, sizes, price, timing…' : 'Why are you declining? (optional)'}
                <textarea rows={3} maxLength={1000} value={note} autoFocus onChange={(e) => setNote(e.target.value)} />
              </label>
              <div className={b.reqBtns}>
                <button
                  type="button"
                  className={b.reqDark}
                  disabled={Boolean(busy) || (open === 'changes' && !note.trim())}
                  onClick={() => act(open === 'changes' ? 'ask-changes' : 'decline', { note: note.trim() })}
                >
                  {busy ? 'Sending…' : open === 'changes' ? 'Send to our team' : 'Decline quote'}
                </button>
                <button type="button" className={b.reqText2} onClick={() => setOpen('')}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!expired(r) && <span className={b.reqFine}>Approving starts production. We’ll send the invoice and a final proof by e-mail.</span>}
        </div>
      )}

      {(r.status === 'in-production' || r.status === 'shipped') && (
        <div className={b.reqNoteGreen}>
          {r.approvedAt ? `Approved ${day(r.approvedAt)}` : 'Approved'}
          {q ? ` · ${money(q.total)}` : ''}.{' '}
          {r.status === 'in-production' ? `It’s being made${q?.lead ? `, ready in ${q.lead}` : ''}. We’ll e-mail you the tracking when it ships.` : `Shipped ${r.shipping ? day(r.shipping.shippedAt) : ''}.`}
        </div>
      )}

      {r.status === 'shipped' && r.shipping && (
        <div className={b.reqTrack}>
          <span className={b.reqWho}>TRACKING</span>
          {r.shipping.boxes.map((x, i) => (
            <span key={i} className={b.reqBox}>
              <span>
                Box {i + 1} of {r.shipping!.boxes.length} · {x.carrier} · {x.number}
              </span>
              {TRACK_URLS[x.carrier] && (
                <a href={TRACK_URLS[x.carrier] + encodeURIComponent(x.number)} target="_blank" rel="noopener noreferrer">
                  Track ↗
                </a>
              )}
            </span>
          ))}
        </div>
      )}

      {closed && <div className={b.reqNote}>{r.reply?.kind === 'declined' ? `You declined this quote ${day(r.reply.at)}.` : 'This request is closed. Contact us if you’d like to pick it up again.'}</div>}
      {error && (
        <span className={b.reqWarn} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
