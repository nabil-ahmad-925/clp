'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos and logos (their own uploads), shown as they are. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { setHeaderBrand } from '@/components/layout/headerBrand';
import { PartnerCard } from '@/components/partners/PartnerDirectory';
import t from '@/components/sections/TeamDirectory.module.css';
import Pager from '@/components/ui/Pager';
import { type ResultsView } from '@/components/ui/ViewToggle';
import { LuShapes, LuSparkles, LuUsers, LuVolleyball } from 'react-icons/lu';
import { BULK_CATEGORIES } from '@/content/bulk';
import { CART_EVENT, addToCart, cartChanged, checkoutHref, getCart, money, removeLine, setLineQty, type Cart } from '@/content/cart';
import { partnerHref, partnerType } from '@/content/partnerPages';
import { site } from '@/content/site';
import {
  SHOP_GROUPS,
  canPaint,
  exclusiveStores,
  forgetKey,
  groupById,
  groupOf,
  groupShort,
  isExclusive,
  isNewProduct,
  loadShop,
  paint,
  partnerStores,
  productHref,
  shopHref,
  shortDate,
  sportLabel,
  storeHref,
  storeKey,
  storesIn,
  typeLabel,
  unlockStore,
  type ShopData,
  type ShopProduct,
  type ShopStore,
} from '@/content/storefront';
import ShopBulk from './ShopBulk';
import ShopStudio from './ShopStudio';
import ShopTabs, { ShopTabsContext } from './shopTabs';
import { CardGrid, LIST_SIZES, ListToolbar, ProductCard, ShopSearch, ViewAll, hasWords, inPlace, storePlaces, type ListChip } from './shopListing';
import { Arrow, CategoryIcon, Chevron, LockIcon } from './shopIcons';
import s from './shop.module.css';

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];
const sortBy = (sort: Sort) => (a: ShopProduct, b: ShopProduct) =>
  sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'newest' ? (b.addedAt ?? '').localeCompare(a.addedAt ?? '') : 0;

/** How many stores the home's "Shop by partner" shows (two rows of tiles), new arrivals and exclusives (a row), stores per menu column. */
const HOME_STORES = 12;
const HOME_ROW = 4;
const MENU_STORES = 3;
/** The "Shop by partner" tabs: the store groups A to Z. */
const GROUP_TABS = [...SHOP_GROUPS].sort((a, b) => a.label.localeCompare(b.label));

/**
 * A list's settings in the address (its search, filters, sort, page, page size and grid / list), so Back returns to the
 * page a shopper left and a link opens the same list. A changed filter goes back to its first page; a new page is a
 * step Back undoes.
 */
function useAddress() {
  const params = useSearchParams();
  const router = useRouter();
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
  return { get, set };
}

/** A page size of the address, the smallest when it names none of the list sizes. */
const sizeOf = (asked: string) => ((LIST_SIZES as readonly number[]).includes(Number(asked)) ? Number(asked) : LIST_SIZES[0]);

type Nav = 'home' | 'partners' | 'exclusives' | 'new' | 'bulk' | '';

/**
 * The shop (/shop/, the "Shop" design), under the site header co-branded "CLP │ SHOP" with the cart. The address says
 * what shows: the home; ?view=partners[&group=] (every store, by group); ?view=exclusives[&sport=|&drop=] (CLP's own);
 * ?view=new (new arrivals); ?view=search&q=&group= (a search); ?view=bulk (Bulk & Operations) and ?view=studio&item=
 * (its design studio, partners); ?store=<slug>[&key=<invite>] (a store; a private one behind its password) and
 * &product=<id> (a product). The cart drawer checks out the whole cart (/checkout/).
 */
