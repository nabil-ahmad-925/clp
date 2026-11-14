import { PartnerApiError, call, read } from './partnerPages';

/**
 * A forwarder's no-account link (/forwarder/?id=…&q=…&k=…; clp-api shared/freight-link-routes.mjs): the shipment CLP
 * needs moved (never the client's name or other quotes), their price and days in transit, and once CLP books them the
 * full address and the tracking they send. The client's answers: "forwarders without API get a no-account link".
 */
export type ForwarderMode = 'ground' | 'air' | 'sea' | 'express';
export type ForwarderShipment = {
  ref: string;
  mode: ForwarderMode;
  modeLabel: string;
  details: { from: string; to: string; cartons: number; weightKg: number; hs: string; value: number; readyBy: string };
  quote: { forwarder: string; status: 'asked' | 'quoted' | 'booked'; price: number | null; transitDays: number | null; mode: ForwarderMode; note: string; tracking: { number: string; eta: string; at: string } | null };
  booked: boolean;
  /** Another forwarder was booked (nothing more to send). */
  closed: boolean;
  shipped: boolean;
};
export type ForwarderState = { status: 'ready'; shipment: ForwarderShipment } | { status: 'invalid' };
export type LinkParams = { id: string; q: string; k: string };

export const FORWARDER_MODES: { id: ForwarderMode; label: string }[] = [
  { id: 'sea', label: 'Sea' },
  { id: 'air', label: 'Air' },
  { id: 'ground', label: 'Ground' },
  { id: 'express', label: 'Express' },
];

const path = ({ id, q, k }: LinkParams) => `/bulk-freight/${encodeURIComponent(id)}?q=${encodeURIComponent(q)}&k=${encodeURIComponent(k)}`;

/** The shipment from the link (or invalid: a wrong or old link). */
export async function fetchForwarder(p: LinkParams): Promise<ForwarderState> {
  if (!/^[0-9a-f-]{36}$/.test(p.id) || !p.q || !p.k) return { status: 'invalid' };
  try {
    return { status: 'ready', shipment: (await read<{ shipment: ForwarderShipment }>(path(p))).shipment };
  } catch (err) {
    if (err instanceof PartnerApiError && err.status === 404) return { status: 'invalid' };
    throw err;
  }
}

/** Their price, days in transit, how and a note (changeable until CLP books one). */
export const sendQuote = (p: LinkParams, input: { price: number; transitDays: number; mode: ForwarderMode; note: string }) =>
  call<{ shipment: ForwarderShipment }>(path(p), { method: 'POST', body: JSON.stringify({ action: 'quote', ...input }) }).then((r) => r.shipment);

/** Once booked: the booking, bill of lading or tracking number and the arrival date. */
export const sendTracking = (p: LinkParams, input: { number: string; eta: string }) =>
  call<{ shipment: ForwarderShipment }>(path(p), { method: 'POST', body: JSON.stringify({ action: 'tracking', ...input }) }).then((r) => r.shipment);

/** What stops the quote form ('' when it can be sent). */
export function quoteProblem(f: { price: string; days: string }) {
  if (!(Number(f.price.replace(/[$,]/g, '')) > 0)) return 'Enter your price in dollars.';
  if (!/^\d+$/.test(f.days.trim()) || Number(f.days) < 1 || Number(f.days) > 180) return 'Enter the days in transit as a whole number from 1 to 180.';
  return '';
}
