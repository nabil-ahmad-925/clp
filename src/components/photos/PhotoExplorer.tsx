'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  albumDates,
  albumsEnabled,
  categoryOfSlug,
  FIRST_PAGE,
  PHOTO_PAGE_SIZES,
  fetchAlbum,
  fetchMyAlbums,
  fetchPhotoPage,
  fetchSportAlbums,
  liveAlbumHref,
  signOut,
  sportOfPage,
  toGalleryImage,
  type AlbumResult,
  type LiveAlbum,
  type PhotoPage,
  type PhotoQuery,
} from '@/content/albums';
import { ACCESS, PHOTOS_BLURB, dollars, type AlbumAccess } from '@/content/gallery';
import { partnerHref } from '@/content/partnerPages';
import type { PhotoAlbumRef, PhotoSection } from '@/content/photos';
import type { GalleryImage } from '@/content/types';
import GalleryCart from '@/components/sections/GalleryCart';
import GalleryLightbox from '@/components/sections/GalleryLightbox';
import PhotoGate from '@/components/sections/PhotoGate';
import Pager from '@/components/ui/Pager';
import usePhotoLogin from './usePhotoLogin';
import styles from './Photos.module.css';

/** What the photo page shows: the sport's home, a category's albums, a gate (family, client or a code), or an album. */
export type PhotoView =
  | { kind: 'home' }
  | { kind: 'category'; slug: string }
  | { kind: 'gate'; access: Exclude<AlbumAccess, 'public'>; code?: string }
  | { kind: 'album' }
  /** An album made in the admin (?album=<id>), fetched in the browser. */
  | { kind: 'live'; id: string };

type Props = PhotoSection & { view: PhotoView };

/** Accents, case and spaces don't matter ("futbol" finds "Fútbol"). */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const categoryHref = (sportHref: string, slug: string) => `${sportHref}?category=${encodeURIComponent(slug)}`;

/** The gates' headings (a gate view's hero, title and line). */
const GATE_COPY: Record<Exclude<AlbumAccess, 'public'>, { title: string; album: string; hero: string }> = {
  family: { title: 'My Family’s Photos', album: 'Your Family’s Photos', hero: 'Youth albums are private to the families of their players.' },
  client: { title: 'Client Gallery', album: 'Your Client Gallery', hero: 'Full-resolution files for the brands and teams we shoot for.' },
  code: { title: 'Private Event Album', album: 'Your Private Album', hero: 'Enter the access code from your photo card, ticket or invite.' },
};

/** The photo filter of an album: every photo, the free or paid downloads, or those that can be printed. */
type PhotoFilter = 'all' | 'free' | 'paid' | 'prints';
const FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: 'all', label: 'All Photos' },
  { id: 'free', label: 'Free Download' },
  { id: 'paid', label: 'Paid Download' },
  { id: 'prints', label: 'Prints & Products' },
];
/** A photo's download is paid when it has an HD price, free otherwise (unless its album offers none). */
const isPaid = (image: GalleryImage) => image.download != null;
const isFree = (image: GalleryImage) => !isPaid(image) && !image.noDownload;
/** Every built-in photo can be printed; an admin album's only when it is for sale (and the photo is print-quality). */
const isPrintable = (image: GalleryImage) => image.printable !== false;
/** An album made in the admin has no built-in photos (its pages come from the API). */
const NO_IMAGES: GalleryImage[] = [];
const matchesFilter = (image: GalleryImage, filter: PhotoFilter) =>
  filter === 'all' || (filter === 'prints' ? isPrintable(image) : filter === 'paid' ? isPaid(image) : isFree(image));

