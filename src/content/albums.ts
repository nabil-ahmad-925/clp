import taxonomy from './data/photoTaxonomy.json';
import type { GalleryImage } from './types';

/**
 * Photo albums made in the admin (CLP's and partners'; clp-api albums-read): the site is a static export, so they are
 * fetched in the browser and shown on their sport's photo page next to the built-in albums. A private album opens with
 * its code, asked again on every visit: the token that unlocks it lives only in this page's memory (kept while browsing
 * the site, gone on a reload, a new tab or a later visit). A families-only album or a client gallery opens for the
 * people its owner added, signed in with their photo login (clp-api album-viewers; see "Photo logins" below).
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
  access: 'public' | 'code' | 'family' | 'client';
  /** An open client gallery's client ("Client gallery for …"). */
  clientName?: string;
  freeDownloads: boolean;
  forSale: boolean;
  count: number;
  /** The cover's link (none for a locked private album). */
  cover: string;
  /** A tiny version of the cover (a data URL), drawn blurred on a locked album. */
  preview: string;
};

export type LivePhoto = { id: string; width: number; height: number; thumb: string; web: string; print: boolean; download?: string; takenAt?: string };

export class AlbumError extends Error {
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
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
  } catch {
    throw new AlbumError('Couldn’t reach the server. Check your connection and try again.', 'NETWORK');
  }
  const body = await res.json().catch(() => ({}));
  // API Gateway's authorizer answers {"message":"Unauthorized"} for a missing or expired token.
  if (!res.ok) throw new AlbumError(body.error ?? (res.status === 401 ? 'Please sign in again.' : `Albums: ${res.status}`), body.code ?? (res.status === 401 ? 'UNAUTHENTICATED' : undefined), body.item);
  return body as T;
}

