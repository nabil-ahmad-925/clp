'use client';
/* eslint-disable @next/next/no-img-element -- the albums' covers (presigned links), shown as they are. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LuSearch } from 'react-icons/lu';
import ListingHero from '@/components/sections/ListingHero';
import Pager from '@/components/ui/Pager';
import { albumsEnabled, fetchAllAlbums, type LiveAlbum } from '@/content/albums';
import s from './PhotosHome.module.css';

const PAGE_SIZES = [12, 24, 48] as const;
const fold = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

/** "Sat, Oct 24" (this year), "Sat, Oct 24, 2025", or "Oct 17–18" over several days. */
function cardDate(a: Pick<LiveAlbum, 'eventDate' | 'eventEndDate'>) {
  const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const thisYear = new Date().getUTCFullYear();
  const year = (iso: string) => (d(iso).getUTCFullYear() === thisYear ? {} : { year: 'numeric' as const });
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => d(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
  if (!a.eventEndDate) return fmt(a.eventDate, { weekday: 'short', month: 'short', day: 'numeric', ...year(a.eventDate) });
  const sameMonth = a.eventDate.slice(0, 7) === a.eventEndDate.slice(0, 7);
  const end = sameMonth ? fmt(a.eventEndDate, { day: 'numeric' }) : fmt(a.eventEndDate, { month: 'short', day: 'numeric' });
  const y = d(a.eventEndDate).getUTCFullYear();
  return `${fmt(a.eventDate, { month: 'short', day: 'numeric' })}–${end}${y === thisYear ? '' : `, ${y}`}`;
}

/** An open album (anyone), or a family album (its code, or the families signed in): the design's two labels. */
const isOpen = (a: LiveAlbum) => a.access === 'public';

/** An album's card: its cover (a family album's blurred), its label, name, date and place, and who took the photos. */
function AlbumCard({ album, eager }: { album: LiveAlbum; eager: boolean }) {
  const open = isOpen(album);
  const src = album.cover || album.preview;
  return (
    <Link href={`/photos/?album=${encodeURIComponent(album.id)}`} className={s.card}>
      <span className={s.cover}>
        {src && <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} className={open ? undefined : s.blur} />}
        <span className={open ? s.tagOpen : s.tagFamily}>{open ? 'OPEN ALBUM' : 'FAMILY ALBUM'}</span>
      </span>
      <span className={s.body}>
        <span className={s.title}>{album.name}</span>
        <span className={s.line}>{[cardDate(album), album.venue || album.city].filter(Boolean).join(' · ')}</span>
        <span className={s.muted}>
          Photos by {album.by} · {plural(album.count, 'photo')}
        </span>
      </span>
    </Link>
  );
}

/**
 * Find your game photos (/photos/, the Event photos & prints design): the search on the heading's edge (an event, team
 * or date, and the album code the photographer gave out), then every sport's albums as cards, newest event first. An
 * album code opens its album (/photos/?code=…); a card opens the album (/photos/?album=…), where a family album asks
 * for its code or the families' sign-in.
 */
export default function PhotosHome() {
  const router = useRouter();
  const [albums, setAlbums] = useState<LiveAlbum[] | null>(albumsEnabled ? null : []);
  const [failed, setFailed] = useState('');
  const [q, setQ] = useState('');
  const [code, setCode] = useState('');
  const [page, setPage] = useState({ key: '', index: 0 });
  const [size, setSize] = useState<number>(PAGE_SIZES[0]);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!albumsEnabled) return;
    let active = true;
    fetchAllAlbums().then(
      (items) => active && setAlbums(items),
      (err) => active && (setFailed(err instanceof Error ? err.message : 'Could not load the albums.'), setAlbums([])),
    );
    return () => {
      active = false;
    };
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (c) router.push(`/photos/?code=${encodeURIComponent(c.toUpperCase())}`);
    else top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const words = fold(q).split(/\s+/).filter(Boolean);
  const shown = (albums ?? []).filter((a) => {
    const text = fold([a.name, a.venue, a.city, a.by, a.ownerName, a.sportName, a.categoryName, cardDate(a), a.eventDate].join(' '));
    return words.every((w) => text.includes(w));
  });
  const key = JSON.stringify([q, size]);
  const pageCount = Math.max(1, Math.ceil(shown.length / size));
  const index = page.key === key ? Math.min(page.index, pageCount - 1) : 0;
  const onPage = shown.slice(index * size, (index + 1) * size);

  return (
    <>
      <ListingHero
        title={['Find your game photos']}
        blurb="Download your photos or put them on canvas, metal, frames, mugs and tees, printed in the USA and shipped to your door."
      />
      <div className={s.page} data-header-tone="dark">
        <form className={s.bar} onSubmit={submit} role="search">
          <label className={s.field}>
            <LuSearch aria-hidden />
            <input type="search" placeholder="Event, team or date, e.g. Fall Cup" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Event, team or date" />
          </label>
          <label className={`${s.field} ${s.codeField}`}>
            <input type="text" placeholder="Album code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Album code" autoCapitalize="characters" spellCheck={false} maxLength={40} />
          </label>
          <button type="submit" className={s.find}>
            Find Photos
          </button>
        </form>
        <p className={s.note}>Your photographer gives you a link or album code at the game. Albums with players under 18 only open for their families.</p>

        <div ref={top} className={s.results}>
          {!albums ? (
            <div className={s.grid} aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={s.skeleton} />
              ))}
            </div>
          ) : failed ? (
            <p className={s.empty} role="alert">
              {failed}
            </p>
          ) : shown.length === 0 ? (
            <p className={s.empty} role="status">
              {albums.length ? 'No albums match. Try another word, or enter your album code.' : 'No albums yet. Check back after the next game, or enter your album code.'}
            </p>
          ) : (
            <>
              <div className={s.grid}>
                {onPage.map((a, i) => (
                  <AlbumCard key={a.id} album={a} eager={i < 3} />
                ))}
              </div>
              {shown.length > PAGE_SIZES[0] && (
                <Pager
                  className={s.pager}
                  page={index}
                  pageCount={pageCount}
                  total={shown.length}
                  shown={onPage.length}
                  pageSize={size}
                  sizes={PAGE_SIZES}
                  onPage={(n) => {
                    setPage({ key, index: n });
                    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  onPageSize={(n) => {
                    setSize(n);
                    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
