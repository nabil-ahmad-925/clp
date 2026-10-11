import taxonomy from './data/photoTaxonomy.json';
import type { GalleryImage } from './types';

/**
 * Photo albums made in the admin (CLP's and partners'; clp-api albums-read): the site is a static export, so they are
 * fetched in the browser and shown on their sport's photo page next to the built-in albums. A private album opens with
 * its code, asked again on every visit: the token that unlocks it lives only in this page's memory (kept while browsing
 * the site, gone on a reload, a new tab or a later visit).
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');
export const albumsEnabled = Boolean(API_URL);
const TIMEOUT_MS = 10_000;

export const PHOTO_SPORTS = taxonomy.sports;
export const PHOTO_CATEGORIES = taxonomy.categories;

/** The sport of a sport photo page ("/experiences/futbol/futbol-soccer-photos/" -> "futbol-soccer"). */
export const sportOfPage = (path: string) => PHOTO_SPORTS.find((s) => s.page === path)?.slug;
/** A sport's photo page. */
export const pageOfSport = (sport: string) => PHOTO_SPORTS.find((s) => s.slug === sport)?.page;
/** The photo category of a built-in album's slug ("futbol-soccer-camps-tournaments" -> "camps-tournaments"). */
export const categoryOfSlug = (slug: string) => PHOTO_CATEGORIES.find((c) => slug.endsWith(`-${c.slug}`))?.slug;

export type LiveAlbum = {
  id: string;
  name: string;
  sport: string;
  sportName: string;
  category: string;
  categoryName: string;
  type: string;
  eventDate: string;
  eventEndDate?: string;
  city: string;
  venue: string;
  /** "Photos by …". */
  by: string;
  ownerName: string;
  access: 'public' | 'code';
  freeDownloads: boolean;
  forSale: boolean;
  count: number;
  /** The cover's link (none for a locked private album). */
  cover: string;
  /** A tiny version of the cover (a data URL), drawn blurred on a locked album. */
  preview: string;
};

export type LivePhoto = { id: string; width: number; height: number; thumb: string; web: string; print: boolean; download?: string; takenAt?: string };

class AlbumError extends Error {
  constructor(
    message: string,
    public code?: string,
    public item?: LiveAlbum,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new AlbumError('Albums are not available here.');
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AlbumError(body.error ?? `Albums: ${res.status}`, body.code, body.item);
  return body as T;
}

/** A sport's published albums (newest event first); private ones come locked (no photo links). */
export const fetchSportAlbums = (sport: string) => call<{ items: LiveAlbum[] }>(`/albums?sport=${encodeURIComponent(sport)}`).then((r) => r.items);

/** Unlocked private albums' tokens, in memory only: never stored, so the code is asked again on the next visit. */
const tokens = new Map<string, { token: string; expiresAt: string }>();

// Tokens an earlier version kept for the browser session are dropped.
try {
  if (typeof window !== 'undefined') sessionStorage.removeItem('clp-album-tokens');
} catch {
  // Storage blocked: nothing was kept.
}

/** The token that opens a private album, if it was unlocked during this visit and hasn't expired. */
export const albumToken = (id: string) => {
  const t = tokens.get(id);
  return t && Date.parse(t.expiresAt) > Date.now() ? t.token : undefined;
};
const keepToken = (id: string, token: string, expiresAt: string) => {
  tokens.set(id, { token, expiresAt });
};

export type AlbumResult = { status: 'open'; item: LiveAlbum; photos: LivePhoto[] } | { status: 'locked'; item: LiveAlbum } | { status: 'missing' };

/** An album and its photos; a private one without a valid token is "locked" (with its card). */
export async function fetchAlbum(id: string): Promise<AlbumResult> {
  const token = albumToken(id);
  try {
    const r = await call<{ item: LiveAlbum; photos: LivePhoto[] }>(`/albums/${encodeURIComponent(id)}${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    return { status: 'open', ...r };
  } catch (err) {
    if (err instanceof AlbumError && err.code === 'LOCKED' && err.item) return { status: 'locked', item: err.item };
    if (err instanceof AlbumError && err.code === 'NOT_FOUND') return { status: 'missing' };
    throw err;
  }
}

/** Opens the private album of a code (for the rest of this visit); throws with a message to show. */
export async function unlockAlbum(code: string): Promise<LiveAlbum> {
  const r = await call<{ item: LiveAlbum; token: string; expiresAt: string }>('/albums/unlock', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  keepToken(r.item.id, r.token, r.expiresAt);
  return r.item;
}

/** The address of a live album on its sport's photo page. */
export const liveAlbumHref = (album: Pick<LiveAlbum, 'id' | 'sport'>) => `${pageOfSport(album.sport) ?? '/'}?album=${encodeURIComponent(album.id)}`;

/** "Oct 17, 2026" or "Oct 17–18, 2026". */
export function albumDates(a: Pick<LiveAlbum, 'eventDate' | 'eventEndDate'>) {
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
  if (!a.eventEndDate) return fmt(a.eventDate, { month: 'short', day: 'numeric', year: 'numeric' });
  return a.eventDate.slice(0, 7) === a.eventEndDate.slice(0, 7)
    ? `${fmt(a.eventDate, { month: 'short', day: 'numeric' })}–${fmt(a.eventEndDate, { day: 'numeric' })}, ${a.eventEndDate.slice(0, 4)}`
    : `${fmt(a.eventDate, { month: 'short', day: 'numeric' })} – ${fmt(a.eventEndDate, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

/** A live photo as the photo viewer shows it (its web size full screen; a free download when the album offers them). */
export const toGalleryImage = (album: LiveAlbum, p: LivePhoto, i: number): GalleryImage => ({
  id: p.id,
  src: p.thumb,
  full: p.web,
  thumb: p.thumb,
  width: p.width,
  height: p.height,
  title: `${album.name} · photo ${i + 1}`,
  alt: `${album.name}, photo ${i + 1}`,
  downloadUrl: p.download,
  noDownload: !p.download,
  printable: p.print,
  // Why it can't be printed: the album isn't for sale, or the photo is under 12 MP (download-only).
  ...(p.print
    ? {}
    : {
        printNote: album.forSale
          ? 'This photo is under 12 MP, too small to print well. You can still download it.'
          : 'Prints and products aren’t offered for this album.',
      }),
});