const post = <T>(path: string, body: unknown) =>
  call<T>(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

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

/**
 * An album: open with its photos, locked (with its card: a private one without a valid token, a families-only album or
 * a client gallery without a signed-in photo login, or with one that wasn't added to it: `notAdded`), or missing.
 */
export type AlbumResult =
  | { status: 'open'; item: LiveAlbum; photos: LivePhoto[] }
  | { status: 'locked'; item: LiveAlbum; notAdded?: boolean }
  | { status: 'missing' };

/** An album and its photos (a families-only album or a client gallery through the signed-in photo login). */
export async function fetchAlbum(id: string): Promise<AlbumResult> {
  const token = albumToken(id);
  try {
    const r = await call<{ item: LiveAlbum; photos: LivePhoto[] }>(`/albums/${encodeURIComponent(id)}${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    return { status: 'open', ...r };
  } catch (err) {
    if (err instanceof AlbumError && err.code === 'LOCKED' && err.item) return { status: 'locked', item: err.item };
    if (err instanceof AlbumError && err.code === 'SIGN_IN' && err.item) {
      if (!readLogin()) return { status: 'locked', item: err.item };
      try {
        const r = await viewerCall<{ item: LiveAlbum; photos: LivePhoto[] }>(`/viewer/albums/${encodeURIComponent(id)}`);
        return { status: 'open', ...r };
      } catch (inner) {
        if (inner instanceof AlbumError && inner.code === 'NOT_ADDED' && inner.item) return { status: 'locked', item: inner.item, notAdded: true };
        // The sign-in ended (signed out meanwhile): its gate again.
        if (inner instanceof AlbumError && inner.code === 'UNAUTHENTICATED') return { status: 'locked', item: err.item };
        if (inner instanceof AlbumError && inner.code === 'NOT_FOUND') return { status: 'missing' };
        throw inner;
      }
    }
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

// --- Photo logins -----------------------------------------------------------------------------------------------------

/**
 * The signed-in photo login (the families-only albums and client galleries its person was added to), kept in this
 * browser until they sign out (or its 30-day sign-in ends): the access token (an hour), refreshed from the refresh token.
 */
type Login = { email: string; accessToken: string; refreshToken: string; expiresAt: number };
type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };
const LOGIN_KEY = 'clp-photo-login';
/** Sent on this page when someone signs in or out (other tabs hear the storage event). */
const LOGIN_EVENT = 'clp-photo-login';

function readLogin(): Login | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LOGIN_KEY) ?? 'null');
    return raw && typeof raw.email === 'string' && typeof raw.accessToken === 'string' && typeof raw.refreshToken === 'string' ? raw : null;
  } catch {
    return null;
  }
}
function writeLogin(login: Login | null) {
  try {
    if (login) localStorage.setItem(LOGIN_KEY, JSON.stringify(login));
    else localStorage.removeItem(LOGIN_KEY);
  } catch {
    // Storage blocked: the sign-in lasts as long as this page.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOGIN_EVENT));
}

/** The signed-in photo login's e-mail, or null. */
export const loginEmail = () => readLogin()?.email ?? null;

/** Calls `fn` whenever someone signs in or out (here or in another tab); returns the unsubscribe. */
export function onLoginChange(fn: () => void) {
  const storage = (e: StorageEvent) => e.key === LOGIN_KEY && fn();
  window.addEventListener(LOGIN_EVENT, fn);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(LOGIN_EVENT, fn);
    window.removeEventListener('storage', storage);
  };
}

const startLogin = (email: string, tokens: Tokens) =>
  writeLogin({ email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: Date.now() + tokens.expiresIn * 1000 });

/** A sign-in: done, or (on the invitation's temporary password) the new password to choose first. */
export type LoginResult = { signedIn: true } | { challenge: 'NEW_PASSWORD_REQUIRED'; session: string; email: string };

export async function signIn(email: string, password: string): Promise<LoginResult> {
  const r = await post<{ tokens?: Tokens; email?: string; challenge?: 'NEW_PASSWORD_REQUIRED'; session?: string }>('/viewer/login', { email, password });
  if (r.challenge) return { challenge: r.challenge, session: r.session!, email: r.email! };
  startLogin(r.email!, r.tokens!);
  return { signedIn: true };
}

/** The first sign-in: the person's own password, in place of the invitation's temporary one. */
export async function chooseFirstPassword(email: string, session: string, password: string) {
  const r = await post<{ tokens: Tokens; email: string }>('/viewer/new-password', { email, session, password });
  startLogin(r.email, r.tokens);
}

/** E-mails a code to reset the password (the same answer for any address). */
export const forgotPassword = (email: string) => post<{ sent: true }>('/viewer/forgot', { email });
export const resetPassword = (email: string, code: string, password: string) => post<{ reset: true }>('/viewer/reset', { email, code, password });

let refreshing: Promise<Login | null> | null = null;

/** A fresh access token; null (and signed out) once the sign-in has ended. */
function refreshLogin(login: Login): Promise<Login | null> {
  refreshing ??= post<{ tokens: { accessToken: string; expiresIn: number } }>('/viewer/refresh', { refreshToken: login.refreshToken })
    .then((r) => {
      const next = { ...login, accessToken: r.tokens.accessToken, expiresAt: Date.now() + r.tokens.expiresIn * 1000 };
      writeLogin(next);
      return next;
    })
    .catch((err) => {
      // Offline: stay signed in and let the call fail. Anything else (expired, revoked): signed out.
      if (err instanceof AlbumError && err.code === 'NETWORK') throw err;
      writeLogin(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** A call as the signed-in photo login (its token refreshed when about to expire, or refused as expired). */
async function viewerCall<T>(path: string, init: RequestInit = {}): Promise<T> {
  let login = readLogin();
  if (!login) throw new AlbumError('Please sign in.', 'UNAUTHENTICATED');
  if (login.expiresAt - Date.now() < 60_000) login = await refreshLogin(login);
  if (!login) throw new AlbumError('Please sign in again.', 'UNAUTHENTICATED');
  const send = (l: Login) => call<T>(path, { ...init, headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${l.accessToken}` } });
  try {
    return await send(login);
  } catch (err) {
    if (!(err instanceof AlbumError) || err.code !== 'UNAUTHENTICATED') throw err;
    const next = await refreshLogin(login);
    if (!next) throw err;
    return send(next);
  }
}

/** The albums the signed-in photo login was added to (open: with their covers), newest event first. */
export const fetchMyAlbums = () => viewerCall<{ items: LiveAlbum[] }>('/viewer/albums').then((r) => r.items);

/** Signs out here, and ends the sign-in everywhere (its refresh token is revoked). */
export async function signOut() {
  const login = readLogin();
  writeLogin(null);
  if (!login) return;
  await call('/viewer/logout', { method: 'POST', headers: { authorization: `Bearer ${login.accessToken}` } }).catch(() => {});
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