export default function ShopView() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ShopData | null>(null);
  const [failed, setFailed] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    loadShop().then(
      (d) => live && setData(d),
      () => live && setFailed(true),
    );
    getCart().then(
      (c) => live && setCart(c),
      () => {},
    );
    const onChange = (e: Event) => setCart((e as CustomEvent<Cart>).detail);
    window.addEventListener(CART_EVENT, onChange);
    return () => {
      live = false;
      window.removeEventListener(CART_EVENT, onChange);
    };
  }, []);

  const cartCount = cart?.count ?? 0;
  useEffect(() => {
    setHeaderBrand({ label: 'SHOP', shop: true, cartCount, onCart: () => setCartOpen(true) });
  }, [cartCount]);
  useEffect(() => () => setHeaderBrand(null), []);

  // The menu closes on a click outside it or Escape.
  useEffect(() => {
    if (!mega) return;
    const onDown = (e: MouseEvent) => !megaRef.current?.contains(e.target as Node) && setMega(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMega(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [mega]);

  const slug = params.get('store') ?? '';
  const productId = params.get('product') ?? '';
  const view = params.get('view') ?? '';
  const go = (href: string) => {
    setMega(false);
    router.push(href);
  };
  // Changing what shows closes the menu.
  const where = params.toString();
  const [shownWhere, setShownWhere] = useState(where);
  if (shownWhere !== where) {
    setShownWhere(where);
    setMega(false);
  }

  const store = data?.stores.find((x) => x.slug === slug);
  const active: Nav = productId
    ? 'home'
    : slug
      ? store?.shop.exclusive
        ? 'exclusives'
        : 'partners'
    : view === 'partners'
      ? 'partners'
      : view === 'exclusives' || view === 'new' || view === 'bulk' || view === 'studio'
        ? view === 'studio'
          ? 'bulk'
          : view
        : view
          ? ''
          : 'home';

  // The tabs sit under each view's heading; on top only where there is none (a product, a message, the design studio).
  const bulkItem = view === 'bulk' && Boolean(params.get('item'));
  const tabsBelow = !failed && view !== 'studio' && !bulkItem && !productId && !(slug && data && !store);
  const tabs: { id: Nav; label: string; href?: string }[] = [
    { id: 'home', label: 'Shop', href: shopHref() },
    { id: 'partners', label: 'Shop by Partner' },
    { id: 'exclusives', label: 'CLP Exclusives', href: shopHref({ view: 'exclusives' }) },
    { id: 'new', label: 'New Arrivals', href: shopHref({ view: 'new' }) },
    { id: 'bulk', label: 'Bulk & Operations', href: shopHref({ view: 'bulk' }) },
  ];
  const nav = (
    <section className={`${s.top} ${tabsBelow ? s.topUnder : ''}`} data-header-tone="light" ref={megaRef}>
      <nav className={s.nav} aria-label="Shop">
        {tabs.map((tab) =>
          tab.href ? (
            <Link key={tab.id} href={tab.href} className={`${s.navLink} ${active === tab.id && !mega ? s.navOn : ''}`}>
              {tab.label}
            </Link>
          ) : (
            <button key={tab.id} type="button" className={`${s.navLink} ${active === tab.id || mega ? s.navOn : ''}`} aria-expanded={mega} onClick={() => setMega(!mega)}>
              {tab.label}
              <Chevron />
            </button>
          ),
        )}
      </nav>
      {mega && data && <MegaMenu data={data} go={go} />}
    </section>
  );

  let body;
  if (view === 'bulk') body = <ShopBulk />;
  else if (view === 'studio') body = <ShopStudio key={params.get('item') ?? ''} />;
  else if (failed) body = <Notice text="The shop couldn’t load. Check your connection and try again." />;
  else if (!data) body = <Loading />;
  else if (slug && !store) body = <Notice text="This store isn’t open right now." />;
  else if (store) body = <StoreRoute key={store.slug} data={data} store={store} productId={productId} inviteKey={params.get('key') ?? ''} onViewCart={() => setCartOpen(true)} />;
  else if (view === 'partners') body = <Directory data={data} />;
  else if (view === 'exclusives') body = <Exclusives data={data} />;
  else if (view === 'new' || view === 'search') body = <Collection data={data} view={view} />;
  else body = <Home data={data} go={go} />;

  return (
    // The shop's pages are light (the header's logo dark) except the black sections, each marked light.
    <div className={s.shop} data-header-tone="dark">
      {tabsBelow ? <div className={s.headerRoom} data-header-tone="light" /> : nav}
      <ShopTabsContext.Provider value={tabsBelow ? nav : null}>{body}</ShopTabsContext.Provider>
      {cartOpen && <CartDrawer cart={cart} stores={data?.stores ?? []} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Loading() {
  return (
    <>
      <section className={`${s.hero} ${s.heroFirst}`} data-header-tone="light">
        <div className={s.heroInner}>
          <span className={`${s.skeleton} ${s.skeletonTitle}`} />
        </div>
      </section>
      <ShopTabs />
      <div className={`${s.section} ${s.spaced}`}>
        <div className={s.grid4} aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className={`${s.skeleton} ${s.skeletonTile}`} />
          ))}
        </div>
      </div>
      <div className={s.bottomSpace} />
    </>
  );
}

function Notice({ text, back }: { text: string; back?: ShopStore }) {
  return (
    <>
      <section className={s.thinBand} data-header-tone="light" />
      <div className={`${s.section} ${s.spacedSm}`}>
        <div className={s.empty}>
          <p>{text}</p>
          <Link href={back ? storeHref(back.slug) : shopHref()} className={s.btnDark}>
            {back ? `Back to ${back.name}` : 'Back to the shop'}
          </Link>
        </div>
      </div>
      <div className={s.bottomSpace} />
    </>
  );
}

/** A store's round logo: its image, else its initials (italic, the design's) on its colour. */
function StoreLogo({ store, className }: { store: Pick<ShopStore, 'color' | 'type' | 'logo' | 'mono'>; className: string }) {
  return (
    <span className={className} style={{ background: store.color || partnerType(store.type).color }}>
      {store.logo ? <img src={store.logo} alt="" /> : store.mono}
    </span>
  );
}

const storeLine = (store: ShopStore) => [store.category || typeLabel(store.type), store.area].filter(Boolean).join(' · ');
const countLabel = (n: number, word = 'item') => `${n} ${n === 1 ? word : `${word}s`}`;

function ProductGrid({ products, stores, view = 'grid' }: { products: ShopProduct[]; stores: ShopStore[]; view?: ResultsView }) {
  return (
    <CardGrid view={view}>
      {products.map((p, i) => (
        <div key={`${p.slug}-${p.id}`} className={t.listingItem}>
          <ProductCard product={p} store={stores.find((x) => x.slug === p.slug)} eager={i < 4} view={view} />
        </div>
      ))}
    </CardGrid>
  );
}

/** The exclusives' sports and drops (CLP's own products: their sport and collection). */
function exclusivesOf(data: ShopData) {
  const slugs = new Set(exclusiveStores(data.stores).map((x) => x.slug));
  const products = data.products.filter((p) => slugs.has(p.slug));
  const sports = [...new Set(products.map((p) => p.sport).filter(Boolean) as string[])];
  const drops = [...new Set(products.map((p) => p.collection).filter(Boolean))];
  return { products, sports, drops };
}

/** "Shop by Partner": a column per store group (its first stores), CLP's exclusives, then every store. */
function MegaMenu({ data, go }: { data: ShopData; go: (href: string) => void }) {
  const ex = exclusivesOf(data);
  const total = partnerStores(data.stores).length;
  return (
    <div className={s.mega}>
      <div className={s.megaCols}>
        {SHOP_GROUPS.map((g) => {
          const list = storesIn(data.stores, g.id);
          return (
            <div key={g.id} className={s.megaCol}>
              <span className={s.megaLabel}>{g.label.toUpperCase()}</span>
              {list.slice(0, MENU_STORES).map((x) => (
                <button key={x.slug} type="button" className={s.megaItem} onClick={() => go(storeHref(x.slug))}>
                  <StoreLogo store={x} className={s.megaLogo} />
                  {x.name}
                </button>
              ))}
              {list.length === 0 && <span className={s.megaNone}>Coming soon</span>}
              <button type="button" className={s.megaAll} onClick={() => go(shopHref({ view: 'partners', group: g.id }))}>
                All {g.label}
              </button>
            </div>
          );
        })}
        <div className={`${s.megaCol} ${s.megaX}`}>
          <span className={s.megaLabel}>CLP EXCLUSIVES</span>
          {ex.sports.slice(0, 3).map((sp) => (
            <button key={sp} type="button" className={s.megaText} onClick={() => go(shopHref({ view: 'exclusives', sport: sp }))}>
              {sportLabel(sp)}
            </button>
          ))}
          {ex.drops.slice(0, 3).map((d) => (
            <button key={d} type="button" className={s.megaText} onClick={() => go(shopHref({ view: 'exclusives', drop: d }))}>
              {d}
            </button>
          ))}
          <button type="button" className={s.megaAll} onClick={() => go(shopHref({ view: 'exclusives' }))}>
            All Exclusives
          </button>
        </div>
      </div>
      <div className={s.megaFoot}>
        <div className={s.megaFootInner}>
          <span>{total} official stores on CLP, A–Z</span>
          <button type="button" className={s.pillDark} onClick={() => go(shopHref({ view: 'partners' }))}>
            View All Partners <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- home */

/** Products with the stores taking turns (each store's first, then each one's second…), so a page shows many stores. */
function mixStores(products: ShopProduct[]) {
  const byStore = new Map<string, ShopProduct[]>();
  products.forEach((p) => byStore.set(p.slug, [...(byStore.get(p.slug) ?? []), p]));
  const lists = [...byStore.values()];
  const most = Math.max(0, ...lists.map((l) => l.length));
  return Array.from({ length: most }, (_, i) => lists.map((l) => l[i]).filter(Boolean)).flat();
}

/** A store as the partner listings' card (the experiences' card), leading to its store. */
function StoreCard({ store, eager, view = 'grid' }: { store: ShopStore; eager: boolean; view?: ResultsView }) {
  return (
    <PartnerCard
      partner={store}
      eager={eager}
      featured={false}
      view={view}
      href={storeHref(store.slug)}
      cta={store.shop.private && !storeKey(store.slug) ? 'Enter Password' : 'Visit Store'}
      stat={`${store.productCount} ${store.productCount === 1 ? 'Product' : 'Products'}`}
      tag={
        store.shop.private ? (
          <span className={s.privateTag}>
            <LockIcon />
            PRIVATE{store.shop.until ? ` · UNTIL ${shortDate(store.shop.until).toUpperCase()}` : ''}
          </span>
        ) : undefined
      }
    />
  );
}

function Home({ data, go }: { data: ShopData; go: (href: string) => void }) {
  const stores = storesIn(data.stores, '').slice(0, HOME_STORES);
  const publicSlugs = new Set(data.stores.filter((x) => !x.shop.private).map((x) => x.slug));
  const fresh = data.products.filter((p) => publicSlugs.has(p.slug) && !isExclusive(p, data.stores));
  // The products added in the last 30 days (as New Arrivals), newest first.
  const newItems = fresh
    .filter(isNewProduct)
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
    .slice(0, HOME_ROW);
  const exclusive = exclusivesOf(data).products.slice(0, HOME_ROW);
  const everything = mixStores(data.products.filter((p) => publicSlugs.has(p.slug)));
  return (
    <>
      <section className={`${s.hero} ${s.heroFirst}`} data-header-tone="light">
        <div className={s.heroInner}>
          <h1 className={s.heroTitle}>Shop the CLP community</h1>
          <p className={s.heroText}>Official gear from our athletes, clubs, schools and organizations, plus exclusives you can only get from CLP.</p>
        </div>
      </section>
      <ShopTabs />
      <ShopSearch
        q=""
        loc=""
        places={storePlaces(partnerStores(data.stores))}
        placeholder="Search products, athletes, clubs, schools…"
        label="Products or stores"
        onSearch={(q, loc) => go(shopHref({ view: 'search', q, loc }))}
      />

      {stores.length > 0 && (
        <section className={`${s.section} ${s.byPartner}`}>
          <div className={s.headCenter}>
            <h2 className={s.bigTitle}>Shop by partner</h2>
            <span className={s.muted}>Official stores for the athletes, clubs, schools and organizations on CLP. Every order supports them.</span>
          </div>
          {/* The stores A to Z as logo tiles: the logo, the name, its group and how many items. */}
          <div className={s.partnerTiles}>
            {stores.map((x) => (
              <Link key={x.slug} href={storeHref(x.slug)} className={s.partnerTile}>
                <StoreLogo store={x} className={s.partnerTileLogo} />
                <span className={s.partnerTileText}>
                  <strong>{x.name}</strong>
                  <span>
                    {groupShort(groupOf(x.type))} · {countLabel(x.productCount)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <ViewAll href={shopHref({ view: 'partners' })} label="View All Partners" />
        </section>
      )}

      {newItems.length > 0 && (
        <section className={`${s.section} ${s.spaced}`}>
          <div className={s.headRow}>
            <h2 className={s.rowTitle}>New arrivals</h2>
          </div>
          <ProductGrid products={newItems} stores={data.stores} />
          <ViewAll href={shopHref({ view: 'new' })} label="View All" />
        </section>
      )}

      {exclusive.length > 0 && (
        <section className={`${s.section} ${s.spaced}`}>
          <div className={s.headRow}>
            <div className={s.headStack}>
              <h2 className={s.rowTitle}>CLP Exclusives</h2>
              <span className={s.kickerDeep}>ONLY ON CLP</span>
            </div>
          </div>
          <ProductGrid products={exclusive} stores={data.stores} />
          <ViewAll href={shopHref({ view: 'exclusives' })} label="View All Exclusives" />
        </section>
      )}

      {everything.length > 0 && (
        <Products
          id="all-products"
          products={everything}
          stores={data.stores}
          title={
            <div className={s.headRow}>
              <div className={s.headStack}>
                <h2 className={s.rowTitle}>All products</h2>
                <span className={s.kickerDeep}>SHOP ALL</span>
              </div>
              <span className={s.muted}>Every item from every store on CLP, in one place.</span>
            </div>
          }
        />
      )}

      <section className={`${s.section} ${s.bulkBandWrap}`}>
        <div className={s.bulkBand}>
          <div className={s.bulkBandText}>
            <span className={s.kicker}>BULK &amp; OPERATIONS</span>
            <span className={s.bulkBandTitle}>Outfit Your Team, Staff or Event</span>
            <span className={s.bulkBandLine}>Uniforms, socks, pinnies, tents, inflatables, medals and more. Made to order with your logo and shipped in bulk.</span>
            <Link href={shopHref({ view: 'bulk' })} className={s.btnGold}>
              Start a bulk order
            </Link>
          </div>
          <div className={s.bulkBandGrid}>
            {BULK_CATEGORIES.map((c) => (
              <Link key={c.id} href={shopHref({ view: 'bulk', cat: c.id })} className={s.bulkBandCat}>
                <CategoryIcon icon={c.icon} />
                <span>{c.short}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- every store */

type StoreSort = 'az' | 'za' | 'products';
const STORE_SORTS: { value: StoreSort; label: string }[] = [
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
  { value: 'products', label: 'Most Products' },
];
const storeSortBy = (sort: StoreSort) => (a: ShopStore, b: ShopStore) =>
  sort === 'products' ? b.productCount - a.productCount || a.name.localeCompare(b.name) : sort === 'za' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);

/**
 * Shop by Partner (every store, A to Z): the shop's search (a store's name or kind, and where it is), the store group
 * filter, the sort, the grid or list of the partner listings' cards, and pages.
 */
function Directory({ data }: { data: ShopData }) {
  const { get, set } = useAddress();
  const topRef = useRef<HTMLDivElement>(null);
  const q = get('q');
  const loc = get('loc');
  const group = groupById(get('group')) ? get('group') : '';
  const g = groupById(group);
  const sort: StoreSort = STORE_SORTS.some((o) => o.value === get('sort')) ? (get('sort') as StoreSort) : 'az';
  const view: ResultsView = get('cards') === 'list' ? 'list' : 'grid';
  const per = sizeOf(get('per'));
  const all = partnerStores(data.stores);
  const searched = all.filter((x) => inPlace(x, loc) && hasWords([x.name, x.short, x.category, x.area, typeLabel(x.type)].join(' '), q));
  const inGroup = (grp: string) => searched.filter((x) => !grp || groupOf(x.type).id === grp);
  const stores = inGroup(group).sort(storeSortBy(sort));
  const pageCount = Math.max(1, Math.ceil(stores.length / per));
  const page = Math.min(Math.max(0, (Number(get('page')) || 1) - 1), pageCount - 1);
  const onPage = stores.slice(page * per, page * per + per);
  const name = g ? g.label : 'All Partners';
  const groupChip: ListChip = {
    id: 'group',
    name: 'All Partners',
    heading: 'Partner Type',
    icon: <LuUsers />,
    plural: 'types',
    options: GROUP_TABS.map((x) => ({ value: x.id, label: x.label, count: inGroup(x.id).length })),
    value: group,
    onChange: (v) => set({ group: v }),
    count: (v) => inGroup(v).length,
  };
  return (
    <>
      <ListBand
        crumb="Shop by Partner"
        name={name}
        kicker="SHOP BY PARTNER"
        sub={g ? 'Pick a store to shop their official gear. Every order supports them.' : 'Every official store on CLP, A to Z. Every order supports them.'}
      />
      <ShopSearch q={q} loc={loc} places={storePlaces(all)} placeholder="Search athletes, clubs, schools, organizations…" label="Store" onSearch={(nq, nloc) => set({ q: nq, loc: nloc })} onGrey />
      <div className={s.listingBand} data-listing="">
        <section ref={topRef} className={`${s.section} ${s.list}`}>
          <ListToolbar chips={[groupChip]} sort={{ value: sort, options: STORE_SORTS, onChange: (v) => set({ sort: v === 'az' ? '' : v }) }} view={view} onView={(v) => set({ cards: v === 'list' ? 'list' : '', page: get('page') })} />
          {stores.length === 0 ? (
            <p className={s.empty}>No stores match. Try other words, another place or another partner type.</p>
          ) : (
            <>
              <CardGrid view={view}>
                {onPage.map((x, i) => (
                  <div key={x.slug} className={t.listingItem}>
                    <StoreCard store={x} eager={i < 4} view={view} />
                  </div>
                ))}
              </CardGrid>
              {stores.length > LIST_SIZES[0] && (
                <div data-listing className={s.pager}>
                  <Pager
                    page={page}
                    pageCount={pageCount}
                    total={stores.length}
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
            </>
          )}
        </section>
      </div>
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- products: filters, sort, grid or list, pages */

/** A filter of a product list besides its category (CLP Exclusives' sport and drop), its value in the address by `id`. */
type ProductFilter = Omit<ListChip, 'options' | 'value' | 'onChange' | 'count'> & {
  options: { value: string; label: string }[];
  test: (p: ShopProduct, value: string) => boolean;
};

/**
 * Products with the experiences' bar (All Categories and any other filters, the sort, grid or list) and pages (rows of
 * four). Its settings live in the address (?category=&sort=&page=&per=&cards=, and each filter's own).
 */
function Products({ products, stores, filters = [], title, id }: { products: ShopProduct[]; stores: ShopStore[]; filters?: ProductFilter[]; title?: ReactNode; id?: string }) {
  const { get, set } = useAddress();
  const topRef = useRef<HTMLElement>(null);
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const all: ProductFilter[] = [
    { id: 'category', name: 'All Categories', heading: 'Category', icon: <LuShapes />, plural: 'categories', options: cats.map((c) => ({ value: c, label: c })), test: (p, v) => p.category === v },
    ...filters,
  ];
  const values = Object.fromEntries(all.map((f) => [f.id, f.options.some((o) => o.value === get(f.id)) ? get(f.id) : '']));
  const matching = (vals: Record<string, string>) => products.filter((p) => all.every((f) => !vals[f.id] || f.test(p, vals[f.id])));
  const sort: Sort = SORTS.some((o) => o.value === get('sort')) ? (get('sort') as Sort) : 'featured';
  const view: ResultsView = get('cards') === 'list' ? 'list' : 'grid';
  const per = sizeOf(get('per'));
  const shown = matching(values).sort(sortBy(sort));
  const pageCount = Math.max(1, Math.ceil(shown.length / per));
  const page = Math.min(Math.max(0, (Number(get('page')) || 1) - 1), pageCount - 1);
  const onPage = shown.slice(page * per, page * per + per);
  const chips: ListChip[] = all.map((f) => ({
    ...f,
    options: f.options.map((o) => ({ ...o, count: matching({ ...values, [f.id]: o.value }).length })),
    value: values[f.id],
    onChange: (v) => set({ [f.id]: v }),
    count: (v) => matching({ ...values, [f.id]: v }).length,
  }));

  return (
    <div className={s.listingBand} data-listing="">
      <section ref={topRef} id={id} className={`${s.section} ${s.products} ${title ? s.productsHome : ''}`}>
        {title}
        <ListToolbar chips={chips} sort={{ value: sort, options: SORTS, onChange: (v) => set({ sort: v === 'featured' ? '' : v }) }} view={view} onView={(v) => set({ cards: v === 'list' ? 'list' : '', page: get('page') })} />
        {shown.length === 0 ? (
          <p className={s.empty}>{products.length ? 'No products match. Try another filter.' : 'No products here yet.'}</p>
        ) : (
          <>
            <ProductGrid products={onPage} stores={stores} view={view} />
            {shown.length > LIST_SIZES[0] && (
              <div data-listing className={s.pager}>
                <Pager
                  page={page}
                  pageCount={pageCount}
                  total={shown.length}
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
          </>
        )}
      </section>
    </div>
  );
}

/** A list's black heading (new arrivals, a search, CLP Exclusives): breadcrumb, Playfair title, line and kicker. */
function ListBand({ crumb, name, kicker, sub }: { crumb: string; name: string; kicker: string; sub: string }) {
  return (
    <>
      <section className={s.band} data-header-tone="light">
        <div className={`${s.bandInner} ${s.bandList}`}>
          <nav className={s.crumbs} aria-label="Breadcrumb">
            <Link href={shopHref()}>Shop</Link>
            {'  ›  '}
            {crumb}
            {'  ›  '}
            {name}
          </nav>
          <div className={s.headCenter}>
            <h1 className={s.listTitle}>{name}</h1>
            <p className={s.heroText}>{sub}</p>
            <span className={s.kicker}>{kicker}</span>
          </div>
        </div>
      </section>
      <ShopTabs />
    </>
  );
}

/** A product's words for the search: its own, and its store's name and kind. */
const productText = (p: ShopProduct, st?: ShopStore) => [p.title, p.category, p.collection, p.description, st?.name, st?.short, st?.category, typeLabel(st?.type ?? '')].join(' ');

/**
 * New Arrivals (the public stores' products added in the last 30 days, newest first) or a search of every public
 * product: the shop's search, then the list.
 */
function Collection({ data, view }: { data: ShopData; view: string }) {
  const { get, set } = useAddress();
  const q = get('q');
  const loc = get('loc');
  const g = groupById(get('group'));
  const storeOf = (p: ShopProduct) => data.stores.find((x) => x.slug === p.slug);
  const publicProducts = data.products.filter((p) => !storeOf(p)?.shop.private);
  const products = publicProducts
    .filter((p) => {
      const st = storeOf(p);
      if (g && (!st || st.shop.exclusive || groupOf(st.type).id !== g.id)) return false;
      if (view === 'new' && !isNewProduct(p)) return false;
      return inPlace(st, loc) && hasWords(productText(p, st), q);
    })
    .sort((a, b) => (view === 'new' ? (b.addedAt ?? '').localeCompare(a.addedAt ?? '') : 0));
  const name = view === 'new' ? 'New Arrivals' : q ? `“${q}”` : loc ? `Near ${loc}` : g ? g.label : 'All Products';
  return (
    <>
      <ListBand
        crumb={view === 'new' ? 'Collections' : g ? 'Shop by Partner' : 'Search'}
        name={name}
        kicker={view === 'new' ? 'JUST DROPPED' : g ? 'SHOP BY PARTNER' : 'SEARCH'}
        sub={view === 'new' ? 'The latest from CLP and our partners.' : g ? `Every store for ${g.label.toLowerCase()} on CLP.` : 'Products across the CLP shop.'}
      />
      <ShopSearch
        q={q}
        loc={loc}
        places={storePlaces(partnerStores(data.stores))}
        placeholder="Search products, athletes, clubs, schools…"
        label="Products or stores"
        onSearch={(nq, nloc) => set({ q: nq, loc: nloc })}
        onGrey
      />
      <Products products={products} stores={data.stores} />
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- CLP Exclusives */

/** CLP Exclusives (CLP's own products): the shop's search, then the list with its sport and drop filters. */
function Exclusives({ data }: { data: ShopData }) {
  const { get, set } = useAddress();
  const q = get('q');
  const ex = exclusivesOf(data);
  const storeOf = (p: ShopProduct) => data.stores.find((x) => x.slug === p.slug);
  const products = ex.products.filter((p) => hasWords(productText(p, storeOf(p)), q));
  const filters: ProductFilter[] = [
    {
      id: 'sport',
      name: 'All Sports',
      heading: 'Sport',
      icon: <LuVolleyball />,
      plural: 'sports',
      options: ex.sports.map((sp) => ({ value: sp, label: sportLabel(sp) })).sort((a, b) => a.label.localeCompare(b.label)),
      test: (p, v) => p.sport === v,
    },
    {
      id: 'drop',
      name: 'All Drops',
      heading: 'Drop or Collection',
      icon: <LuSparkles />,
      plural: 'drops',
      options: ex.drops.map((d) => ({ value: d, label: d })).sort((a, b) => a.label.localeCompare(b.label)),
      test: (p, v) => p.collection === v,
    },
  ];
  return (
    <>
      <ListBand crumb="Collections" name="CLP Exclusives" kicker="ONLY ON CLP" sub="The Footprints Collection and everything made by Compete Like Pros." />
      <ShopSearch q={q} loc="" places={[]} placeholder="Search CLP Exclusives…" label="Products" onSearch={(nq) => set({ q: nq })} onGrey={ex.products.length > 0} />
      {ex.products.length === 0 ? (
        <section className={`${s.section} ${s.products}`}>
          <p className={s.empty}>CLP Exclusives are on their way. Check back soon.</p>
        </section>
      ) : (
        <Products products={products} stores={data.stores} filters={filters} />
      )}
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- a store (and its products) */

/** "Copy link" for the page: "Link copied ✓" for a moment. */
/** Copies the page's link (or `path`'s, a product's on the shop), never a private store's invite key. */
function useShare(path?: string) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = path ? new URL(path, window.location.origin).href : window.location.href.replace(/([?&])key=[^&]*&?/, '$1').replace(/[?&]$/, '');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Not allowed: nothing to show.
    }
  };
  return { copied, share };
}

/**
 * A store's address: a private one asks for its password (or opens with its invite link's key), then shows; a product
 * of it opens on its own page.
 */
function StoreRoute({ data, store, productId, inviteKey, onViewCart }: { data: ShopData; store: ShopStore; productId: string; inviteKey: string; onViewCart: () => void }) {
  const [unlocked, setUnlocked] = useState<ShopProduct[] | null>(null);
  // A private store opens with the invite link's key, or the one this browser kept (checked first).
  const [secret] = useState(() => (store.shop.private ? inviteKey || storeKey(store.slug) : ''));
  const [checking, setChecking] = useState(Boolean(secret));
  const key = store.shop.private ? storeKey(store.slug) : '';

  useEffect(() => {
    if (!secret) return;
    let live = true;
    unlockStore(store.slug, { key: secret }).then(
      (products) => {
        if (!live) return;
        setUnlocked(products);
        setChecking(false);
        // The key leaves the address (it's kept in this browser).
        if (inviteKey) window.history.replaceState(null, '', storeHref(store.slug) + (productId ? `&product=${encodeURIComponent(productId)}` : ''));
      },
      () => {
        if (!live) return;
        forgetKey(store.slug);
        setChecking(false);
      },
    );
    return () => {
      live = false;
    };
  }, [secret, store.slug, inviteKey, productId]);

  if (store.shop.private && checking) return <Loading />;
  if (store.shop.private && !unlocked) return <Gate store={store} onOpen={setUnlocked} />;
  const full = { ...store, products: store.shop.private ? (unlocked ?? []) : store.products };
  if (productId) {
    const product = full.products.find((p) => p.id === productId);
    if (!product) return <Notice text="This product isn’t for sale anymore." back={store} />;
    return <ProductPage key={product.id} data={data} store={full} product={product} storeKey={key || storeKey(store.slug)} onViewCart={onViewCart} />;
  }
  return <StorePage data={data} store={full} />;
}

/** A private store's gate: its password (from the invite), or the invite link (which unlocks it at once). */
function Gate({ store, onOpen }: { store: ShopStore; onOpen: (products: ShopProduct[]) => void }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setBusy(true);
    setError(false);
    try {
      onOpen(await unlockStore(store.slug, { password: pw.trim() }));
    } catch {
      setError(true);
      setBusy(false);
    }
  };
  return (
    <>
    <section className={s.gate} data-header-tone="light">
      {store.hero && <img className={s.gateCover} src={store.hero} alt="" />}
      <div className={s.gateInner}>
        <form className={s.gateCard} onSubmit={submit}>
          <span className={s.gateLock}>
            <LockIcon size={30} stroke="currentColor" />
          </span>
          <span className={s.kickerDeep}>PRIVATE STORE</span>
          <h1 className={s.gateTitle}>{store.name}</h1>
          <span className={s.gateText}>This store is for invited guests only. Enter the password from your invite, or open your invite link and it unlocks automatically.</span>
          <div className={s.gateRow}>
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              aria-label="Store password"
              placeholder="Store password"
              autoComplete="off"
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </div>
          {error && <span className={s.gateError}>That password didn’t work. Check your invite and try again.</span>}
          <span className={s.gateRule} />
          <span className={s.gateFoot}>
            Not invited? <Link href={partnerHref(store.slug)}>Contact {store.short || store.name}</Link> · <Link href={shopHref()}>Back to shop</Link>
          </span>
        </form>
      </div>
    </section>
    <ShopTabs />
    </>
  );
}

const PROFILE_LINKS = [
  { k: 'PROGRAMS', t: 'Experiences', d: 'Upcoming programs, camps and events', hash: 'experiences' },
  { k: 'GALLERY', t: 'Photos', d: 'Game day and event photos to view and download', hash: 'about' },
  { k: 'COLLABS', t: 'Partnerships', d: 'The brands and creators they work with', hash: 'partnerships' },
  { k: 'LATEST', t: 'Updates & News', d: 'Announcements and stories', hash: 'news' },
];

function StorePage({ data, store }: { data: ShopData; store: ShopStore }) {
  const { copied, share } = useShare();
  const color = store.color || partnerType(store.type).color;
  const group = groupOf(store.type);
  const f = store.shop.fundraiser;
  const short = store.short || store.name;
  return (
    <>
      <section className={s.storeHero} style={{ background: color }} data-header-tone="light">
        {store.hero && <img className={s.storeHeroImg} src={store.hero} alt="" />}
        <span className={s.storeShade} aria-hidden />
        <div className={s.storeHeroInner}>
          <nav className={s.crumbs} aria-label="Breadcrumb">
            <Link href={shopHref()}>Shop</Link>
            {'  ›  '}
            {store.shop.exclusive ? <Link href={shopHref({ view: 'exclusives' })}>CLP Exclusives</Link> : <Link href={shopHref({ view: 'partners', group: group.id })}>{group.label}</Link>}
            {'  ›  '}
            {store.name}
          </nav>
          <div className={s.storeId}>
            <StoreLogo store={store} className={s.storeLogo} />
            <div className={s.storeText}>
              <span className={s.storeKicker}>
                <span className={s.kicker}>{store.shop.exclusive ? 'ONLY ON CLP' : store.shop.private ? 'PRIVATE STORE' : f ? 'FUNDRAISER STORE' : 'OFFICIAL STORE'}</span>
                {/* CLP's own store isn't a partner's. */}
                <span className={s.verified}>{store.shop.exclusive ? '✓ Made by Compete Like Pros' : '✓ Verified partner'}</span>
              </span>
              <h1 className={s.storeName}>{store.name}</h1>
              {storeLine(store) && <span className={s.storeLine}>{storeLine(store)}</span>}
            </div>
            <div className={s.storeActions}>
              <button type="button" className={s.btnGhost} onClick={share}>
                {copied ? 'Link copied ✓' : 'Share store'}
              </button>
              {!store.shop.exclusive && (
                <Link href={partnerHref(store.slug)} className={s.btnWhite}>
                  View full profile ↗
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      <ShopTabs />
      <section className={s.facts}>
        <div className={s.factsInner}>
          <span>
            Every order supports <strong>{short}</strong>
          </span>
          {store.shop.pickup && (
            <>
              <span className={s.factRule} aria-hidden />
              <span>
                <strong>Pick-up</strong> available
              </span>
            </>
          )}
          <span className={s.factRule} aria-hidden />
          <span>Secure checkout by CLP</span>
          {store.shop.private && (
            <span className={s.privateBar}>
              PRIVATE STORE{store.shop.until ? ` · OPEN UNTIL ${shortDate(store.shop.until).toUpperCase()}` : ''}
            </span>
          )}
        </div>
      </section>
      <Products products={store.products} stores={[...data.stores.filter((x) => x.slug !== store.slug), store]} />
      {f && (
        <section className={`${s.section} ${s.spacedSm}`}>
          <div className={s.fund}>
            <div className={s.fundText}>
              <span className={s.kickerDeep}>FUNDRAISER STORE</span>
              <strong className={s.fundTitle}>Every purchase supports {store.name}</strong>
              <span className={s.fundLine}>{store.about ? `${store.about.slice(0, 180)}${store.about.length > 180 ? '…' : ''}` : 'Every order on this store goes to their program.'}</span>
            </div>
            <div className={s.fundBar}>
              <span className={s.fundNums}>
                <strong>Raised {money(f.raised)}</strong>
                <span>of {money(f.goal)} goal</span>
              </span>
              <span className={s.fundTrack}>
                <span style={{ width: `${Math.min(100, Math.round((f.raised / Math.max(1, f.goal)) * 100))}%` }} />
              </span>
              <span className={s.fundMeta}>
                {countLabel(f.supporters, 'supporter')}
                {f.endsAt ? ` · ends ${shortDate(f.endsAt)}` : ''}
              </span>
            </div>
          </div>
        </section>
      )}
      {!store.shop.exclusive && (
        <section className={`${s.section} ${s.spacedSm}`}>
          <div className={s.profile}>
            <div className={s.profileMain} style={{ background: color }}>
              <StoreLogo store={store} className={s.profileLogo} />
              <span className={s.kicker}>ALSO ON CLP</span>
              <strong className={s.profileName}>{store.name}</strong>
              <span className={s.profileText}>The store is one part of {short} on CLP. See everything they offer, from programs and events to photos and news.</span>
              <Link href={partnerHref(store.slug)} className={s.btnWhite}>
                View full profile ↗
              </Link>
            </div>
            <div className={s.profileLinks}>
              {PROFILE_LINKS.map((l) => (
                <Link key={l.hash} href={`${partnerHref(store.slug)}#${l.hash}`} className={s.profileLink}>
                  <span className={s.profileLinkText}>
                    <span className={s.profileK}>{l.k}</span>
                    <strong>{l.t}</strong>
                    <span>{l.k === 'LATEST' ? `Announcements and stories from ${short}` : l.d}</span>
                  </span>
                  <span className={s.circleArrow} aria-hidden>
                    <Arrow />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- a product */

/** What the product detail needs of its store: the shop's store, or a partner page's own. */
export type DetailStore = Pick<ShopStore, 'slug' | 'name' | 'short' | 'color' | 'type' | 'logo' | 'mono'> & { shop: Pick<ShopStore['shop'], 'exclusive' | 'private' | 'pickup' | 'pickupNote'> };

function ProductPage({ data, store, product, storeKey: key, onViewCart }: { data: ShopData; store: ShopStore; product: ShopProduct; storeKey: string; onViewCart: () => void }) {
  const more = store.products.filter((p) => p.id !== product.id).slice(0, HOME_ROW);
  return (
    <>
      <section className={s.thinBand} data-header-tone="light" />
      <section className={`${s.section} ${s.productSection}`}>
        <nav className={`${s.crumbs} ${s.crumbsLight}`} aria-label="Breadcrumb">
          <Link href={shopHref()}>Shop</Link>
          {'  ›  '}
          <Link href={storeHref(store.slug)}>{store.name}</Link>
          {'  ›  '}
          {product.title}
        </nav>
        <ProductDetail store={store} product={product} storeKey={key} onViewCart={onViewCart} />
      </section>
      {more.length > 0 && (
        <section className={`${s.section} ${s.spaced}`}>
          <div className={s.headRow}>
            <h2 className={s.moreTitle}>More from {store.name}</h2>
          </div>
          <ProductGrid products={more} stores={[...data.stores.filter((x) => x.slug !== store.slug), store]} />
        </section>
      )}
      <div className={s.bottomSpace} />
    </>
  );
}

/**
 * A product's photos and its buy column (store, name, price, colour and size, quantity, Add to cart and Buy now, the
 * shipping, returns and impact lines, Details and Shipping & returns): the shop's product page, and a partner page's
 * Shop tab (`onStore` back to its products in place of the store link, `disabled` while the page is a preview).
 */
export function ProductDetail({
  store,
  product,
  storeKey: key,
  onViewCart,
  onStore,
  disabled = false,
}: {
  store: DetailStore;
  product: ShopProduct;
  storeKey?: string;
  onViewCart: () => void;
  onStore?: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [choices, setChoices] = useState<Record<string, string>>(() => Object.fromEntries(product.optionGroups.map((g) => [g.kind, g.values[0]])));
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<'' | 'add' | 'buy'>('');
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ details: true });
  const { copied, share } = useShare(productHref(store.slug, product.id));
  const exclusive = store.shop.exclusive;
  const short = store.short || store.name;
  const color = exclusive ? '#0A0A0A' : store.color || partnerType(store.type).color;

  const add = async (buy: boolean) => {
    setBusy(buy ? 'buy' : 'add');
    setError('');
    try {
      cartChanged(await addToCart(store.slug, product.id, choices, qty, store.shop.private ? key : undefined));
      if (buy) router.push(checkoutHref());
      else setAdded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add it. Please try again.');
    } finally {
      setBusy('');
    }
  };
  const colorGroup = product.optionGroups.find((g) => g.kind === 'Colors');
  const otherGroups = product.optionGroups.filter((g) => g.kind !== 'Colors');
  const swatch = Boolean(colorGroup && colorGroup.values.every(canPaint));
  const accordions = [
    {
      id: 'details',
      t: 'Details',
      lines: [exclusive ? 'Made by Compete Like Pros' : `Official ${store.name} gear`, product.category && `Category: ${product.category}`, product.collection && `Collection: ${product.collection}`].filter(Boolean) as string[],
    },
    { id: 'shipping', t: 'Shipping & returns', lines: [`Ships from ${exclusive ? 'CLP' : store.name}`, store.shop.pickup ? `Pick-up available${store.shop.pickupNote ? `: ${store.shop.pickupNote}` : ''}` : 'Standard shipping in the United States', 'Items from different stores ship separately', 'Questions about an order? Contact CLP and we’ll help'] },
  ];
  const blurb = product.description || (exclusive ? `Made by Compete Like Pros. ${product.collection || 'Only on CLP'}.` : `Official ${store.name} gear, sold on CLP. Every order supports ${short}.`);

  const storeChip = (
    <>
      <StoreLogo store={store} className={s.buyStoreLogo} />
      <span className={s.buyStoreText}>
        <strong>{store.name}</strong>
        <span>Visit store</span>
      </span>
    </>
  );

  return (
    <>
    <div className={s.productLayout}>
      <div className={s.gallery}>
        <div className={s.thumbs}>
          {(images.length ? images : ['']).map((src, i) => (
            <button key={`${src}-${i}`} type="button" className={`${s.thumb} ${i === photo ? s.thumbOn : ''}`} aria-label={`Photo ${i + 1}`} onClick={() => setPhoto(i)} style={{ background: src ? '#EEEEEB' : color }}>
              {src && <img src={src} alt="" />}
            </button>
          ))}
        </div>
        <div className={s.mainPhoto} style={{ background: images.length ? '#EEEEEB' : color }}>
          {images.length > 0 ? (
            <>
              <img src={images[photo]} alt={product.title} />
              <button type="button" className={s.zoomHit} aria-label="View larger" onClick={() => setZoom(true)} />
              <span className={s.zoomTag} aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
                View larger
              </span>
            </>
          ) : (
            <span className={s.tileBlank}>
              <img src={site.logo.light} alt="" style={{ opacity: exclusive ? 1 : 0.35 }} />
            </span>
          )}
          <span className={s.photoTags}>
            {isNewProduct(product) && <span className={s.tag}>NEW</span>}
            {exclusive && <span className={`${s.tag} ${s.tagGold}`}>CLP EXCLUSIVE</span>}
          </span>
        </div>
      </div>

      <div className={s.buy}>
        {onStore ? (
          <button type="button" className={s.buyStore} onClick={onStore}>
            {storeChip}
          </button>
        ) : (
          // The partner's own page on its Shop tab (CLP's exclusives have no page: their store).
          <Link href={exclusive ? storeHref(store.slug) : `${partnerHref(store.slug)}#shop`} className={s.buyStore}>
            {storeChip}
          </Link>
        )}
        <div className={s.buyHead}>
          <h1 className={s.productName}>{product.title}</h1>
          <strong className={s.productPrice}>{money(product.price)}</strong>
          <span className={s.productText}>{blurb}</span>
        </div>
        {colorGroup && (
          <div className={s.option}>
            <span className={s.optionLabel}>
              <strong>Color</strong> <span>· {choices.Colors}</span>
            </span>
            <div className={s.optionValues} role="radiogroup" aria-label="Color">
              {colorGroup.values.map((v) =>
                swatch ? (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={choices.Colors === v}
                    aria-label={v}
                    className={`${s.swatch} ${choices.Colors === v ? s.swatchOn : ''}`}
                    style={{ background: paint(v) }}
                    onClick={() => setChoices({ ...choices, Colors: v })}
                  />
                ) : (
                  <button key={v} type="button" role="radio" aria-checked={choices.Colors === v} className={`${s.size} ${choices.Colors === v ? s.sizeOn : ''}`} onClick={() => setChoices({ ...choices, Colors: v })}>
                    {v}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
        {otherGroups.map((g) => (
          <div key={g.kind} className={s.option}>
            <span className={s.optionLabel}>
              <strong>{g.kind === 'Sizes' ? 'Size' : g.kind}</strong>
            </span>
            <div className={s.optionValues} role="radiogroup" aria-label={g.kind}>
              {g.values.map((v) => (
                <button key={v} type="button" role="radio" aria-checked={choices[g.kind] === v} className={`${s.size} ${choices[g.kind] === v ? s.sizeOn : ''}`} onClick={() => setChoices({ ...choices, [g.kind]: v })}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className={s.addRow}>
          <span className={s.qty}>
            <button type="button" aria-label="Fewer" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" aria-label="More" disabled={qty >= 20} onClick={() => setQty(qty + 1)}>
              +
            </button>
          </span>
          <button type="button" className={s.addBtn} disabled={Boolean(busy) || disabled} onClick={() => (added ? onViewCart() : add(false))}>
            {busy === 'add' ? 'Adding…' : added ? 'Added ✓ · View cart' : 'Add to cart'}
          </button>
        </div>
        <button type="button" className={s.buyNow} disabled={Boolean(busy) || disabled} onClick={() => add(true)}>
          {busy === 'buy' ? 'Opening checkout…' : 'Buy now · one-step checkout'}
        </button>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.infoBox}>
          <span>
            <strong>Shipping</strong>
            <span>{store.shop.pickup ? `Ships from ${store.name}, or pick it up${store.shop.pickupNote ? ` (${store.shop.pickupNote})` : ''}.` : `Made for you and shipped by ${exclusive ? 'CLP' : store.name}.`}</span>
          </span>
          <span>
            <strong>Returns</strong>
            <span>Contact CLP within 30 days of delivery about an unworn item.</span>
          </span>
          <span>
            <strong>Impact</strong>
            <span>{exclusive ? 'Supports CLP community programs.' : `Every order supports ${short}.`}</span>
          </span>
        </div>
        <div className={s.accordions}>
          {accordions.map((a) => (
            <div key={a.id} className={s.accordion}>
              <button type="button" aria-expanded={Boolean(open[a.id])} onClick={() => setOpen({ ...open, [a.id]: !open[a.id] })}>
                {a.t}
                <span className={s.accSign} aria-hidden>
                  {open[a.id] ? '−' : '+'}
                </span>
              </button>
              {open[a.id] && (
                <ul>
                  {a.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <button type="button" className={s.shareLink} onClick={share}>
          {copied ? 'Link copied ✓' : 'Share this product'}
        </button>
      </div>
    </div>
      {zoom && images.length > 0 && <Lightbox images={images} start={photo} title={product.title} onClose={() => setZoom(false)} />}
    </>
  );
}

function Lightbox({ images, start, title, onClose }: { images: string[]; start: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const step = (d: number) => setI((n) => (n + d + images.length) % images.length);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') stepRef.current(-1);
      if (e.key === 'ArrowRight') stepRef.current(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={s.lightbox} role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className={s.lbHead}>
        <span>
          {i + 1} / {images.length} · {title}
        </span>
        <button type="button" className={s.lbClose} aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className={s.lbStage}>
        <button type="button" className={s.lbStep} aria-label="Previous image" onClick={() => step(-1)} disabled={images.length < 2}>
          ‹
        </button>
        <div className={s.lbImage}>
          <img src={images[i]} alt={title} />
        </div>
        <button type="button" className={s.lbStep} aria-label="Next image" onClick={() => step(1)} disabled={images.length < 2}>
          ›
        </button>
      </div>
      <div className={s.lbThumbs}>
        {images.map((src, n) => (
          <button key={`${src}-${n}`} type="button" className={`${s.lbThumb} ${n === i ? s.lbThumbOn : ''}`} aria-label={`Photo ${n + 1}`} onClick={() => setI(n)}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------- the cart */

/** The cart drawer (the design's): every line with its store, quantity and price, then the subtotal and Checkout. */
function CartDrawer({ cart, stores, onClose }: { cart: Cart | null; stores: ShopStore[]; onClose: () => void }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const lines = useMemo(() => cart?.lines ?? [], [cart]);
  const nameOf = (slug: string) => {
    const st = stores.find((x) => x.slug === slug);
    return st?.shop.exclusive ? 'Compete Like Pros' : (st?.name ?? cart?.stores?.find((x) => x.slug === slug)?.name ?? '');
  };
  const change = async (key: string, work: () => Promise<Cart>) => {
    setBusy(key);
    setError('');
    try {
      cartChanged(await work());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your cart. Please try again.');
    } finally {
      setBusy('');
    }
  };
  return createPortal(
    <div className={s.cartScrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={s.cart} role="dialog" aria-modal="true" aria-label="Cart">
        <div className={s.cartHead}>
          <strong>Your cart ({cart?.count ?? 0})</strong>
          <button type="button" className={s.cartClose} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={s.cartBody}>
          {!cart ? (
            <span className={s.muted}>Loading your cart…</span>
          ) : lines.length === 0 ? (
            <span className={s.cartEmpty}>Your cart is empty.</span>
          ) : (
            lines.map((l) => (
              <div key={l.key} className={s.cartLine} aria-busy={busy === l.key}>
                <span className={s.cartThumb}>{l.image && <img src={l.image} alt="" />}</span>
                <span className={s.cartInfo}>
                  <span className={s.cartPartner}>{nameOf(l.slug)}</span>
                  <strong>{l.title}</strong>
                  {l.option && <span className={s.cartOption}>{l.option}</span>}
                  <span className={s.cartQtyRow}>
                    <span className={`${s.qty} ${s.qtySmall}`}>
                      <button type="button" aria-label={`One less ${l.title}`} disabled={Boolean(busy)} onClick={() => change(l.key, () => setLineQty(l.key, l.qty - 1))}>
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button type="button" aria-label={`One more ${l.title}`} disabled={Boolean(busy) || l.qty >= 20} onClick={() => change(l.key, () => setLineQty(l.key, l.qty + 1))}>
                        +
                      </button>
                    </span>
                    <button type="button" className={s.cartRemove} disabled={Boolean(busy)} onClick={() => change(l.key, () => removeLine(l.key))}>
                      Remove
                    </button>
                  </span>
                </span>
                <strong className={s.cartPrice}>{money(l.price * l.qty)}</strong>
              </div>
            ))
          )}
          {cart?.removed ? <p className={s.muted}>Something in your cart is no longer for sale, so it was taken out.</p> : null}
          {error && <p className={s.error}>{error}</p>}
        </div>
        <div className={s.cartFoot}>
          <span className={s.cartSubtotal}>
            <strong>Subtotal</strong>
            <strong>{money(cart?.subtotal ?? 0)}</strong>
          </span>
          <span className={s.cartNote}>Discount and team codes, shipping and tax at checkout.</span>
          {lines.length === 0 ? (
            <button type="button" className={s.checkoutBtn} disabled>
              Checkout
            </button>
          ) : (
            <a href={checkoutHref()} className={s.checkoutBtn}>
              Checkout
            </a>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
