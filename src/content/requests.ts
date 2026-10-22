import options from './data/requestOptions.json';
import type { CardButton } from './types';

/**
 * The listings' request forms: a service's "Start a New Project" and a government facility's "Permit Now". Sent to the
 * bookings API (clp-api POST /bookings/requests), which keeps each request and e-mails it to the host and CLP's inbox;
 * the admin's Bookings shows them under Requests.
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

export type RequestKind = 'project' | 'permit';

/** The forms' choices (one list with the API), and a service card's button when the admin set none. */
export const BUDGETS = options.budgets;
export const ACTIVITIES = options.activities;
export const DEFAULT_CARD_BUTTON: CardButton = { action: 'project', label: options.labels.project };

type Contact = { widgetId: number; listingId: string; name: string; email: string; phone?: string; organization?: string; details?: string };
export type ListingRequest =
  | (Contact & { kind: 'project'; service: string; budget: string })
  | (Contact & { kind: 'permit'; date: string; startTime?: string; endTime?: string; people: number; activity: string });

export type RequestConfirmation = { id: string; kind: RequestKind; listingTitle: string; email: string; createdAt: string };

/** Sends a request; resolves with its reference, or rejects with a message to show. */
export async function sendRequest(request: ListingRequest): Promise<RequestConfirmation> {
  if (!API_URL) throw new Error('This form isn’t available right now.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/bookings/requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('Could not send your request. Check your connection and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || (res.status === 429 ? 'Too many requests. Please try again in a minute.' : 'Could not send your request. Please try again.'));
  return body.request as RequestConfirmation;
}
