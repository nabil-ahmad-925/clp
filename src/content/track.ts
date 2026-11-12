import { PartnerApiError, read } from './partnerPages';

/**
 * An order's tracking page (/track/?id=…&k=…, the link in its shipping e-mails; clp-api shared/bulk-tracking.mjs): its
 * timeline (ordered → in production → shipped → out for delivery → delivered), each box, the arrival date and any
 * delay. No sign-in, and never a price or a name.
 */
export type TrackStep = { key: 'ordered' | 'production' | 'shipped' | 'out' | 'delivered'; label: string; done: boolean; at: string | null };
export type TrackBox = { n: number; carrier: string; number: string; status: 'shipped' | 'out' | 'delivered'; outAt?: string; deliveredAt?: string; url: string };
export type Tracking = { ref: string; itemName: string; qty: number; status: string; steps: TrackStep[]; boxes: TrackBox[]; eta?: string; etaWas?: string; delayedAt?: string };

/** The order's tracking, or null when the link is wrong (or the order isn't there). */
export async function fetchTracking(id: string, key: string): Promise<Tracking | null> {
  if (!/^[0-9a-f-]{36}$/.test(id) || !key) return null;
  try {
    return (await read<{ order: Tracking }>(`/bulk-track/${encodeURIComponent(id)}?k=${encodeURIComponent(key)}`)).order;
  } catch (err) {
    if (err instanceof PartnerApiError && err.status === 404) return null;
    throw err;
  }
}

/** A date for people: an arrival date (a day alone) is read at midday so it never shows as the day before. */
export const trackDay = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const BOX_WORDS: Record<TrackBox['status'], string> = { shipped: 'In transit', out: 'Out for delivery', delivered: 'Delivered' };
