import options from './data/applicationOptions.json';

/**
 * The "Run a program?" forms of a listing page (Claim Your Listing, Sponsor a Listing, Apply to Partner), sent to the
 * applications API (clp-api POST /applications), which keeps each one and e-mails it to CLP's inbox.
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

/** Which form: a free Community listing to claim, a paid Sponsored placement or a CLP Partner application. */
export type ApplicationKind = 'community' | 'sponsored' | 'partner';

/** The forms' choices (one list with the API). */
export const BUDGETS = options.budgets;
export const YEARS = options.years;

export type ApplicationRequest = {
  kind: ApplicationKind;
  /** The listing page it was sent from ("/futbol-dieting-nutrition/", "Dieting & Nutrition", "resources"). */
  page?: string;
  category?: string;
  section?: 'experiences' | 'resources';
  name: string;
  email: string;
  organization: string;
  role: string;
  phone?: string;
  website?: string;
  message?: string;
  authorized: boolean;
  // Community listing
  listing?: string;
  city?: string;
  // Sponsored placement
  promote?: string;
  cities?: string;
  dates?: string;
  budget?: string;
  // CLP Partner (and city)
  programs?: string;
  years?: string;
  credentials?: string;
};

export type ApplicationConfirmation = { id: string; kind: ApplicationKind; status: string; organization: string; email: string; createdAt: string };

/** Sends a form; resolves with its reference, or rejects with a message to show. */
export async function requestApplication(request: ApplicationRequest): Promise<ApplicationConfirmation> {
  if (!API_URL) throw new Error('This form isn’t available right now.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('Could not send the form. Check your connection and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || (res.status === 429 ? 'Too many requests. Please try again in an hour.' : 'Could not send the form. Please try again.'));
  return body.application as ApplicationConfirmation;
}
