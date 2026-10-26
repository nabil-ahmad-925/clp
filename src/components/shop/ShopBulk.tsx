'use client';
/* eslint-disable @next/next/no-img-element -- the partner's or guest's own logo (their upload), shown as it is. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { LuBox, LuFactory, LuPalette, LuShapes, LuTag } from 'react-icons/lu';
import { createPortal } from 'react-dom';
import BecomePartner from '@/components/partners/BecomePartner';
import { type ResultsView } from '@/components/ui/ViewToggle';
import {
  CUSTOM_ITEM,
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
  myDesigns,
  sendGuestQuote,
  uploadGuestImage,
  type BulkItem,
  type BulkKind,
  type BulkRequest,
  type RequestAction,
  type RequestActionInput,
} from '@/content/bulk';
import { uploadImage } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import { SRC, WS_BRANDS, WS_CATS, WS_DECOS, WS_ITEMS, WS_SOURCES, wsItem, type WsItem, type WsSource } from '@/content/wholesale';
import Mockup, { mockupPng, saveFile } from './Mockup';
import PartnerSignIn from './PartnerSignIn';
import { BrandAssetsBar } from './BrandAssets';
import WholesaleCard, { CustomCard } from './WholesaleCard';
import WholesaleItem from './WholesaleItem';
import WholesaleRequests, { needsYou as wsNeedsYou } from './WholesaleRequests';
import { useWholesale } from './wholesaleStore';
import { ListToolbar, ShopSearch, nextQuery, titleCase, type ListChip } from './shopListing';
import { imageDataUrl, useStudio, type StudioBrand } from './useStudio';
import b from './bulk.module.css';
import s from './shop.module.css';
import w from './wholesale.module.css';

/** The bulk tiles' colours (a partner's brand colours first, when they have any). */
const DEFAULT_SWATCHES = ['#111111', '#FFFFFF', '#0B2A5B', '#7A1F2B', '#1D6363', '#C8102E', '#2E7D32', '#DCBD7D'];
/** A request without a design (sent before guests could add their logo) in the requests list. */
const GUEST_FILL = '#1F2A44';

