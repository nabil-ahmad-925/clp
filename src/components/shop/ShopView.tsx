'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos and logos (their own uploads), shown as they are. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { setHeaderBrand } from '@/components/layout/headerBrand';
import Pager from '@/components/ui/Pager';
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
  sportMark,
  storeHref,
  storeKey,
  storesIn,
  swatches,
  typeLabel,
  unlockStore,
  type ShopData,
  type ShopProduct,
  type ShopStore,
} from '@/content/storefront';
import ShopBulk from './ShopBulk';
import ShopStudio from './ShopStudio';
import { Arrow, CategoryIcon, Chevron, LockIcon, SearchIcon, SortIcon } from './shopIcons';
import s from './shop.module.css';

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];
const sortBy = (sort: Sort) => (a: ShopProduct, b: ShopProduct) =>
  sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'newest' ? (b.addedAt ?? '').localeCompare(a.addedAt ?? '') : 0;

/** How many stores the home's "Shop by partner" shows, new arrivals, exclusives, and stores per menu column. */
const HOME_STORES = 12;
const HOME_ROW = 4;
const MENU_STORES = 3;
/** Products per page in a list (rows of four), and the sizes a shopper can pick. */
const PAGE_SIZES = [12, 24, 48] as const;

const fold = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

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

  let body;
  if (view === 'bulk') body = <ShopBulk />;
  else if (view === 'studio') body = <ShopStudio key={params.get('item') ?? ''} />;
  else if (failed) body = <Notice text="The shop couldn’t load. Check your connection and try again." />;
  else if (!data) body = <Loading />;
  else if (slug && !store) body = <Notice text="This store isn’t open right now." />;
  else if (store) body = <StoreRoute key={store.slug} data={data} store={store} productId={productId} inviteKey={params.get('key') ?? ''} onViewCart={() => setCartOpen(true)} />;
  else if (view === 'partners') body = <Directory data={data} group={params.get('group') ?? ''} go={go} />;
  else if (view === 'exclusives') body = <Exclusives key={where} data={data} sport={params.get('sport') ?? ''} drop={params.get('drop') ?? ''} go={go} />;
  else if (view === 'new' || view === 'search') body = <Collection key={where} data={data} view={view} q={params.get('q') ?? ''} group={params.get('group') ?? ''} />;
  else body = <Home data={data} go={go} />;

  const tabs: { id: Nav; label: string; href?: string }[] = [
    { id: 'home', label: 'Shop', href: shopHref() },
    { id: 'partners', label: 'Shop by Partner' },
    { id: 'exclusives', label: 'CLP Exclusives', href: shopHref({ view: 'exclusives' }) },
    { id: 'new', label: 'New Arrivals', href: shopHref({ view: 'new' }) },
    { id: 'bulk', label: 'Bulk & Operations', href: shopHref({ view: 'bulk' }) },
  ];

  return (
    <div className={s.shop}>
      <section className={s.top} data-header-tone="light" ref={megaRef}>
        <nav className={s.nav} aria-label="Shop">
          {tabs.map((t) =>
            t.href ? (
              <Link key={t.id} href={t.href} className={`${s.navLink} ${active === t.id && !mega ? s.navOn : ''}`}>
                {t.label}
              </Link>
            ) : (
              <button key={t.id} type="button" className={`${s.navLink} ${active === t.id || mega ? s.navOn : ''}`} aria-expanded={mega} onClick={() => setMega(!mega)}>
                {t.label}
                <Chevron />
              </button>
            ),
          )}
        </nav>
        {mega && data && <MegaMenu data={data} go={go} />}
      </section>
      {body}
      {cartOpen && <CartDrawer cart={cart} stores={data?.stores ?? []} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Loading() {
  return (
    <>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={`${s.skeleton} ${s.skeletonTitle}`} />
        </div>
      </section>
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
      <section className={s.thinBand} />
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
function StoreLogo({ store, className }: { store: ShopStore; className: string }) {
  return (
    <span className={className} style={{ background: store.color || partnerType(store.type).color }}>
      {store.logo ? <img src={store.logo} alt="" /> : store.mono}
    </span>
  );
}

const storeLine = (store: ShopStore) => [store.category || typeLabel(store.type), store.area].filter(Boolean).join(' · ');
const countLabel = (n: number, word = 'item') => `${n} ${n === 1 ? word : `${word}s`}`;

/** What a product's tile says under its name: its collection, or "Supports AFC" / "Only on CLP". */
const infoOf = (p: ShopProduct, store?: ShopStore) =>
  store?.shop.exclusive ? p.collection || 'Only on CLP' : store?.shop.private ? 'Private drop' : `Supports ${store?.short || store?.name || 'the store'}`;

/** A product in a grid (the design's tile): photo (NEW, CLP EXCLUSIVE), store, name, what it supports, price and colours. */
function ProductTile({ product, store, eager }: { product: ShopProduct; store?: ShopStore; eager?: boolean }) {
  const colors = swatches(product);
  const exclusive = Boolean(store?.shop.exclusive);
  return (
    <Link href={productHref(product.slug, product.id)} className={s.tile}>
      <span className={s.tileMedia} style={{ background: product.image ? '#EEEEEB' : exclusive ? '#0A0A0A' : store?.color || '#EEEEEB' }}>
        {product.image ? (
          <img src={product.image} alt={product.title} loading={eager ? 'eager' : 'lazy'} />
        ) : (
          <span className={s.tileBlank}>
            <img src={site.logo.light} alt="" style={{ opacity: exclusive ? 1 : 0.35 }} />
            {!exclusive && <span>{store?.mono}</span>}
          </span>
        )}
        {isNewProduct(product) && <span className={s.newTag}>NEW</span>}
        {exclusive && <span className={s.exclTag}>CLP EXCLUSIVE</span>}
      </span>
      <span className={s.tileStore}>{exclusive ? 'COMPETE LIKE PROS' : (store?.name ?? '').toUpperCase()}</span>
      <span className={s.tileName}>{product.title}</span>
      <span className={s.tileInfo}>{infoOf(product, store)}</span>
      <span className={s.tileFoot}>
        <strong>{money(product.price)}</strong>
        {colors.length > 0 && (
          <span className={s.dots}>
            {colors.map((c) => (
              <span key={c} className={s.dot} style={{ background: paint(c) }} title={c} />
            ))}
          </span>
        )}
      </span>
    </Link>
  );
}

function ProductGrid({ products, stores, className }: { products: ShopProduct[]; stores: ShopStore[]; className?: string }) {
  return (
    <div className={className ?? s.grid4}>
      {products.map((p, i) => (
        <ProductTile key={`${p.slug}-${p.id}`} product={p} store={stores.find((x) => x.slug === p.slug)} eager={i < 4} />
      ))}
    </div>
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
                All {g.label.toLowerCase()}
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
            All exclusives
          </button>
        </div>
      </div>
      <div className={s.megaFoot}>
        <div className={s.megaFootInner}>
          <span>{total} official stores on CLP, A–Z</span>
          <button type="button" className={s.pillDark} onClick={() => go(shopHref({ view: 'partners' }))}>
            View all partners <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

/** The group chips (All, then each group). */
function GroupChips({ value, onPick, dark }: { value: string; onPick: (group: string) => void; dark?: boolean }) {
  return (
    <div className={s.chips}>
      {[{ id: '', label: 'All' }, ...SHOP_GROUPS].map((g) => (
        <button key={g.id} type="button" className={`${s.chip} ${dark ? s.chipDark : ''} ${value === g.id ? s.chipOn : ''}`} aria-pressed={value === g.id} onClick={() => onPick(g.id)}>
          {g.label}
        </button>
      ))}
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

function Home({ data, go }: { data: ShopData; go: (href: string) => void }) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [chip, setChip] = useState('');
  const search = (e: FormEvent) => {
    e.preventDefault();
    if (group === 'exclusives') go(shopHref({ view: 'exclusives', q: q.trim() }));
    else go(shopHref({ view: 'search', q: q.trim(), group }));
  };
  const tiles = storesIn(data.stores, chip).slice(0, HOME_STORES);
  const publicSlugs = new Set(data.stores.filter((x) => !x.shop.private).map((x) => x.slug));
  const fresh = data.products.filter((p) => publicSlugs.has(p.slug) && !isExclusive(p, data.stores));
  const newItems = (fresh.filter(isNewProduct).length >= HOME_ROW ? fresh.filter(isNewProduct) : fresh).slice(0, HOME_ROW);
  const exclusive = exclusivesOf(data).products.slice(0, HOME_ROW);
  const everything = mixStores(data.products.filter((p) => publicSlugs.has(p.slug)));
  return (
    <>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroTitle}>Shop the CLP community</h1>
          <p className={s.heroText}>Official gear from our athletes, clubs, schools and organizations, plus exclusives you can only get from CLP.</p>
        </div>
      </section>
      <div className={s.searchWrap}>
        <form className={s.search} role="search" onSubmit={search}>
          <input className={s.searchInput} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the shop" placeholder="Search products, athletes, clubs, schools…" />
          <span className={s.searchRule} aria-hidden />
          <span className={s.searchSelect}>
            <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Store type">
              <option value="">All stores</option>
              {SHOP_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
              <option value="exclusives">CLP Exclusives</option>
            </select>
            <Chevron className={s.chevron} color="#666666" />
          </span>
          <button type="submit" className={s.searchBtn} aria-label="Search">
            <SearchIcon />
          </button>
        </form>
      </div>

      <section className={`${s.section} ${s.byPartner}`}>
        <div className={s.headCenter}>
          <h2 className={s.bigTitle}>Shop by partner</h2>
          <span className={s.muted}>Official stores for the athletes, clubs, schools and organizations on CLP. Every order supports them.</span>
        </div>
        <div className={s.chipsCenter}>
          <GroupChips value={chip} onPick={setChip} />
        </div>
        {tiles.length === 0 ? (
          <p className={s.empty}>No stores here yet.</p>
        ) : (
          <div className={s.partnerTiles}>
            {tiles.map((x) => (
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
        )}
        <div className={s.center}>
          <Link href={shopHref({ view: 'partners' })} className={s.pillOutline}>
            View all partners <Arrow />
          </Link>
        </div>
      </section>

      {newItems.length > 0 && (
        <section className={`${s.section} ${s.spaced}`}>
          <div className={s.headRow}>
            <h2 className={s.rowTitle}>New arrivals</h2>
            <Link href={shopHref({ view: 'new' })} className={s.textLink}>
              View all
            </Link>
          </div>
          <ProductGrid products={newItems} stores={data.stores} />
        </section>
      )}

      {exclusive.length > 0 && (
        <section className={`${s.section} ${s.spaced}`}>
          <div className={s.headRow}>
            <div className={s.headStack}>
              <span className={s.kickerDeep}>ONLY ON CLP</span>
              <h2 className={s.rowTitle}>CLP Exclusives</h2>
            </div>
            <Link href={shopHref({ view: 'exclusives' })} className={s.textLink}>
              View all
            </Link>
          </div>
          <ProductGrid products={exclusive} stores={data.stores} />
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
                <span className={s.kickerDeep}>SHOP ALL</span>
                <h2 className={s.rowTitle}>All products</h2>
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
            <span className={s.bulkBandTitle}>Outfit your team, staff or event</span>
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

function Directory({ data, group, go }: { data: ShopData; group: string; go: (href: string) => void }) {
  const [q, setQ] = useState('');
  const g = groupById(group);
  const words = fold(q).split(/\s+/).filter(Boolean);
  const stores = storesIn(data.stores, g ? group : '').filter((x) => words.every((w) => fold([x.name, x.short, x.category, x.area, typeLabel(x.type)].join(' ')).includes(w)));
  const name = g ? g.label : 'All partners';
  return (
    <>
      <section className={s.band}>
        <div className={s.bandInner}>
          <nav className={s.crumbs} aria-label="Breadcrumb">
            <Link href={shopHref()}>Shop</Link>
            {'  ›  '}Shop by Partner{'  ›  '}
            {name}
          </nav>
          <div className={s.bandHead}>
            <span className={s.kicker}>SHOP BY PARTNER</span>
            <h1 className={s.bandTitle}>{name}</h1>
            <span className={s.bandSub}>{g ? 'Pick a store to shop their official gear. Every order supports them.' : 'Every official store on CLP. Every order supports them.'}</span>
          </div>
          <div className={s.bandTools}>
            <div className={s.chips}>
              {[{ id: '', label: 'All' }, ...SHOP_GROUPS].map((x) => (
                <button key={x.id} type="button" className={`${s.chip} ${s.tabDark} ${group === x.id ? s.tabDarkOn : ''}`} aria-pressed={group === x.id} onClick={() => go(shopHref({ view: 'partners', group: x.id }))}>
                  {x.label}
                </button>
              ))}
            </div>
            <span className={s.bandSearch}>
              <SearchIcon size={16} stroke="#888888" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search stores" placeholder={g ? `Search ${g.label.toLowerCase()}…` : 'Search stores…'} />
            </span>
          </div>
        </div>
      </section>
      <section className={`${s.section} ${s.list}`}>
        <span className={s.count}>
          <strong>{countLabel(stores.length, 'store')}</strong>
        </span>
        {stores.length === 0 ? (
          <p className={s.empty}>No stores match your search.</p>
        ) : (
          <div className={s.grid4}>
            {stores.map((x) => (
              <Link key={x.slug} href={storeHref(x.slug)} className={s.storeCard}>
                <span className={s.storeCover} style={{ background: x.color || partnerType(x.type).color }}>
                  {x.hero && <img src={x.hero} alt="" loading="lazy" />}
                  {x.shop.private && (
                    <span className={s.privateTag}>
                      <LockIcon />
                      PRIVATE
                    </span>
                  )}
                  <StoreLogo store={x} className={s.storeCardLogo} />
                </span>
                <span className={s.storeCardBody}>
                  <strong>{x.name}</strong>
                  <span className={s.storeMeta}>{x.shop.private ? `Private drop${x.shop.until ? ` · open until ${shortDate(x.shop.until)}` : ''}` : storeLine(x)}</span>
                  <span className={s.storeFoot}>
                    <span>{countLabel(x.productCount, 'product')}</span>
                    <span className={s.storeCta}>{x.shop.private && !storeKey(x.slug) ? 'Enter password' : 'Shop store'}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- products with pills and sort */

/**
 * Products with category pills, sort and pages (rows of four). The category, sort, page and page size live in the
 * address (?category=&sort=&page=&per=), so Back returns to the page a shopper left and a link opens the same list.
 */
function Products({ products, stores, head = '', title, id }: { products: ShopProduct[]; stores: ShopStore[]; head?: string; title?: ReactNode; id?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const topRef = useRef<HTMLElement>(null);
  const cats = ['All', ...[...new Set(products.map((p) => p.category).filter(Boolean))].sort()];
  const asked = params.get('category') ?? '';
  const cat = cats.includes(asked) ? asked : 'All';
  const askedSort = params.get('sort') as Sort | null;
  const sort: Sort = SORTS.some((o) => o.value === askedSort) ? (askedSort as Sort) : 'featured';
  const askedPer = Number(params.get('per'));
  const per = (PAGE_SIZES as readonly number[]).includes(askedPer) ? askedPer : PAGE_SIZES[0];
  const shown = products.filter((p) => cat === 'All' || p.category === cat).sort(sortBy(sort));
  const pageCount = Math.max(1, Math.ceil(shown.length / per));
  const page = Math.min(Math.max(0, (Number(params.get('page')) || 1) - 1), pageCount - 1);
  const onPage = shown.slice(page * per, page * per + per);

  /** Changes the list's settings in the address: a new page is a step Back undoes, a new filter replaces the page. */
  const change = (next: { category?: string; sort?: Sort; page?: number; per?: number }, step = false) => {
    const q = new URLSearchParams(params.toString());
    const put = (key: string, value: string, empty: string) => (value && value !== empty ? q.set(key, value) : q.delete(key));
    if (next.category !== undefined) put('category', next.category, 'All');
    if (next.sort !== undefined) put('sort', next.sort, 'featured');
    if (next.per !== undefined) put('per', String(next.per), String(PAGE_SIZES[0]));
    put('page', next.page ? String(next.page + 1) : '', '1');
    const query = q.toString();
    const href = `${window.location.pathname}${query ? `?${query}` : ''}`;
    if (step) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
    if (step) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section ref={topRef} id={id} className={`${s.section} ${s.products} ${title ? s.productsHome : ''}`}>
      {title}
      <div className={s.toolbar}>
        <div className={s.chips}>
          {cats.map((c) => (
            <button key={c} type="button" className={`${s.chip} ${s.chipTall} ${cat === c ? s.chipOn : ''}`} aria-pressed={cat === c} onClick={() => change({ category: c })}>
              {c} <span className={s.chipN}>{c === 'All' ? products.length : products.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>
        <div className={s.toolbarEnd}>
          <span className={s.count}>
            <strong>
              {head}
              {shown.length}
            </strong>{' '}
            {shown.length === 1 ? 'product' : 'products'}
          </span>
          <span className={s.sort}>
            <span className={s.sortIcon}>
              <SortIcon />
            </span>
            <select value={sort} onChange={(e) => change({ sort: e.target.value as Sort })} aria-label="Sort">
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Chevron className={s.chevron} color="#666666" />
          </span>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className={s.empty}>No products in this category yet.</p>
      ) : (
        <>
          <ProductGrid products={onPage} stores={stores} className={s.grid4Tall} />
          {shown.length > PAGE_SIZES[0] && (
            <div data-listing className={s.pager}>
              <Pager
                page={page}
                pageCount={pageCount}
                total={shown.length}
                shown={onPage.length}
                pageSize={per}
                sizes={PAGE_SIZES}
                onPage={(n) => change({ page: n }, true)}
                onPageSize={(n) => change({ per: n })}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** A list's black heading (new arrivals, a search, CLP Exclusives): breadcrumb, kicker, Playfair title and line. */
function ListBand({ crumb, name, kicker, sub }: { crumb: string; name: string; kicker: string; sub: string }) {
  return (
    <section className={s.band}>
      <div className={`${s.bandInner} ${s.bandList}`}>
        <nav className={s.crumbs} aria-label="Breadcrumb">
          <Link href={shopHref()}>Shop</Link>
          {'  ›  '}
          {crumb}
          {'  ›  '}
          {name}
        </nav>
        <div className={s.headCenter}>
          <span className={s.kicker}>{kicker}</span>
          <h1 className={s.listTitle}>{name}</h1>
          <p className={s.heroText}>{sub}</p>
        </div>
      </div>
    </section>
  );
}

function Collection({ data, view, q, group }: { data: ShopData; view: string; q: string; group: string }) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  const g = groupById(group);
  const storeOf = (p: ShopProduct) => data.stores.find((x) => x.slug === p.slug);
  const publicProducts = data.products.filter((p) => !storeOf(p)?.shop.private);
  const products =
    view === 'new'
      ? publicProducts
      : publicProducts.filter((p) => {
          const st = storeOf(p);
          if (g && (!st || st.shop.exclusive || groupOf(st.type).id !== g.id)) return false;
          const text = fold([p.title, p.category, p.collection, p.description, st?.name, st?.short, st?.category, typeLabel(st?.type ?? '')].join(' '));
          return words.every((w) => text.includes(w));
        });
  const name = view === 'new' ? 'New Arrivals' : q ? `“${q}”` : g ? g.label : 'All products';
  return (
    <>
      <ListBand
        crumb={view === 'new' ? 'Collections' : g ? 'Shop by Partner' : 'Search'}
        name={name}
        kicker={view === 'new' ? 'JUST DROPPED' : g ? 'SHOP BY PARTNER' : 'SEARCH'}
        sub={view === 'new' ? 'The latest from CLP and our partners.' : g ? `Every store for ${g.label.toLowerCase()} on CLP.` : 'Products across the CLP shop.'}
      />
      <Products products={products} stores={data.stores} />
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- CLP Exclusives */

function Exclusives({ data, sport, drop, go }: { data: ShopData; sport: string; drop: string; go: (href: string) => void }) {
  const ex = exclusivesOf(data);
  const products = ex.products.filter((p) => (!sport || p.sport === sport) && (!drop || p.collection === drop));
  const pick = (next: { sport?: string; drop?: string }) => go(shopHref({ view: 'exclusives', ...next }));
  const head = sport ? `${sportLabel(sport)} · ` : drop ? `${drop} · ` : '';
  return (
    <>
      <ListBand crumb="Collections" name="CLP Exclusives" kicker="ONLY ON CLP" sub="The Footprints Collection and everything made by Compete Like Pros." />
      {(ex.sports.length > 0 || ex.drops.length > 0) && (
        <section className={`${s.section} ${s.exclusives}`}>
          {ex.sports.length > 0 && (
            <div className={s.exBlock}>
              <div className={s.headRow}>
                <h2 className={s.exTitle}>Shop by sport</h2>
                {(sport || drop) && (
                  <button type="button" className={s.textLinkBtn} onClick={() => pick({})}>
                    Clear filter
                  </button>
                )}
              </div>
              <div className={s.sportTiles}>
                {ex.sports.map((sp) => {
                  const n = ex.products.filter((p) => p.sport === sp).length;
                  return (
                    <button key={sp} type="button" className={`${s.sportTile} ${sport === sp ? s.sportOn : ''}`} aria-pressed={sport === sp} onClick={() => pick(sport === sp ? {} : { sport: sp })}>
                      <span className={s.sportMark} aria-hidden>
                        {sportMark(sp)}
                      </span>
                      <strong>{sportLabel(sp)}</strong>
                      <span>{countLabel(n, 'product')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {ex.drops.length > 0 && (
            <div className={s.exBlock}>
              <h2 className={s.exTitle}>Drops &amp; collections</h2>
              <div className={s.dropTiles}>
                {ex.drops.map((d) => {
                  const list = ex.products.filter((p) => p.collection === d);
                  const img = list.find((p) => p.image)?.image;
                  return (
                    <button key={d} type="button" className={`${s.dropTile} ${drop === d ? s.dropOn : ''}`} aria-pressed={drop === d} onClick={() => pick(drop === d ? {} : { drop: d })}>
                      {img && <img src={img} alt="" />}
                      <span className={s.dropText}>
                        <span className={s.dropKicker}>CLP COLLECTION</span>
                        <span className={s.dropName}>{d}</span>
                        <span className={s.dropSub}>{countLabel(list.length, 'product')}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
      {products.length === 0 && ex.products.length === 0 ? (
        <section className={`${s.section} ${s.products}`}>
          <p className={s.empty}>CLP Exclusives are on their way. Check back soon.</p>
        </section>
      ) : (
        <Products key={`${sport}|${drop}`} products={products} stores={data.stores} head={head} />
      )}
      <div className={s.bottomSpace} />
    </>
  );
}

/* ---------------------------------------------------------------- a store (and its products) */

/** "Copy link" for the page: "Link copied ✓" for a moment. */
function useShare() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href.replace(/([?&])key=[^&]*&?/, '$1').replace(/[?&]$/, '');
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
    <section className={s.gate}>
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
      <section className={s.storeHero} style={{ background: color }}>
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
                <span className={s.verified}>✓ Verified partner</span>
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
      <section className={s.facts}>
        <div className={s.factsInner}>
          <span>
            <strong>{store.products.length}</strong> {store.products.length === 1 ? 'product' : 'products'}
          </span>
          <span className={s.factRule} aria-hidden />
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

function ProductPage({ data, store, product, storeKey: key, onViewCart }: { data: ShopData; store: ShopStore; product: ShopProduct; storeKey: string; onViewCart: () => void }) {
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
  const { copied, share } = useShare();
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
  const more = store.products.filter((p) => p.id !== product.id).slice(0, HOME_ROW);
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

  return (
    <>
      <section className={s.thinBand} />
      <section className={`${s.section} ${s.productSection}`}>
        <nav className={`${s.crumbs} ${s.crumbsLight}`} aria-label="Breadcrumb">
          <Link href={shopHref()}>Shop</Link>
          {'  ›  '}
          <Link href={storeHref(store.slug)}>{store.name}</Link>
          {'  ›  '}
          {product.title}
        </nav>
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
            <Link href={storeHref(store.slug)} className={s.buyStore}>
              <StoreLogo store={store} className={s.buyStoreLogo} />
              <span className={s.buyStoreText}>
                <strong>{store.name}</strong>
                <span>Visit store</span>
              </span>
            </Link>
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
              <button type="button" className={s.addBtn} disabled={Boolean(busy)} onClick={() => (added ? onViewCart() : add(false))}>
                {busy === 'add' ? 'Adding…' : added ? 'Added ✓ · View cart' : 'Add to cart'}
              </button>
            </div>
            <button type="button" className={s.buyNow} disabled={Boolean(busy)} onClick={() => add(true)}>
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
      </section>
      {more.length > 0 && (
        <section className={`${s.section} ${s.spaced}`}>
          <div className={s.headRow}>
            <h2 className={s.moreTitle}>More from {store.name}</h2>
            <Link href={storeHref(store.slug)} className={s.textLink}>
              View store
            </Link>
          </div>
          <ProductGrid products={more} stores={[...data.stores.filter((x) => x.slug !== store.slug), store]} />
        </section>
      )}
      <div className={s.bottomSpace} />
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
