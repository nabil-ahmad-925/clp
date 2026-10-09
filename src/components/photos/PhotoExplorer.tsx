'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ACCESS, PHOTOS_BLURB, dollars, type AlbumAccess } from '@/content/gallery';
import type { PhotoAlbumRef, PhotoSection } from '@/content/photos';
import type { GalleryImage } from '@/content/types';
import GalleryCart from '@/components/sections/GalleryCart';
import GalleryLightbox from '@/components/sections/GalleryLightbox';
import PhotoGate from '@/components/sections/PhotoGate';
import styles from './Photos.module.css';

/** What the photo page shows: the sport's home, a category's albums, a gate (family, client or a code), or an album. */
export type PhotoView =
  | { kind: 'home' }
  | { kind: 'category'; slug: string }
  | { kind: 'gate'; access: Exclude<AlbumAccess, 'public'>; code?: string }
  | { kind: 'album' };

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
  family: { title: 'My family’s photos', album: 'Your family’s photos', hero: 'Youth albums are private to the families of their players.' },
  client: { title: 'Client gallery', album: 'Your client gallery', hero: 'Full-resolution files for the brands and teams we shoot for.' },
  code: { title: 'Private event album', album: 'Your private album', hero: 'Enter the access code from your photo card, ticket or invite.' },
};

/** The photo filter of an album: every photo, the free or paid downloads, or those that can be printed. */
type PhotoFilter = 'all' | 'free' | 'paid' | 'prints';
const FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free download' },
  { id: 'paid', label: 'Paid download' },
  { id: 'prints', label: 'Prints & products' },
];
/** A photo's download is paid when it has an HD price, free otherwise; every photo can be printed. */
const isPaid = (image: GalleryImage) => image.download != null;

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

  // The heading of each view.
  const hero =
    view.kind === 'album' && album
      ? { title: album.title, line: `${plural(album.images.length, 'photo')} · ${sport.title}` }
      : view.kind === 'category' && category
        ? { title: category.category, line: 'Find your event by city and date.' }
        : view.kind === 'gate'
          ? { title: GATE_COPY[view.access].title, line: GATE_COPY[view.access].hero }
          : { title: sport.title, line: PHOTOS_BLURB };

  // The breadcrumb of each view (none on the home).
  const crumbs: { label: string; href?: string }[] =
    view.kind === 'album' && album
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
          <p className={styles.heroLine}>{hero.line}</p>
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
            Find my photos
          </button>
        </form>
        <div className={styles.findLinks}>
          <Link href={`${sport.href}?access=family`} className={styles.findLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="8" r="3" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 20c0-2.5 1.3-4.5 3-4.5s4 2 4 4.5" />
            </svg>
            My family&rsquo;s photos
          </Link>
          <span className={styles.findDivider} aria-hidden />
          <Link href={`${sport.href}?access=client`} className={styles.findLink}>
            <Lock />
            Client login
          </Link>
        </div>
      </div>

      <div className={styles.body} data-header-tone="dark">
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

        {view.kind === 'home' && <Home sport={sport} albums={albums} />}
        {view.kind === 'category' && category && <Category sport={sport} albums={albums.filter((a) => a.slug === category.slug)} />}
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
        <span className={styles.cardMuted}>Compete Like Pros · {plural(album.count, 'photo')}</span>
      </span>
    </Link>
  );
}