const Camera = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
const Lock = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * A sport's photos (new design: albums, viewer and print on demand), one experience across its views. The heading and
 * "Find your photos" (a code, an album's name or link; "My family's photos", "Client login") are on every view; then
 * the home's "Recent events" and "By category", a category's albums with their filters and access key, an album's
 * gate (family, client or code), or an album's photos with the viewer and the cart.
 */
export default function PhotoExplorer({ sport, albums, album, view }: Props) {
  const router = useRouter();
  const category = view.kind === 'category' ? albums.find((a) => a.slug === view.slug) : undefined;
  // The sport of the page (the built-in albums' page when this is another address of it).
  const sportSlug = sportOfPage(sport.href) ?? sportOfPage(albums[0]?.href.split('nggallery/')[0] ?? '');

  // The sport's albums made in the admin (home and category views).
  const [liveAlbums, setLiveAlbums] = useState<LiveAlbum[]>([]);
  const wantsList = view.kind === 'home' || view.kind === 'category';
  useEffect(() => {
    if (!wantsList || !sportSlug || !albumsEnabled) return;
    let active = true;
    fetchSportAlbums(sportSlug).then(
      (items) => active && setLiveAlbums(items),
      () => {},
    );
    return () => {
      active = false;
    };
  }, [wantsList, sportSlug]);

  // Signed in with a photo login: the albums of this sport it was added to show open (a client gallery only to them).
  const login = usePhotoLogin();
  const [mine, setMine] = useState<{ login: string; items: LiveAlbum[] } | null>(null);
  useEffect(() => {
    if (!wantsList || !login || !albumsEnabled) return;
    let active = true;
    fetchMyAlbums().then(
      (items) => active && setMine({ login, items: items.filter((a) => a.sport === sportSlug) }),
      () => {},
    );
    return () => {
      active = false;
    };
  }, [wantsList, login, sportSlug]);
  const myAlbums = login && mine?.login === login ? mine.items : [];
  const openIds = new Set(myAlbums.map((a) => a.id));
  const listed = [
    ...liveAlbums.map((a) => myAlbums.find((m) => m.id === a.id) ?? a),
    ...myAlbums.filter((m) => m.access === 'client' && !liveAlbums.some((a) => a.id === m.id)),
  ];

  // An album made in the admin (?album=<id>): open, locked (private, needs its code) or missing.
  const liveId = view.kind === 'live' ? view.id : '';
  const [attempt, setAttempt] = useState(0);
  const [liveState, setLiveState] = useState<{ id: string; result?: AlbumResult; error?: boolean } | null>(null);
  useEffect(() => {
    if (!liveId) return;
    let active = true;
    fetchAlbum(liveId).then(
      (result) => active && setLiveState({ id: liveId, result }),
      () => active && setLiveState({ id: liveId, error: true }),
    );
    return () => {
      active = false;
    };
    // Signing in or out opens or closes a families-only album or a client gallery.
  }, [liveId, attempt, login]);
  const liveNow = liveState && liveState.id === liveId ? liveState : null;
  const liveItem = liveNow?.result && liveNow.result.status !== 'missing' ? liveNow.result.item : undefined;
  // An open album made in the admin: its card and the first page of its photos (the album fetches the others).
  const liveResult = liveNow?.result;
  const liveOpen = useMemo(
    () =>
      liveResult?.status === 'open'
        ? { item: liveResult.item, first: { photos: liveResult.photos, page: liveResult.page, limit: liveResult.limit, total: liveResult.total, pages: liveResult.pages } }
        : undefined,
    [liveResult],
  );
  /** The built-in category album of a photo category (its tile, and the category view's address). */
  const staticOf = (cat: string) => albums.find((a) => categoryOfSlug(a.slug) === cat);

  // The heading of each view.
  const hero =
    view.kind === 'live'
      ? liveItem
        ? { title: liveItem.name, line: [albumDates(liveItem), liveItem.city].filter(Boolean).join(' · ') }
        : { title: sport.title, line: liveNow ? 'This album isn’t available.' : 'Loading the album…' }
      : view.kind === 'album' && album
      ? { title: album.title, line: '' }
      : view.kind === 'category' && category
        ? { title: category.category, line: 'Find your event by city and date.' }
        : view.kind === 'gate'
          ? { title: GATE_COPY[view.access].title, line: GATE_COPY[view.access].hero }
          : { title: sport.title, line: PHOTOS_BLURB };

  // The breadcrumb of each view (none on the home).
  const liveCategory = liveItem ? staticOf(liveItem.category) : undefined;
  const crumbs: { label: string; href?: string }[] =
    view.kind === 'live'
      ? [
          { label: sport.title, href: sport.href },
          ...(liveItem ? [{ label: liveCategory?.category ?? liveItem.categoryName, href: liveCategory ? categoryHref(sport.href, liveCategory.slug) : undefined }, { label: liveItem.name }] : []),
        ]
      : view.kind === 'album' && album
      ? [{ label: sport.title, href: sport.href }, { label: album.category, href: categoryHref(sport.href, album.slug) }, { label: album.title }]
      : view.kind === 'category' && category
        ? [{ label: sport.title, href: sport.href }, { label: category.category }]
        : view.kind === 'gate'
          ? [{ label: sport.title, href: sport.href }, { label: GATE_COPY[view.access].title }]
          : [];

  // "Find my photos": an album's name or link goes to it; anything else is a private album's code.
  const [query, setQuery] = useState('');
  const find = (e: FormEvent) => {
    e.preventDefault();
    const q = fold(query);
    if (!q) return;
    const match = albums.find((a) => q.includes(fold(a.href)) || q.includes(fold(a.slug)) || fold(a.title).includes(q) || fold(a.category).includes(q));
    router.push(match ? match.href : `${sport.href}?code=${encodeURIComponent(query.trim().toUpperCase())}`);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-header-tone="light" data-page-hero>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{hero.title}</h1>
          {hero.line && <p className={styles.heroLine}>{hero.line}</p>}
          {/* The breadcrumb on the heading's bottom line (as an article's heading). */}
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className={styles.crumbs}>
              {crumbs.map((c, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <span className={styles.crumbSep} aria-hidden>
                      ›
                    </span>
                  )}
                  {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </Fragment>
              ))}
            </nav>
          )}
        </div>
      </section>

      <div className={styles.finder} data-header-tone="dark">
        <form className={styles.findBar} onSubmit={find} role="search">
          <span className={styles.camera}>
            <Camera />
          </span>
          <input
            className={styles.findInput}
            aria-label="Photo code or event link"
            placeholder="Enter the code from your photo card, or paste an event link"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.findButton}>
            Find My Photos
          </button>
        </form>
        <div className={styles.findLinks}>
          <Link href={`${sport.href}?access=family`} className={styles.findLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="8" r="3" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 20c0-2.5 1.3-4.5 3-4.5s4 2 4 4.5" />
            </svg>
            My Family&rsquo;s Photos
          </Link>
          <span className={styles.findDivider} aria-hidden />
          <Link href={`${sport.href}?access=client`} className={styles.findLink}>
            <Lock />
            Client Login
          </Link>
        </div>
      </div>

      <div className={styles.body} data-header-tone="dark">
        {/* As the design: a client gallery isn't among the recent events or a category's count, only in its category. */}
        {view.kind === 'home' && <Home sport={sport} albums={albums} live={listed.filter((a) => a.access !== 'client')} openIds={openIds} />}
        {view.kind === 'category' && category && (
          <Category
            sport={sport}
            albums={albums.filter((a) => a.slug === category.slug)}
            live={listed.filter((a) => a.category === categoryOfSlug(category.slug))}
            openIds={openIds}
          />
        )}
        {view.kind === 'live' &&
          (!liveNow ? (
            <div className={styles.empty}>Loading the album…</div>
          ) : liveNow.error ? (
            <div className={styles.empty}>
              The album couldn&rsquo;t be loaded.{' '}
              <button type="button" className={styles.clear} onClick={() => setAttempt((n) => n + 1)}>
                Try Again
              </button>
            </div>
          ) : liveNow.result?.status === 'missing' ? (
            <div className={styles.empty}>
              This album isn&rsquo;t available (it may have closed). <Link href={sport.href}>See the other albums</Link>
            </div>
          ) : liveNow.result?.status === 'locked' ? (
            <section className={styles.album}>
              <AlbumHead access={liveNow.result.item.access} title={liveNow.result.item.name} line={`${albumDates(liveNow.result.item)} · Photos by ${liveNow.result.item.by}`} />
              {liveNow.result.item.access === 'code' ? (
                <PhotoGate key={liveId} kind="code" onUnlocked={() => setAttempt((n) => n + 1)} />
              ) : (
                <PhotoGate key={liveId} kind={liveNow.result.item.access === 'client' ? 'client' : 'family'} notAdded={liveNow.result.notAdded} />
              )}
            </section>
          ) : liveNow.result?.status === 'open' && liveOpen ? (
            <Album
              key={liveOpen.item.id}
              sport={sport}
              live={liveOpen}
              unlocked
              login={liveNow.result.item.access === 'family' || liveNow.result.item.access === 'client' ? login : null}
              banner={
                liveNow.result.item.access === 'client' ? (
                  <div className={styles.clientBanner}>
                    <strong>Client gallery for {liveNow.result.item.clientName}.</strong>
                    {liveNow.result.item.freeDownloads ? ' Full-resolution files, licensed for your brand’s use.' : ''}
                  </div>
                ) : undefined
              }
              album={{
                slug: liveNow.result.item.id,
                id: liveNow.result.item.id,
                title: liveNow.result.item.name,
                category: liveNow.result.item.categoryName,
                access: liveNow.result.item.access,
                by: liveNow.result.item.by,
                byHref: liveNow.result.item.partner ? partnerHref(liveNow.result.item.partner) : undefined,
                images: NO_IMAGES,
              }}
            />
          ) : null)}
        {view.kind === 'gate' && <Gate sport={sport} access={view.access} code={view.code} />}
        {view.kind === 'album' && album && <Album sport={sport} album={album} />}
      </div>
    </div>
  );
}

