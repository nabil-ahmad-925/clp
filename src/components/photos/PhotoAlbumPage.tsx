'use client';
/* eslint-disable @next/next/no-img-element -- the album's photos (presigned links), shown as they are. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addToGalleryCart, onGalleryCart, readGalleryCart } from '@/components/cart/galleryCart';
import GalleryCart from '@/components/sections/GalleryCart';
import ListingHero from '@/components/sections/ListingHero';
import PhotoGate from '@/components/sections/PhotoGate';
import { Mockup } from '@/components/sections/GalleryLightbox';
import Pager from '@/components/ui/Pager';
import {
  PHOTO_PAGE_SIZES,
  albumsEnabled,
  fetchAlbum,
  fetchPrintBacks,
  type LiveAlbum,
  type LivePhoto,
  type PhotoPage,
  type PhotoShow,
} from '@/content/albums';
import { dollars, printBackKey, printFrom, printPrice, type PrintProduct } from '@/content/gallery';
import usePhotoLogin from './usePhotoLogin';
import usePrintProducts from './usePrintProducts';
import s from './PhotoAlbumPage.module.css';

const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
/** The album filters the API offers (the design's All photos, Free, and its prints). */
const FILTERS: [PhotoShow, string][] = [
  ['all', 'All photos'],
  ['free', 'Free'],
  ['prints', 'Prints & Products'],
];
const albumHref = (id: string) => `/photos/?album=${encodeURIComponent(id)}`;
const photoHref = (id: string, photo: string) => `${albumHref(id)}&photo=${encodeURIComponent(photo)}`;
const defaults = (p: PrintProduct) => Object.fromEntries(p.options.map((o) => [o.id, o.options[0].value]));

/** "Wed, Oct 7" (this year), or "Oct 17–18". */
function when(a: Pick<LiveAlbum, 'eventDate' | 'eventEndDate'>) {
  const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => d(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
  const year = (iso: string) => (d(iso).getUTCFullYear() === new Date().getUTCFullYear() ? {} : { year: 'numeric' as const });
  if (!a.eventEndDate) return fmt(a.eventDate, { weekday: 'short', month: 'short', day: 'numeric', ...year(a.eventDate) });
  const same = a.eventDate.slice(0, 7) === a.eventEndDate.slice(0, 7);
  return `${fmt(a.eventDate, { month: 'short', day: 'numeric' })}–${fmt(a.eventEndDate, same ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}`;
}
const metaOf = (a: LiveAlbum) => [when(a), a.venue || a.city, `Photos by ${a.by}`].filter(Boolean).join(' · ');

type State =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }
  | { kind: 'locked'; album: LiveAlbum; notAdded?: boolean }
  | { kind: 'open'; album: LiveAlbum; page: PhotoPage };

/**
 * An album or one of its photos (/photos/?album=<id>[&photo=<id>], the Event photos & prints design), under the
 * "Find your game photos" heading. The album: its card (back to every album, its name and line, the filters), the
 * family note, then its photos ("Free", or what prints start at). A photo: on the left the chosen product with the
 * photo on it, its front or its back, and the album's photos to switch; on the right its free download and the prints
 * and products (each product's options, price and Add to cart). A locked album shows its code or sign-in first.
 */