/** Wholesale's sorts (the board's), in the site's sort menu. */
type WsSort = 'rec' | 'fast' | 'low' | 'high' | 'az';
const WS_SORTS: { value: WsSort; label: string }[] = [
  { value: 'rec', label: 'Recommended' },
  { value: 'fast', label: 'Ships Fastest' },
  { value: 'low', label: 'Price: Low to High' },
  { value: 'high', label: 'Price: High to Low' },
  { value: 'az', label: 'A–Z' },
];

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
    const query = nextQuery(params.toString(), next);
    const href = `${window.location.pathname}${query ? `?${query}` : ''}`;
    if (step) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  };
  const [reqsOpen, setReqsOpen] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const reqs = useRequests(partner, !studio.loading);
  const ws = useWholesale();
  const topRef = useRef<HTMLElement>(null);
  const [newFolder, setNewFolder] = useState('');

  // The catalog's search, filters, sort and view live in the address.
  const q = get('q');
  const loc = get('loc');
  const f = { cat: get('wcat'), src: get('src'), brand: get('brand'), deco: get('deco'), stock: get('stock') };
  const sort: WsSort = WS_SORTS.some((o) => o.value === get('sort')) ? (get('sort') as WsSort) : 'rec';
  const view: ResultsView = get('cards') === 'list' ? 'list' : 'grid';
  const words = q.toLowerCase();
  const passWith = (ff: typeof f, i: WsItem) =>
    (!words || `${i.name} ${i.cat} ${i.brand} ${i.deco.join(' ')} ${SRC[i.src]}`.toLowerCase().includes(words)) &&
    (!ff.cat || i.cat === ff.cat) &&
    (!ff.src || i.src === ff.src) &&
    (!ff.brand || i.brand === ff.brand) &&
    (!ff.deco || i.deco.includes(ff.deco)) &&
    (!ff.stock || i.stock === ff.stock);
  const pass = (i: WsItem) => passWith(f, i);
  const sorter = (x: WsItem, y: WsItem) =>
    sort === 'low' ? x.price - y.price : sort === 'high' ? y.price - x.price : sort === 'fast' ? (x.stock === 'in' ? 0 : 1) - (y.stock === 'in' ? 0 : 1) : sort === 'az' ? x.name.localeCompare(y.name) : 0;
  const items = WS_ITEMS.filter(pass).sort(sorter);
  // How many a filter's choice would show (the dropdown's counts and "Show N results").
  const countWith = (k: keyof typeof f, v: string) => WS_ITEMS.filter((i) => passWith({ ...f, [k]: v }, i)).length;
  const any = Boolean(q || loc || Object.values(f).some(Boolean));
  const favCount = WS_ITEMS.filter((i) => ws.isFav(i.id)).length;
  const hrefOf = (it: WsItem) => shopHref({ view: 'bulk', item: it.id });
  const keyOf = (k: keyof typeof f) => (k === 'cat' ? 'wcat' : k);
  // The board's filters (Products, Source, Brand, Decoration, Availability) in the site's filter dropdowns.
  const chip = (k: keyof typeof f, name: string, heading: string, icon: ReactNode, plural: string, options: [string, string][]): ListChip => ({
    id: k,
    name,
    heading,
    icon,
    plural,
    options: options.map(([value, label]) => ({ value, label, count: countWith(k, value) })),
    value: f[k],
    onChange: (v) => set({ [keyOf(k)]: v }),
    count: (v) => countWith(k, v),
  });
  const chips = [
    chip('cat', 'All Products', 'Product Type', <LuShapes />, 'products', WS_CATS.map((x) => [x, x])),
    chip('src', 'All Sources', 'Source', <LuFactory />, 'sources', (Object.keys(SRC) as WsSource[]).map((k) => [k, SRC[k]])),
    chip('brand', 'All Brands', 'Brand', <LuTag />, 'brands', WS_BRANDS.map((x) => [x, x])),
    chip('deco', 'All Decorations', 'Decoration', <LuPalette />, 'decorations', WS_DECOS.map((x) => [x, x])),
    chip('stock', 'All Availability', 'Availability', <LuBox />, 'options', [
      ['in', 'In Stock · Ships Fast'],
      ['mto', 'Made to Order'],
    ]),
  ];

  const reqTitle = partner ? 'My Designs' : 'My Quote Requests';
  const drawers = (
    <>
      {reqsOpen && (
        <Requests
          title={reqTitle}
          partner={partner}
          items={reqs.items}
          onChange={(r) => reqs.setItems((list) => list.map((x) => (x.id === r.id ? r : x)))}
          onClose={() => setReqsOpen(false)}
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

  // An item's own page: a Wholesale item, or the fully custom request.
  const itemId = get('item');
  if (itemId) {
    const wsIt = wsItem(itemId);
    const it = wsIt ? undefined : bulkItem(itemId);
    return (
      <div className={b.bulk}>
        {wsIt ? (
          <>
            <section className={s.thinBand} data-header-tone="light" />
            <WholesaleItem key={wsIt.id} item={wsIt} studio={studio} ws={ws} loc={loc} onSent={(r) => reqs.setItems((list) => [r, ...list.filter((x) => x.id !== r.id)])} onShowRequests={() => router.push(shopHref({ view: 'bulk', reqs: '1' }))} />
          </>
        ) : it ? (
          <BulkItemPage
            key={it.id}
            item={it}
            studio={studio}
            swatches={DEFAULT_SWATCHES}
            loc={loc}
            onBack={() => router.push(shopHref({ view: 'bulk', loc }))}
            onSent={(r) => reqs.setItems((list) => [r, ...list.filter((x) => x.id !== r.id)])}
            onShowRequests={() => router.push(shopHref({ view: 'bulk', reqs: '1' }))}
            onSignIn={() => setSignIn(true)}
          />
        ) : (
          <>
            <section className={s.thinBand} data-header-tone="light" />
            <div className={`${s.section} ${s.spacedSm}`}>
              <div className={s.empty}>
                This item isn&rsquo;t in the catalog anymore.
                <Link href={shopHref({ view: 'bulk' })} className={s.btnDark}>
                  Back to Wholesale
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

  // Favorites (the board's): the folders on the side, the saved items in the one picked.
  // Quote Requests (the board's page): from the button, the item pages and the e-mails' links (?requests=1).
  if (get('reqs') === '1' || get('requests') === '1') {
    return (
      <div className={b.bulk}>
        <section className={s.thinBand} data-header-tone="light" />
        <div className={w.subBar}>
          <Link href={shopHref({ view: 'bulk' })} className={w.backLink}>
            ← Back to Wholesale
          </Link>
        </div>
        <WholesaleRequests items={reqs.items} partner={partner} ws={ws} onChange={(r) => reqs.setItems((list) => list.map((x) => (x.id === r.id ? r : x)))} onSaved={() => setReqsOpen(true)} />
        {drawers}
      </div>
    );
  }

  if (get('favs') === '1') {
    const fsel = get('fsel') || 'all';
    const nIn = (fid: string) => WS_ITEMS.filter((i) => (ws.favs[i.id] ?? []).includes(fid)).length;
    const fItems = WS_ITEMS.filter((i) => ws.isFav(i.id) && (fsel === 'all' || (ws.favs[i.id] ?? []).includes(fsel)));
    const fName = fsel === 'all' ? 'All saved' : (ws.folders.find((x) => x.id === fsel)?.name ?? 'Folder');
    const addFolder = () => {
      const n = newFolder.trim();
      if (!n) return;
      const id = `f${Date.now()}`;
      ws.update((st) => ({ folders: [...st.folders, { id, name: n.slice(0, 40) }] }));
      setNewFolder('');
      set({ fsel: id });
    };
    return (
      <div className={b.bulk}>
        <section className={s.thinBand} data-header-tone="light" />
        <div className={w.subBar}>
          <Link href={shopHref({ view: 'bulk' })} className={w.backLink}>
            ← Back to Wholesale
          </Link>
        </div>
        <section className={w.favs}>
          <aside className={w.favSide}>
            <h2>Favorites</h2>
            {[{ id: 'all', name: 'All saved', n: favCount }, ...ws.folders.map((x) => ({ id: x.id, name: x.name, n: nIn(x.id) }))].map((x) => (
              <button key={x.id} type="button" aria-pressed={fsel === x.id} onClick={() => set({ fsel: x.id === 'all' ? '' : x.id })}>
                <span>{x.name}</span>
                <span>{x.n}</span>
              </button>
            ))}
            <span className={w.favNew}>
              <input value={newFolder} maxLength={40} aria-label="New folder name" placeholder="New folder name" onChange={(e) => setNewFolder(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFolder()} />
              <button type="button" onClick={addFolder}>
                Add
              </button>
            </span>
          </aside>
          <div className={w.favMain}>
            <div className={w.favHead}>
              <span>
                <span className={w.kicker}>FOLDER</span>
                <strong>{fName}</strong>
                <span>
                  {fItems.length} {fItems.length === 1 ? 'item' : 'items'}
                  {fsel === 'all' ? ` across ${ws.folders.length} folders` : ''}
                </span>
              </span>
              {fItems.length > 0 && (
                <Link href={shopHref({ view: 'bulk', item: 'custom' })} className={w.favQuote}>
                  Request a Quote for This Folder
                </Link>
              )}
            </div>
            {fItems.length ? (
              <div className={w.favGrid}>
                {fItems.map((i) => (
                  <WholesaleCard key={i.id} item={i} href={hrefOf(i)} ws={ws} />
                ))}
              </div>
            ) : (
              <div className={w.empty}>
                <strong>Nothing saved here yet</strong>
                <span>Tap the heart on any item to save it to this folder.</span>
                <span className={w.emptyBtns}>
                  <Link href={shopHref({ view: 'bulk' })}>Browse Wholesale</Link>
                </span>
              </div>
            )}
          </div>
        </section>
        {drawers}
      </div>
    );
  }

  return (
    <div className={b.bulk}>
      <section className={b.hero} data-header-tone="light">
        <div className={b.heroInner}>
          <div className={s.headCenter}>
            <h1 className={b.heroTitle}>Outfit Your Team, Staff or Event</h1>
            <p className={b.heroText}>Name brands, made-for-you items and distributor partner stock. See your logo on everything before you order.</p>
            {/* The breadcrumb under the line, as the shop's lists (the gallery's). */}
            <nav className={s.bandCrumbs} aria-label="Breadcrumb">
              <Link href={shopHref()}>Shop</Link>
              <span className={s.bandCrumbSep} aria-hidden>
                ›
              </span>
              <span aria-current="page">Wholesale</span>
            </nav>
          </div>
        </div>
      </section>
      <ShopSearch q={q} loc={loc} places={[]} placeholder="Search jerseys, socks, tents, medals…" label="Wholesale" onSearch={(nq, nloc) => set({ q: nq, loc: nloc })} />

      <section ref={topRef} className={`${b.wrap} ${w.catalog}`} data-listing="">
        <BrandAssetsBar studio={studio} ws={ws} />
        {!any && (
          <div className={w.sources}>
            {WS_SOURCES.map(([k, kicker, desc]) => (
              <button key={k} type="button" className={w.source} onClick={() => set({ src: k })}>
                <span>
                  <span className={w.kicker}>{kicker}</span>
                  <span>{WS_ITEMS.filter((i) => i.src === k).length} items</span>
                </span>
                <strong>{SRC[k]}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        )}
        <ListToolbar
          chips={chips}
          sort={{ value: sort, options: WS_SORTS, onChange: (v) => set({ sort: v === 'rec' ? '' : v }) }}
          view={view}
          onView={(v) => set({ cards: v === 'list' ? 'list' : '' })}
        />
        <div className={w.countRow}>
          <span className={w.count}>
            <strong>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </strong>{' '}
            {f.src ? `from ${SRC[f.src as WsSource].toLowerCase()}` : 'across brands, makers and distributor partners'}
            {loc ? ` · shipping to ${loc}` : ''}
          </span>
          <span className={w.countBtns}>
          <Link href={shopHref({ view: 'bulk', favs: '1' })} className={w.favBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#B03A2E" aria-hidden>
              <path d="M12 21 3.5 12.7A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.7z" />
            </svg>
            Favorites
            <span>{favCount}</span>
          </Link>
          <Link href={shopHref({ view: 'bulk', reqs: '1' })} className={w.favBtn}>
            Quote Requests
            <span data-alert={reqs.items.some(wsNeedsYou)}>{reqs.items.filter((r) => r.kind !== 'saved').length}</span>
          </Link>
          </span>
        </div>
      </section>

      <section className={b.gridWrap} data-listing="">
        {items.length === 0 ? (
          <div className={w.empty}>
            <strong>{q ? `We don’t list “${q}” yet` : 'Nothing matches yet'}</strong>
            <span>Try fewer filters, or tell us what you need. Our makers can build almost anything to order.</span>
            <span className={w.emptyBtns}>
              <button type="button" onClick={() => set({ q: '', loc: '', wcat: '', src: '', brand: '', deco: '', stock: '' })}>
                Clear Filters
              </button>
              <Link href={shopHref({ view: 'bulk', item: 'custom' })}>Have Us Find It</Link>
            </span>
          </div>
        ) : view === 'list' ? (
          <div className={w.list}>
            {items.map((it) => (
              <WholesaleCard key={it.id} item={it} href={hrefOf(it)} ws={ws} list />
            ))}
          </div>
        ) : (
          <div className={w.grid}>
            {items.map((it) => (
              <WholesaleCard key={it.id} item={it} href={hrefOf(it)} ws={ws} />
            ))}
            <CustomCard href={shopHref({ view: 'bulk', item: 'custom' })} />
          </div>
        )}
      </section>

      {/* How it works: a centred heading over four numbered steps, joined by a line. */}
      <section className={b.howWrap}>
        <div className={b.how}>
          <div className={b.howHead}>
            <h2 className={b.howTitle}>{partner ? 'Design to Doorstep' : 'Request, Quote, Deliver'}</h2>
            <p className={b.howText}>Every order is quoted direct from manufacturing, with options from value to premium so you get the best fit.</p>
            <span className={s.kicker}>HOW IT WORKS</span>
          </div>
          <ol className={b.steps}>
            {(
              [
                ['Browse & Save', 'Filter by brand, maker or what’s in stock. Save items into folders for each team or event.'],
                ['See Your Logo on It', 'Pick a logo from your approved brand assets or upload new art. Every item previews instantly.'],
                ['Approve, Order or Quote', 'New artwork gets a quick check. In-stock items order right away, and everything else gets a quote.'],
                ['We Make It', 'The CLP team or a maker partner gets print-ready artwork, sends a proof and ships it.'],
              ] as const
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
          <Link href={shopHref({ view: 'bulk', loc })}>Wholesale</Link>
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
                    ['front', 'Front Center'],
                    ['chest', 'Left Chest'],
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
                    {busy === 'logo' ? 'Adding…' : studio.logo ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onLogo} />
                  <button type="button" className={b.sampleBtn} onClick={studio.trySample}>
                    Try Sample
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
                {downloaded ? 'Downloaded ✓' : 'Download Mockup'}
              </button>
              {!partner && (
                <div className={b.partnerBox}>
                  <span className={b.partnerBoxKicker}>FOR CLP PARTNERS</span>
                  <strong>The full design studio is for approved partners</strong>
                  <span>Approved CLP partners also get templates, patterns, print locations, saved designs and partner pricing.</span>
                  <span className={b.partnerBoxLinks}>
                    <BecomePartner className={b.goldBtn}>Apply to become a partner</BecomePartner>
                    <button type="button" onClick={onSignIn}>
                      Partner Sign In
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
                {partner ? 'My Designs' : 'My Quote Requests'}
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
                      Open the Full Design Studio →
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
                    {busy === 'saved' ? 'Saving…' : saved ? 'Saved ✓' : 'Save Design'}
                  </button>
                  <button type="button" className={b.btnLight} disabled={Boolean(busy)} onClick={() => send('quote')}>
                    {busy === 'quote' ? 'Sending…' : 'Get a Quote'}
                  </button>
                  <button type="button" className={b.btnDark} disabled={Boolean(busy)} onClick={() => send('order')}>
                    {busy === 'order' ? 'Placing…' : 'Buy Now'}
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
                    {busy ? 'Sending…' : 'Send Quote Request'}
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
            Keep Browsing
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
              {busy === 'new-artwork' ? 'Sending…' : 'Upload a New File'}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={sendFile} />
          </div>
          <label className={b.reqField}>
            Or paste a link to a vector file (AI, EPS, SVG, PDF)
            <span className={b.reqLinkRow}>
              <input type="url" inputMode="url" placeholder="https://" value={link} maxLength={490} onChange={(e) => setLink(e.target.value)} />
              <button type="button" className={b.reqLight} disabled={Boolean(busy) || !link.trim()} onClick={() => act('new-artwork', { link: link.trim(), note: note.trim() })}>
                Send Link
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
              Ask for Changes
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
                  {busy ? 'Sending…' : open === 'changes' ? 'Send to Our Team' : 'Decline Quote'}
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