/** An album card (Recent events, a category's albums): its 4:3 cover with the access label (blurred and locked when not public). */
function AlbumCard({ album, sportTitle, eager }: { album: PhotoAlbumRef; sportTitle: string; eager?: boolean }) {
  const access = ACCESS[album.access];
  const locked = album.access !== 'public';
  return (
    <Link href={album.href} className={styles.card}>
      <span className={`${styles.cover} ${styles.coverWide}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the album's cover */}
        <img src={album.image} alt="" loading={eager ? 'eager' : 'lazy'} className={locked ? (album.access === 'family' ? styles.blurStrong : styles.blur) : undefined} />
        {locked && (
          <span className={styles.lockOverlay}>
            <Lock size={28} />
            {access.lock}
          </span>
        )}
        <span className={styles.accessLabel} style={{ background: access.bg, color: access.fg }}>
          {access.label}
        </span>
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>{album.title}</span>
        <span className={styles.cardLine}>
          {album.category} · {sportTitle.replace(/\s+Photos$/i, '')}
        </span>
        <span className={styles.cardMuted}>Compete Like Pros | {plural(album.count, 'photo')}</span>
      </span>
    </Link>
  );
}

/**
 * An album made in the admin, as the built-in cards: its cover (a locked one's tiny preview, blurred), its access
 * label, name, category and place, and who took the photos. `open`: a families-only album or a client gallery the
 * signed-in photo login was added to (its real cover, no lock).
 */
function LiveAlbumCard({ album, eager, open }: { album: LiveAlbum; eager?: boolean; open?: boolean }) {
  const access = ACCESS[album.access];
  const locked = album.access !== 'public' && !open;
  const src = album.cover || album.preview;
  return (
    <Link href={liveAlbumHref(album)} className={styles.card}>
      <span className={`${styles.cover} ${styles.coverWide}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the album's cover (a presigned link) */}
        {src && <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} className={locked ? styles.blurStrong : undefined} />}
        {locked && (
          <span className={styles.lockOverlay}>
            <Lock size={28} />
            {access.lock}
          </span>
        )}
        <span className={styles.accessLabel} style={{ background: access.bg, color: access.fg }}>
          {access.label}
        </span>
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>{album.name}</span>
        <span className={styles.cardLine}>{[albumDates(album), album.city].filter(Boolean).join(' · ')}</span>
        <span className={styles.cardMuted}>
          {album.by} | {plural(album.count, 'photo')}
        </span>
      </span>
    </Link>
  );
}

