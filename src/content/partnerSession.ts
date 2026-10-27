import { PartnerApiError, call, type PartnerPageData } from './partnerPages';

/**
 * A CLP Partner signed in on the site (the shop's design studio, saved designs and partner pricing): the same account
 * as the admin's (clp-api auth-login). Kept in this browser until they sign out: the access token (an hour), refreshed
 * from the refresh token. A teammate signs in as their partner (the API answers for the partner's account).
 */
export type PartnerUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
  access?: { kind: 'super_admin' | 'owner' | 'staff' | 'team' | 'member'; partnerId?: string; partnerName?: string; permissions?: Record<string, string[]> };
};
type Session = { email: string; accessToken: string; refreshToken: string; expiresAt: number; user: PartnerUser };
type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };

const KEY = 'clp-partner-session';
const EVENT = 'clp-partner-session';

function read(): Session | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return raw && typeof raw.accessToken === 'string' && typeof raw.refreshToken === 'string' && raw.user ? raw : null;
  } catch {
    return null;
  }
}
function write(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: signed in for this page only.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

/** Who may use the studio: a partner (or their teammate) and CLP. */
export const isStudioUser = (u: PartnerUser | null | undefined) => Boolean(u && ['owner', 'team', 'super_admin'].includes(u.access?.kind ?? ''));
/** A CLP member (the site's own sign-up): signed in on the site, with no partner tools. */
export const isMember = (u: PartnerUser | null | undefined) => u?.access?.kind === 'member';

/** The signed-in partner, or null. */
export const partnerUser = () => read()?.user ?? null;

/** The stored session as text (a stable snapshot for useSyncExternalStore; '' when signed out). */
export const partnerSessionSnapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};
/** The signed-in partner from a snapshot. */
export const userFromSnapshot = (raw: string): PartnerUser | null => {
  try {
    const parsed = JSON.parse(raw || 'null');
    return parsed?.user ?? null;
  } catch {
    return null;
  }
};

/** Calls `fn` whenever someone signs in or out (here or in another tab); returns the unsubscribe. */
export function onPartnerSession(fn: () => void) {
  const storage = (e: StorageEvent) => e.key === KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', storage);
  };
}

const start = (email: string, tokens: Tokens, user: PartnerUser) =>
  write({ email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: Date.now() + tokens.expiresIn * 1000, user });

export type SignInResult = { signedIn: true; user: PartnerUser } | { challenge: 'NEW_PASSWORD_REQUIRED'; session: string; email: string };

export async function partnerSignIn(email: string, password: string): Promise<SignInResult> {
  const r = await call<{ tokens?: Tokens; user?: PartnerUser; challenge?: 'NEW_PASSWORD_REQUIRED'; session?: string; email?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (r.challenge) return { challenge: r.challenge, session: r.session!, email: r.email ?? email };
  start(email, r.tokens!, r.user!);
  return { signedIn: true, user: r.user! };
}

/** The first sign-in of an invited partner: their own password in place of the temporary one. */
export async function partnerFirstPassword(email: string, session: string, password: string) {
  const r = await call<{ tokens: Tokens; user: PartnerUser }>('/auth/new-password', { method: 'POST', body: JSON.stringify({ email, session, password }) });
  start(email, r.tokens, r.user);
  return r.user;
}

/**
 * Sign up on the site: a CLP member account (never a partner's: partners apply). Cognito e-mails a 6-digit code to
 * confirm the address; then they sign in.
 */
export const memberSignUp = (name: string, email: string, password: string) =>
  call<{ needsConfirmation: true; email: string }>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
/** Confirms the address with its code. Already confirmed (an earlier try got that far) counts as done. */
export const confirmEmail = (email: string, code: string) =>
  call<{ confirmed: true }>('/auth/confirm', { method: 'POST', body: JSON.stringify({ email, code }) }).catch((err: unknown) => {
    if (err instanceof PartnerApiError && err.code === 'ALREADY_CONFIRMED') return { confirmed: true as const };
    throw err;
  });
/** A new confirmation code (the same answer whether or not the address has an account). */
export const resendConfirmation = (email: string) => call<{ sent: true }>('/auth/resend', { method: 'POST', body: JSON.stringify({ email }) });

/** Forgot password: e-mails a 6-digit reset code (the same answer for an unknown address). */
export const partnerForgotPassword = (email: string) => call<{ sent: true }>('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });

/** A new password with the code from the forgot-password e-mail; then they sign in with it. */
export const partnerResetPassword = (email: string, code: string, password: string) =>
  call<{ reset: true }>('/auth/reset', { method: 'POST', body: JSON.stringify({ email, code, password }) });

let refreshing: Promise<Session | null> | null = null;

/** A fresh access token; null (and signed out) once the sign-in has ended. */
function refresh(s: Session): Promise<Session | null> {
  refreshing ??= call<{ tokens: { accessToken: string; expiresIn: number }; user?: PartnerUser }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: s.refreshToken }) })
    .then((r) => {
      const next = { ...s, accessToken: r.tokens.accessToken, expiresAt: Date.now() + r.tokens.expiresIn * 1000, user: r.user ?? s.user };
      write(next);
      return next;
    })
    .catch((err) => {
      // Offline: stay signed in and let the call fail. Anything else (expired, revoked): signed out.
      if (err instanceof PartnerApiError && err.status === 0) throw err;
      write(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** A call as the signed-in partner (its token refreshed when about to expire). */
export async function partnerCall<T>(path: string, init: RequestInit = {}): Promise<T> {
  let s = read();
  if (!s) throw new PartnerApiError(401, 'Please sign in first.');
  if (s.expiresAt - Date.now() < 60_000) s = await refresh(s);
  if (!s) throw new PartnerApiError(401, 'Please sign in again.');
  const send = (x: Session) => call<T>(path, { ...init, headers: { authorization: `Bearer ${x.accessToken}` } });
  try {
    return await send(s);
  } catch (err) {
    if (!(err instanceof PartnerApiError) || err.status !== 401) throw err;
    const next = await refresh(s);
    if (!next) throw err;
    return send(next);
  }
}

/** Signs out here, and ends the sign-in everywhere (its refresh token is revoked). */
export async function partnerSignOut() {
  const s = read();
  write(null);
  if (s) await call('/auth/logout', { method: 'POST', headers: { authorization: `Bearer ${s.accessToken}` } }).catch(() => {});
}

/** The partner's own page (its brand kit, name and logo for the studio). */
export const fetchMyPartnerPage = () =>
  partnerCall<{ page: PartnerPageData & { brand?: BrandKit; mono: string } }>('/my/partner').then((r) => r.page);

/** The brand kit a partner keeps in the admin: team colours and logos, and (locked) the only options their designs may use. */
export type BrandKit = {
  colors: string[];
  logos: { label: string; src: string }[];
  locked: boolean;
  manager: string;
  fonts: string[];
  patterns: string[];
  places: string[];
  phrases: string[];
};

/** Uploads an image (a logo for the studio) to CLP's media and returns its address. */
export async function uploadImage(file: Blob): Promise<string> {
  const { uploadUrl, url } = await partnerCall<{ uploadUrl: string; url: string }>('/uploads', { method: 'POST', body: JSON.stringify({ contentType: file.type, size: file.size }) });
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file });
  if (!res.ok) throw new PartnerApiError(res.status, 'The upload didn’t go through. Try again.');
  return url;
}
