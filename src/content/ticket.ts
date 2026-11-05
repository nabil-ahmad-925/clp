import type { BookingConfirmation } from './listings';

/**
 * The guest's ticket on their phone (design board 8, parent phone): the booking as the bookings API shows its own guest
 * (by the signed link in their e-mails), self check-in with the field code, signing a walk-in's waiver, and telling the
 * host something on the day. clp-api src/bookings.mjs.
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

export type DayOfKind = 'late' | 'lost' | 'cant';
export const DAY_OF: [DayOfKind, string][] = [
  ['late', 'Running Late'],
  ['lost', 'Can’t Find It'],
  ['cant', 'Can’t Make It'],
];
export type DayOfEntry = { kind: DayOfKind; text?: string; at: string; reply?: string; repliedAt?: string };

export type Ticket = BookingConfirmation & {
  ref: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  noShow?: boolean;
  walkIn?: boolean;
  /** A walk-in added at the field who hasn't signed the waiver yet. */
  needsSigning: boolean;
  ages?: { kind: 'all' | 'adult' | 'youth'; minAge?: number };
  dayOf: DayOfEntry[];
  /** The field code works for this booking now (CLP approved it, the host has it on, it's the day). */
  selfCheckIn: boolean;
  /** The QR the host scans: one 1×1 square per dark module. */
  ticket?: { code: string; qr: { size: number; path: string } };
};

export const ticketHref = (id: string, token: string, view = '') => `/ticket/?${new URLSearchParams({ id, token, ...(view ? { v: view } : {}) })}`;

async function call<T>(path: string, init: RequestInit, fallback: string): Promise<T> {
  if (!API_URL) throw new Error('Bookings aren’t available right now.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000), ...init });
  } catch {
    throw new Error('No connection. Check your signal and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || fallback), { status: res.status });
  return body as T;
}

const post = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/** Their ticket; null when the link isn't valid (or the booking is gone). */
export async function fetchTicket(id: string, token: string): Promise<Ticket | null> {
  try {
    return (await call<{ booking: Ticket }>(`/bookings/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, {}, 'Could not load your ticket. Please try again.')).booking;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export const checkInWithCode = (id: string, token: string, code: string) =>
  call<{ booking: Ticket }>(`/bookings/${encodeURIComponent(id)}/checkin`, post({ token, code }), 'Could not check you in. Please try again.').then((r) => r.booking);

export const signWaiver = (id: string, token: string, answers: { waiver: boolean; guardian?: boolean; ageConfirmed?: boolean }) =>
  call<{ booking: Ticket }>(`/bookings/${encodeURIComponent(id)}/sign`, post({ token, ...answers }), 'Could not sign. Please try again.').then((r) => r.booking);

export const tellHost = (id: string, token: string, kind: DayOfKind, text: string) =>
  call<{ booking: Ticket }>(`/bookings/${encodeURIComponent(id)}/dayof`, post({ token, kind, text: text.trim() || undefined }), 'Could not send that. Please try again.').then((r) => r.booking);

/** How many of the host's replies this phone has seen (for the unread count). Storage can be blocked: then none. */
const seenKey = (id: string) => `clp-ticket-seen-${id}`;
export function seenReplies(id: string) {
  try {
    return Number(window.localStorage.getItem(seenKey(id)) ?? 0) || 0;
  } catch {
    return 0;
  }
}
export function markRepliesSeen(id: string, n: number) {
  try {
    window.localStorage.setItem(seenKey(id), String(n));
  } catch {
    // Blocked storage: the count just shows again next time.
  }
}
export const repliesOf = (t: Ticket) => t.dayOf.filter((d) => d.reply).length;