/** The home: the newest albums made in the admin, then the built-in ones with the most photos, as "Recent events"; then every category. */
function Home({ sport, albums, live, openIds }: { sport: PhotoSection['sport']; albums: PhotoAlbumRef[]; live: LiveAlbum[]; openIds: Set<string> }) {
  const recentLive = live.slice(0, 4);
  const recent = [...albums].filter((a) => a.access !== 'client').sort((a, b) => b.count - a.count).slice(0, 4 - recentLive.length);
  /** Event albums of a category: its built-in one and those made in the admin. */
  const inCategory = (a: PhotoAlbumRef) => (a.access === 'client' ? 0 : 1) + live.filter((l) => l.category === categoryOfSlug(a.slug)).length;
  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>FRESH FROM THE FIELD</span>
          <h2 className={styles.sectionTitle}>Recent Events</h2>
        </div>
        <div className={styles.grid}>
          {recentLive.map((a, i) => (
            <LiveAlbumCard key={a.id} album={a} eager={i < 4} open={openIds.has(a.id)} />
          ))}
          {recent.map((a, i) => (
            <AlbumCard key={a.slug} album={a} sportTitle={sport.title} eager={recentLive.length + i < 4} />
          ))}
        </div>
      </section>
      <section className={`${styles.section} ${styles.sectionLast}`}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>BROWSE</span>
          <h2 className={styles.sectionTitle}>By Category</h2>
        </div>
        <div className={styles.grid}>
          {albums.map((a) => (
            <Link key={a.slug} href={categoryHref(sport.href, a.slug)} className={styles.card}>
              <span className={styles.cover}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the category's cover */}
                <img src={a.image} alt="" loading="lazy" />
              </span>
              <span className={styles.cardText}>
                <span className={styles.catTitle}>{a.category}</span>
                <span className={styles.catCount}>{plural(inCategory(a), 'event album')}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/** A filter of the category view: a pill-shaped menu, black once something is chosen. */
function PillMenu({ label, value, options, onChange }: { label: string; value: string; options: { v: string; label: string }[]; onChange: (v: string) => void }) {
  const on = value !== 'all';
  return (
    <span className={styles.pillWrap}>
      <select aria-label={label} className={`${styles.pill} ${on ? styles.pillOn : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">{label}</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={styles.pillChevron}>
        <Chevron />
      </span>
    </span>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/**
 * A category's albums: city, date and access filters, the sort, the count with the access key, and the album cards
 * (the albums made in the admin, newest event first, then the built-in one, which has no city or date).
 */
function Category({ sport, albums, live, openIds }: { sport: PhotoSection['sport']; albums: PhotoAlbumRef[]; live: LiveAlbum[]; openIds: Set<string> }) {
  const [city, setCity] = useState('all');
  const [month, setMonth] = useState('all');
  const [access, setAccess] = useState('all');
  const [sort, setSort] = useState<'new' | 'old'>('new');
  const accessOk = (a: { access: string }) => access === 'all' || (access === 'public' ? a.access === 'public' : a.access !== 'public');
  const liveShown = live
    .filter((a) => accessOk(a) && (city === 'all' || a.city === city) && (month === 'all' || a.eventDate.slice(0, 7) === month))
    .sort((a, b) => (sort === 'new' ? b.eventDate.localeCompare(a.eventDate) : a.eventDate.localeCompare(b.eventDate)));
  // The built-in album has no city or date: a city or date filter leaves it out.
  const shown = city === 'all' && month === 'all' ? albums.filter(accessOk) : [];
  const ordered = sort === 'new' ? shown : [...shown].reverse();
  const filtered = city !== 'all' || month !== 'all' || access !== 'all';
  const cities = [...new Set(live.map((a) => a.city).filter(Boolean))].sort().map((c) => ({ v: c, label: c }));
  const months = [...new Set(live.map((a) => a.eventDate.slice(0, 7)))].sort().reverse().map((m) => ({ v: m, label: monthName(m) }));
  const total = ordered.length + liveShown.length;
  const clear = () => {
    setCity('all');
    setMonth('all');
    setAccess('all');
  };
  return (
    <section className={styles.category}>
      <div className={styles.filterRow}>
        <div className={styles.filters}>
          {/* Cities and dates are the event details of the albums made in the admin. */}
          <PillMenu label="All cities" value={city} options={cities} onChange={setCity} />
          <PillMenu label="Any date" value={month} options={months} onChange={setMonth} />
          <PillMenu
            label="All albums"
            value={access}
            options={[
              { v: 'public', label: 'Public only' },
              { v: 'private', label: 'Private & members' },
            ]}
            onChange={setAccess}
          />
          {filtered && (
            <button type="button" className={styles.clear} onClick={clear}>
              Clear
            </button>
          )}
        </div>
        <span className={styles.pillWrap}>
          <select aria-label="Sort" className={styles.pill} value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'old')}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
          <span className={styles.pillChevron}>
            <Chevron />
          </span>
        </span>
      </div>
      <div className={styles.countRow}>
        <span className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swPublic}`} aria-hidden />
            Public
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swCode}`} aria-hidden />
            Private: code required
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swFamily}`} aria-hidden />
            Families only
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swClient}`} aria-hidden />
            Client gallery
          </span>
        </span>
      </div>
      {total === 0 ? (
        <div className={styles.empty}>
          No albums match these filters.{' '}
          <button type="button" className={styles.clear} onClick={clear}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.gridTall}`}>
          {liveShown.map((a, i) => (
            <LiveAlbumCard key={a.id} album={a} eager={i < 4} open={openIds.has(a.id)} />
          ))}
          {ordered.map((a, i) => (
            <AlbumCard key={a.slug} album={a} sportTitle={sport.title} eager={liveShown.length + i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}

/** An album's heading: its access label, name and line. */
function AlbumHead({ access, title, line, children }: { access: AlbumAccess; title: string; line: string; children?: ReactNode }) {
  const label = ACCESS[access];
  return (
    <div className={styles.albumHeadRow}>
      <div className={styles.albumHead}>
        <span className={styles.badge} style={{ background: label.bg, color: label.fg }}>
          {label.label}
        </span>
        <h2 className={styles.albumTitle}>{title}</h2>
        <span className={styles.albumLine}>{line}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * A gate view ("My family's photos", "Client login", a private code): the album heading and its gate; signed in with a
 * photo login, its families-only albums or client galleries.
 */
function Gate({ sport, access, code }: { sport: PhotoSection['sport']; access: Exclude<AlbumAccess, 'public'>; code?: string }) {
  return (
    <section className={styles.album}>
      <AlbumHead access={access} title={GATE_COPY[access].album} line={`${sport.title} · Photos by Compete Like Pros`} />
      {access === 'code' ? <PhotoGate key={`${access}-${code ?? ''}`} kind={access} initialCode={code} /> : <MyAlbums kind={access} />}
    </section>
  );
}

/** Who is signed in with a photo login, and signing out. */
function SignedInLine({ email }: { email: string }) {
  return (
    <p className={styles.signedIn}>
      Signed in as <strong>{email}</strong> ·{' '}
      <button type="button" className={styles.signOut} onClick={() => void signOut()}>
        Sign Out
      </button>
    </p>
  );
}

/**
 * The albums of the signed-in photo login (every sport's): its families-only albums or client galleries (`kind`), or
 * all of them (the invitation e-mail's /photos/?signin=1). Signed out, its sign-in.
 */
export function MyAlbums({ kind }: { kind?: 'family' | 'client' }) {
  const login = usePhotoLogin();
  const [state, setState] = useState<{ login: string; items?: LiveAlbum[]; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!login) return;
    let active = true;
    fetchMyAlbums().then(
      (items) => active && setState({ login, items }),
      (err) => active && setState({ login, error: err instanceof Error ? err.message : 'Your albums couldn’t be loaded.' }),
    );
    return () => {
      active = false;
    };
  }, [login, attempt]);

  if (!login) return <PhotoGate kind={kind ?? 'login'} />;
  const now = state?.login === login ? state : null;
  const items = now?.items?.filter((a) => !kind || a.access === kind);
  return (
    <div className={styles.mine}>
      <SignedInLine email={login} />
      {!now ? (
        <div className={styles.empty}>Loading your albums…</div>
      ) : now.error ? (
        <div className={styles.empty}>
          {now.error}{' '}
          <button type="button" className={styles.clear} onClick={() => setAttempt((n) => n + 1)}>
            Try Again
          </button>
        </div>
      ) : items && items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((a, i) => (
            <LiveAlbumCard key={a.id} album={a} eager={i < 4} open />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          {kind === 'family' ? 'No families-only albums' : kind === 'client' ? 'No client galleries' : 'No albums'} for this login yet. Ask the organizer to add
          your email.
        </div>
      )}
    </div>
  );
}

/**
 * An album: its photo tabs, then a page of its photos and the pager, the viewer and the cart. A built-in album pages
 * through its photos here; an album made in the admin (`live`) asks the API for each page (its tab, page and size), and
 * the viewer steps on to the next or previous page at a page's ends. A locked one: its heading and its gate.
 */
function Album({
  sport,
  album,
  live,
  unlocked,
  login,
  banner,
}: {
  sport: PhotoSection['sport'];
  /** `byHref`: the photographer's partner page. */
  album: NonNullable<PhotoSection['album']> & { by?: string; byHref?: string };
  /** An album made in the admin: its card and the first page of its photos (`album.images` is then unused). */
  live?: { item: LiveAlbum; first: PhotoPage };
  /** A private album opened by its code, or a families-only one or a client gallery by a photo login (made in the admin). */
  unlocked?: boolean;
  /** The photo login it was opened with (shown, with signing out). */
  login?: string | null;
  /** Shown over the photos (an open client gallery's line). */
  banner?: ReactNode;
}) {
  const [filter, setFilter] = useState<PhotoFilter>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PHOTO_PAGE_SIZES[0]);
  const [open, setOpen] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const locked = album.access !== 'public' && !unlocked;

  // An album made in the admin: the page shown, the one being fetched and whether that failed.
  const [livePage, setLivePage] = useState<PhotoPage | null>(live?.first ?? null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<PhotoQuery | null>(null);
  const asked = useRef(0);
  /** Fetches a page (the latest asked wins); `then` gets it once shown (the viewer's photo on it). */
  const load = useCallback(
    (q: PhotoQuery, then?: (p: PhotoPage) => void) => {
      if (!live) return;
      const n = ++asked.current;
      setLoading(true);
      setFailed(null);
      fetchPhotoPage(live.item, q).then(
        (p) => {
          if (n !== asked.current) return;
          setLivePage(p);
          setLoading(false);
          then?.(p);
        },
        () => {
          if (n !== asked.current) return;
          setLoading(false);
          setFailed(q);
        },
      );
    },
    [live],
  );

  // A built-in album's photos of the tab, and the page of them shown.
  const shown = useMemo(() => album.images.filter((image) => matchesFilter(image, filter)), [album.images, filter]);
  const total = live ? (livePage?.total ?? 0) : shown.length;
  const size = live ? (livePage?.limit ?? pageSize) : pageSize;
  const pageCount = live ? (livePage?.pages ?? 1) : Math.max(1, Math.ceil(shown.length / pageSize));
  const current = live ? (livePage?.page ?? 1) - 1 : Math.min(page, pageCount - 1);
  const offset = current * size;
  const pagePhotos = useMemo(
    () => (live ? (livePage?.photos ?? []).map((p, i) => toGalleryImage(live.item, p, offset + i)) : shown.slice(offset, offset + pageSize)),
    [live, livePage, shown, offset, pageSize],
  );
  // What the viewer steps through: a built-in album's whole tab, an admin album's page.
  const viewing = live ? pagePhotos : shown;

  const scrollUp = () => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pick = (f: PhotoFilter) => {
    setFilter(f);
    setPage(0);
    if (live) load({ page: 1, limit: size, show: f });
  };
  const goTo = (n: number) => {
    if (live) load({ page: n + 1, limit: size, show: filter }, scrollUp);
    else {
      setPage(n);
      scrollUp();
    }
  };
  const resize = (n: number) => {
    setPageSize(n);
    setPage(0);
    if (live) load({ page: 1, limit: n, show: filter }, scrollUp);
    else scrollUp();
  };
  const clear = () => pick('all');

  // The open photo is kept in the URL (#gallery/<id>/<photo id>): a link to it opens it (an admin album's on its page).
  useEffect(() => {
    const match = window.location.hash.match(/^#gallery\/([^/]+)\/([^/]+)/);
    if (!match || match[1] !== album.id || locked) return;
    const photoId = match[2];
    if (live) {
      const at = live.first.photos.findIndex((p) => p.id === photoId);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the photo named in the URL on arrival
      if (at >= 0) setOpen(at);
      else
        load({ ...FIRST_PAGE, limit: live.first.limit, at: photoId }, (p) => {
          const i = p.photos.findIndex((x) => x.id === photoId);
          if (i >= 0) setOpen(i);
        });
      return;
    }
    const index = album.images.findIndex((image) => image.id === photoId);
    if (index >= 0) setOpen(index);
  }, [album.id, album.images, locked, live, load]);

  const mark = (photoId: string) => window.history.replaceState(null, '', `#gallery/${album.id}/${photoId}`);
  const show = useCallback(
    (index: number) => {
      setOpen(index);
      // A built-in album's grid follows the viewer to the photo's page.
      if (!live) setPage(Math.floor(index / pageSize));
      const photo = viewing[index];
      if (photo) window.history.replaceState(null, '', `#gallery/${album.id}/${photo.id}`);
    },
    [album.id, viewing, pageSize, live],
  );
  /** The viewer past the first or last photo of an admin album's page: the page before or after (round to the other end). */
  const edge = (step: 1 | -1) => {
    if (!livePage) return;
    const next = step === 1 ? (livePage.page % livePage.pages) + 1 : ((livePage.page - 2 + livePage.pages) % livePage.pages) + 1;
    load({ page: next, limit: livePage.limit, show: filter }, (p) => {
      const i = step === 1 ? 0 : p.photos.length - 1;
      setOpen(i);
      if (p.photos[i]) mark(p.photos[i].id);
    });
  };
  const close = useCallback(() => {
    setOpen(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  if (locked) {
    return (
      <section className={styles.album}>
        <AlbumHead access={album.access} title={album.title} line={`${sport.title} · Photos by ${album.by ?? 'Compete Like Pros'}`} />
        <PhotoGate kind={album.access as Exclude<AlbumAccess, 'public'>} />
      </section>
    );
  }

  return (
    <section ref={top} className={styles.album}>
      <div className={styles.photoFilters}>
        <div className={styles.photoFilter} role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={`${styles.photoTab} ${filter === f.id ? styles.photoTabOn : ''}`} aria-pressed={filter === f.id} onClick={() => pick(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {login && <SignedInLine email={login} />}
      {banner}

      {failed ? (
        <div className={styles.empty}>
          These photos couldn&rsquo;t be loaded.{' '}
          <button type="button" className={styles.clear} onClick={() => load(failed)}>
            Try Again
          </button>
        </div>
      ) : total === 0 && !loading ? (
        <div className={styles.empty}>
          No photos match this filter.{' '}
          <button type="button" className={styles.clear} onClick={clear}>
            Show All
          </button>
        </div>
      ) : (
        <div className={`${styles.masonry} ${loading ? styles.masonryBusy : ''}`} aria-label={`${album.title} photos`} aria-busy={loading}>
          {pagePhotos.map((image, i) => {
            const paid = isPaid(image);
            const at = offset + i;
            return (
              <a
                key={image.id}
                href={image.full}
                className={styles.photo}
                aria-label={`Open photo ${at + 1} of ${total}`}
                onClick={(e) => {
                  e.preventDefault();
                  show(live ? i : at);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the original 400px-high gallery file */}
                <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={i < 12 ? 'eager' : 'lazy'} />
                <span className={`${styles.tag} ${paid ? styles.tagPaid : ''}`}>
                  {[paid ? dollars(image.download!) : image.noDownload ? '' : 'Free', isPrintable(image) ? 'Prints' : ''].filter(Boolean).join(' · ') || 'View only'}
                </span>
              </a>
            );
          })}
        </div>
      )}
      {!failed && total > PHOTO_PAGE_SIZES[0] && (
        <Pager page={current} pageCount={pageCount} total={total} shown={pagePhotos.length} pageSize={size} sizes={PHOTO_PAGE_SIZES} onPage={goTo} onPageSize={resize} />
      )}

      {open !== null && viewing[open] && (
        <GalleryLightbox
          galleryId={album.id}
          albumTitle={album.title}
          shareable={album.access === 'public'}
          by={album.by}
          byHref={album.byHref}
          images={viewing}
          index={open}
          startTab={filter === 'prints' ? 'print' : 'digital'}
          onIndex={show}
          onClose={close}
          onOpenCart={() => setCartOpen(true)}
          paged={live && livePage ? { offset, total, onEdge: edge } : undefined}
        />
      )}
      {cartOpen && <GalleryCart onClose={closeCart} />}
    </section>
  );
}