export default function PhotoAlbumPage({ id, photoId }: { id: string; photoId: string }) {
  const router = useRouter();
  const login = usePhotoLogin();
  const [show, setShow] = useState<PhotoShow>('all');
  const [limit, setLimit] = useState<number>(PHOTO_PAGE_SIZES[0]);
  const [pageNo, setPageNo] = useState(1);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  // The products this album's photos go on (CLP's Photo products): a printable photo's "From $5" is the cheapest.
  const print = usePrintProducts(state.kind === 'open' ? state.album.partner : undefined);
  const from = print.ready && print.products.length ? Math.min(...print.products.map(printFrom)) : 0;

  // The album, at the page asked for (a photo: the page it's on, so the strip shows its neighbours).
  useEffect(() => {
    let active = true;
    if (!albumsEnabled) {
      queueMicrotask(() => active && setState({ kind: 'missing' }));
      return () => {
        active = false;
      };
    }
    fetchAlbum(id, { page: pageNo, limit, show, ...(photoId ? { at: photoId } : {}) }).then(
      (r) => {
        if (!active) return;
        if (r.status === 'missing') setState({ kind: 'missing' });
        else if (r.status === 'locked') setState({ kind: 'locked', album: r.item, notAdded: r.notAdded });
        else setState({ kind: 'open', album: r.item, page: { photos: r.photos, page: r.page, limit: r.limit, total: r.total, pages: r.pages } });
      },
      (err) => active && setState({ kind: 'error', message: err instanceof Error ? err.message : 'Could not open the album.' }),
    );
    return () => {
      active = false;
    };
    // The photo login (a family's sign-in) and an unlocked code open it: asked again.
  }, [id, photoId, pageNo, limit, show, login, attempt]);

  const hero = (
    <ListingHero
      title={['Find your game photos']}
      blurb="Download your photos or put them on canvas, metal, frames, mugs and tees, printed in the USA and shipped to your door."
    />
  );

  if (state.kind === 'loading')
    return (
      <>
        {hero}
        <div className={s.page} data-header-tone="dark">
          <div className={`${s.head} ${s.skeleton}`} />
        </div>
      </>
    );
  if (state.kind === 'missing' || state.kind === 'error')
    return (
      <>
        {hero}
        <div className={s.page} data-header-tone="dark">
          <div className={s.head}>
            <Link href="/photos/" className={s.back}>
              ← All albums
            </Link>
            <p className={s.notice}>{state.kind === 'missing' ? 'This album isn’t available (it may have closed).' : state.message}</p>
          </div>
        </div>
      </>
    );

  const album = state.album;
  const note =
    album.access === 'family'
      ? 'Only parents and players on this team’s roster can see photos of players under 18. Ask the club if a photo of your child is missing.'
      : album.access === 'code'
        ? 'Only people with its code can open it, and its photos can’t be shared publicly.'
        : album.access === 'client'
          ? `A private gallery for ${album.clientName || 'its client'}.`
          : '';

  if (state.kind === 'locked')
    return (
      <>
        {hero}
        <div className={s.page} data-header-tone="dark">
          <AlbumHead album={album} />
          <div className={s.gate}>
            <PhotoGate kind={album.access === 'public' ? 'code' : album.access} notAdded={state.notAdded} onUnlocked={() => setAttempt((n) => n + 1)} />
          </div>
        </div>
      </>
    );

  const { page } = state;
  const photo = photoId ? page.photos.find((p) => p.id === photoId) : undefined;
  if (photoId && photo) {
    const index = page.photos.indexOf(photo);
    return (
      <>
        {hero}
        <div className={s.page} data-header-tone="dark">
          <PhotoView album={album} photo={photo} number={(page.page - 1) * page.limit + index + 1} photos={page.photos} />
        </div>
      </>
    );
  }

  return (
    <>
      {hero}
      <div className={s.page} data-header-tone="dark">
        <AlbumHead
          album={album}
          filters={FILTERS.map(([v, label]) => ({
            label,
            on: show === v,
            pick: () => {
              setShow(v);
              setPageNo(1);
              if (photoId) router.replace(albumHref(id), { scroll: false });
            },
          }))}
        />
        {note && (
          <p className={s.familyNote}>
            <strong>{album.access === 'family' ? 'Family album.' : album.access === 'code' ? 'Private album.' : 'Client gallery.'}</strong> {note}
          </p>
        )}
        <div ref={top} className={s.results}>
          {page.photos.length === 0 ? (
            <p className={s.empty}>{show === 'all' ? 'No photos in this album yet.' : 'No photos match this filter.'}</p>
          ) : (
            <>
              <div className={s.grid}>
                {page.photos.map((p, i) => (
                  <Link key={p.id} href={photoHref(album.id, p.id)} className={s.tile} aria-label={`Photo ${(page.page - 1) * page.limit + i + 1}`}>
                    <img src={p.thumb} alt="" loading={i < 8 ? 'eager' : 'lazy'} />
                    {p.download ? <span className={s.free}>Free</span> : p.print && from ? <span className={s.from}>From {dollars(from)}</span> : null}
                  </Link>
                ))}
              </div>
              {page.total > PHOTO_PAGE_SIZES[0] && (
                <Pager
                  className={s.pager}
                  page={page.page - 1}
                  pageCount={page.pages}
                  total={page.total}
                  shown={page.photos.length}
                  pageSize={limit}
                  sizes={PHOTO_PAGE_SIZES}
                  onPage={(n) => {
                    setPageNo(n + 1);
                    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  onPageSize={(n) => {
                    setLimit(n);
                    setPageNo(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** The album's card on the heading's edge: back to every album, its name and line, and its filters. */
function AlbumHead({ album, filters }: { album: LiveAlbum; filters?: { label: string; on: boolean; pick: () => void }[] }) {
  return (
    <div className={s.head}>
      <Link href="/photos/" className={s.back}>
        ← All albums
      </Link>
      <div className={s.headText}>
        <h2 className={s.title}>{album.name}</h2>
        <span className={s.meta}>
          {metaOf(album)} · {plural(album.count, 'photo')}
        </span>
      </div>
      {filters && (
        <div className={s.filters} role="group" aria-label="Show">
          {filters.map((f) => (
            <button key={f.label} type="button" aria-pressed={f.on} className={`${s.filter} ${f.on ? s.filterOn : ''}`} onClick={f.pick}>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A photo (the design's photo page): the chosen product with the photo on it, its front or back, and the album's
 * photos; beside it the free download (when the album offers it) and the prints and products with their options.
 */
function PhotoView({ album, photo, number, photos }: { album: LiveAlbum; photo: LivePhoto; number: number; photos: LivePhoto[] }) {
  // The products CLP offers on this album's photos (until they're read: the photo on its own, never a price that changes).
  const { products, ready } = usePrintProducts(album.partner);
  const [selection, setSelection] = useState<{ id: string; chosen: Record<string, string> }>({ id: '', chosen: {} });
  const product: PrintProduct | undefined = products.find((p) => p.id === selection.id) ?? products[0];
  const chosen = product && selection.id === product.id ? selection.chosen : product ? defaults(product) : {};
  const setChosen = (next: Record<string, string>) => product && setSelection({ id: product.id, chosen: next });
  const printable = Boolean(photo.print && ready && product);
  // Prints may be offered (until the products are read, a printable photo is taken to have some): the heading never changes.
  const offersPrints = photo.print && (!ready || products.length > 0);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [backs, setBacks] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const [size, setSize] = useState(420);
  const strip = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // The products' back photos (once), and the cart's count.
  useEffect(() => {
    let live = true;
    fetchPrintBacks().then((b) => live && setBacks(b));
    const load = () => setCartCount(readGalleryCart().length);
    load();
    const off = onGalleryCart(load);
    return () => {
      live = false;
      off();
    };
  }, []);
  // The mockup fits the stage (its padding off), up to 420 px.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setSize(Math.max(160, Math.min(420, Math.floor(el.clientWidth - 64))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The current photo stays in view in the strip.
  useEffect(() => {
    strip.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [photo.id]);

  const pick = (p: PrintProduct) => {
    setSelection({ id: p.id, chosen: defaults(p) });
    setSide('front');
    setAdded(false);
  };
  const price = product ? printPrice(product, chosen) : 0;
  const name = `Photo ${number} · ${album.name}`;
  const addPrint = () => {
    if (!product) return;
    const detail = product.options.map((o) => o.options.find((x) => x.value === chosen[o.id])?.label ?? chosen[o.id]).join(' · ');
    addToGalleryCart({ kind: 'print', photoId: photo.id, src: photo.thumb, name: product.name, detail: `${detail} · ${name}`, price, qty: 1 });
    setAdded(true);
  };

  return (
    <div className={s.photoLayout}>
      <div className={s.left}>
        <div className={s.stageCard}>
          <Link href={albumHref(album.id)} className={s.back}>
            ← {album.name}
          </Link>
          <div ref={stage} className={s.stage}>
            {printable && product ? (
              <>
                <span className={s.sideLabel}>{side === 'front' ? 'FRONT' : 'BACK'}</span>
                <Mockup
                  product={product}
                  chosen={chosen}
                  src={photo.web}
                  max={size}
                  back={side === 'back'}
                  backPhoto={side === 'back' ? backs[printBackKey(product, chosen) ?? ''] : undefined}
                />
              </>
            ) : (
              <img className={s.plain} src={photo.web} alt={`${album.name}, photo ${number}`} />
            )}
          </div>
          {printable && (
            <div className={s.sides} role="radiogroup" aria-label="Side">
              {(
                [
                  ['front', 'Front · your photo'],
                  ['back', 'Back'],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={side === v} className={`${s.sideBtn} ${side === v ? s.sideOn : ''}`} onClick={() => setSide(v)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {photos.length > 1 && (
          <div ref={strip} className={s.strip} aria-label="Photos in this album">
            {photos.map((p, i) => (
              <Link key={p.id} href={photoHref(album.id, p.id)} className={`${s.thumb} ${p.id === photo.id ? s.thumbOn : ''}`} aria-current={p.id === photo.id ? 'page' : undefined} aria-label={`Photo ${number - photos.indexOf(photo) + i}`} scroll={false}>
                <img src={p.thumb} alt="" loading="lazy" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className={s.buyCard}>
        <span className={s.kicker}>
          PHOTO {number} · {album.name}
        </span>
        <h2 className={s.buyTitle}>{offersPrints ? (photo.download ? 'Download it or put it on something' : 'Put it on something') : photo.download ? 'Download this photo' : 'This photo'}</h2>
        {photo.description && <p className={s.description}>{photo.description}</p>}

        {photo.download && (
          <a className={s.option} href={photo.download} download>
            <span>
              <strong>Free download</strong>
              <span>Full resolution · free for personal use</span>
            </span>
            <strong>Free</strong>
          </a>
        )}

        {photo.print && !ready ? (
          <p className={s.small} role="status">
            Loading prints and products…
          </p>
        ) : printable && product ? (
          <>
            <span className={s.label}>PRINTS &amp; PRODUCTS</span>
            <div className={s.products}>
              {products.map((p) => (
                <button key={p.id} type="button" aria-pressed={p.id === product.id} className={`${s.product} ${p.id === product.id ? s.productOn : ''}`} onClick={() => pick(p)}>
                  <strong>{p.name}</strong>
                  <span>from {dollars(printFrom(p))}</span>
                </button>
              ))}
            </div>
            {product.options.map((o) => {
              const current = o.options.find((x) => x.value === chosen[o.id]) ?? o.options[0];
              return (
                <div key={o.id} className={s.optGroup}>
                  <span className={s.optLabel}>{o.label}</span>
                  <div className={s.chips} role="radiogroup" aria-label={o.label}>
                    {o.options.map((x) => (
                      <button
                        key={x.value}
                        type="button"
                        role="radio"
                        aria-checked={x.value === current.value}
                        className={`${s.chip} ${x.value === current.value ? s.chipOn : ''}`}
                        onClick={() => {
                          setChosen({ ...chosen, [o.id]: x.value });
                          setAdded(false);
                        }}
                      >
                        {o.type === 'swatch' && <span className={s.swatch} style={{ background: x.swatch }} aria-hidden />}
                        {x.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className={s.priceRow}>
              <span>Ships in {product.ships}</span>
              <strong>{dollars(price)}</strong>
            </div>
            <button type="button" className={s.addCart} onClick={addPrint}>
              Add to cart · {dollars(price)}
            </button>
            {added && (
              <p className={s.added} role="status">
                Added to your cart.{' '}
                <button type="button" className={s.viewCart} onClick={() => setCartOpen(true)}>
                  View cart ({cartCount})
                </button>
              </p>
            )}
            <p className={s.small}>Printed on demand by our US print partner and shipped to your door.</p>
          </>
        ) : (
          <p className={s.small}>
            {album.forSale && !photo.print ? 'This photo is under 12 MP, too small to print well.' : 'Prints and products aren’t offered for this album.'}
            {photo.download ? ' You can still download it.' : ''}
          </p>
        )}
        <Link href="/content-creation-licensing/" className={s.license}>
          Media or brand? License this photo →
        </Link>
      </aside>
      {cartOpen && <GalleryCart onClose={closeCart} />}
    </div>
  );
}