/** The home: the albums with the most photos as "Recent events", then every category. */
function Home({ sport, albums }: { sport: PhotoSection['sport']; albums: PhotoAlbumRef[] }) {
  const recent = [...albums].filter((a) => a.access !== 'client').sort((a, b) => b.count - a.count).slice(0, 4);
  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>FRESH FROM THE FIELD</span>
          <h2 className={styles.sectionTitle}>Recent events</h2>
        </div>
        <div className={styles.grid}>
          {recent.map((a, i) => (
            <AlbumCard key={a.slug} album={a} sportTitle={sport.title} eager={i < 4} />
          ))}
        </div>
      </section>
      <section className={`${styles.section} ${styles.sectionLast}`}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>BROWSE</span>
          <h2 className={styles.sectionTitle}>By category</h2>
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
                <span className={styles.catCount}>{plural(a.access === 'client' ? 0 : 1, 'event album')}</span>
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

/** A category's albums: city, date and access filters, the sort, the count with the access key, and the album cards. */
function Category({ sport, albums }: { sport: PhotoSection['sport']; albums: PhotoAlbumRef[] }) {
  const [city, setCity] = useState('all');
  const [month, setMonth] = useState('all');
  const [access, setAccess] = useState('all');
  const [sort, setSort] = useState<'new' | 'old'>('new');
  const shown = albums.filter((a) => access === 'all' || (access === 'public' ? a.access === 'public' : a.access !== 'public'));
  const ordered = sort === 'new' ? shown : [...shown].reverse();
  const filtered = city !== 'all' || month !== 'all' || access !== 'all';
  const clear = () => {
    setCity('all');
    setMonth('all');
    setAccess('all');
  };
  return (
    <section className={styles.category}>
      <div className={styles.filterRow}>
        <div className={styles.filters}>
          {/* Cities and dates come with the albums' event details (none yet). */}
          <PillMenu label="All cities" value={city} options={[]} onChange={setCity} />
          <PillMenu label="Any date" value={month} options={[]} onChange={setMonth} />
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
        <strong>{plural(ordered.length, 'event album')}</strong>
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
      {ordered.length === 0 ? (
        <div className={styles.empty}>
          No albums match these filters.{' '}
          <button type="button" className={styles.clear} onClick={clear}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.gridTall}`}>
          {ordered.map((a, i) => (
            <AlbumCard key={a.slug} album={a} sportTitle={sport.title} eager={i < 4} />
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

/** A gate view ("My family's photos", "Client login", a private code): the album heading and its gate. */
function Gate({ sport, access, code }: { sport: PhotoSection['sport']; access: Exclude<AlbumAccess, 'public'>; code?: string }) {
  return (
    <section className={styles.album}>
      <AlbumHead access={access} title={GATE_COPY[access].album} line={`${sport.title} · Photos by Compete Like Pros`} />
      <PhotoGate key={`${access}-${code ?? ''}`} kind={access} initialCode={code} />
    </section>
  );
}

/** An album: its heading and photo filter, then its photos (or its gate), the viewer and the cart. */
function Album({ sport, album }: { sport: PhotoSection['sport']; album: NonNullable<PhotoSection['album']> }) {
  const [filter, setFilter] = useState<PhotoFilter>('all');
  const [open, setOpen] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const locked = album.access !== 'public';
  const shown = useMemo(
    () => album.images.filter((image) => filter === 'all' || filter === 'prints' || (filter === 'paid' ? isPaid(image) : !isPaid(image))),
    [album.images, filter],
  );

  // The open photo is kept in the URL (#gallery/<id>/<photo id>): a link to it opens it.
  useEffect(() => {
    const match = window.location.hash.match(/^#gallery\/([^/]+)\/([^/]+)/);
    if (!match || match[1] !== album.id || locked) return;
    const index = album.images.findIndex((image) => image.id === match[2]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the photo named in the URL on arrival
    if (index >= 0) setOpen(index);
  }, [album.id, album.images, locked]);
  const show = useCallback(
    (index: number) => {
      setOpen(index);
      window.history.replaceState(null, '', `#gallery/${album.id}/${shown[index].id}`);
    },
    [album.id, shown],
  );
  const close = useCallback(() => {
    setOpen(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    <section className={styles.album}>
      <AlbumHead access={album.access} title={album.title} line={`${plural(album.images.length, 'photo')} · ${sport.title} · Photos by Compete Like Pros`}>
        {!locked && (
          <div className={styles.photoFilter} role="group" aria-label="Show">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={`${styles.photoTab} ${filter === f.id ? styles.photoTabOn : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </AlbumHead>

      {locked ? (
        <PhotoGate kind={album.access as Exclude<AlbumAccess, 'public'>} />
      ) : shown.length === 0 ? (
        <div className={styles.empty}>
          No photos match this filter.{' '}
          <button type="button" className={styles.clear} onClick={() => setFilter('all')}>
            Show all
          </button>
        </div>
      ) : (
        <div className={styles.masonry} aria-label={`${album.title} photos`}>
          {shown.map((image, i) => {
            const paid = isPaid(image);
            return (
              <a
                key={image.id}
                href={image.full}
                className={styles.photo}
                aria-label={`Open photo ${i + 1} of ${shown.length}`}
                onClick={(e) => {
                  e.preventDefault();
                  show(i);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the original 400px-high gallery file */}
                <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={i < 12 ? 'eager' : 'lazy'} />
                <span className={`${styles.tag} ${paid ? styles.tagPaid : ''}`}>{`${paid ? dollars(image.download!) : 'Free'} · Prints`}</span>
              </a>
            );
          })}
        </div>
      )}

      {open !== null && shown[open] && (
        <GalleryLightbox
          galleryId={album.id}
          albumTitle={album.title}
          shareable={album.access === 'public'}
          images={shown}
          index={open}
          startTab={filter === 'prints' ? 'print' : 'digital'}
          onIndex={show}
          onClose={close}
          onOpenCart={() => setCartOpen(true)}
        />
      )}
      {cartOpen && <GalleryCart onClose={closeCart} />}
    </section>
  );
}
