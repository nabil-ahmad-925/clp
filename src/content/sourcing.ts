import { call } from './partnerPages';

/**
 * "Can't Find It?" (clp-api shared/sourcing.mjs): a client asks CLP to find something Wholesale doesn't list. It's a
 * Wholesale quote request with `sourcing` (what they need, a budget per piece, a photo or link), shown as "Finding it
 * for you" with its 3 steps until CLP replies with a quote. Searches that find nothing are counted for CLP.
 */
export type ClientSourcing = {
  what: string;
  budgetMin?: number;
  budgetMax?: number;
  photo?: string;
  link?: string;
  /** When CLP promised to reply (the next business day). */
  replyBy: string;
  /** CLP needs a little more time to find the right match. */
  searching?: boolean;
  steps: { label: string; done: boolean }[];
};
export type SourcingInput = { what: string; budgetMin?: number; budgetMax?: number; photo?: string; link?: string };

/** Still being found: CLP hasn't replied with its quote yet (content/requestStatus.ts). */
export { findingIt } from './requestStatus';

/** "$8–10 each", "up to $10 each", or ''. */
export function budgetWords(s: Pick<ClientSourcing, 'budgetMin' | 'budgetMax'>) {
  const f = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
  if (s.budgetMin !== undefined && s.budgetMax !== undefined) return `$${f(s.budgetMin)}–${f(s.budgetMax)} each`;
  if (s.budgetMax !== undefined) return `up to $${f(s.budgetMax)} each`;
  if (s.budgetMin !== undefined) return `from $${f(s.budgetMin)} each`;
  return '';
}

/** A dollar amount typed by the client ("$8", "8.50"): its number, undefined when empty, null when it isn't one. */
export function dollars(text: string): number | undefined | null {
  const t = text.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n * 100) / 100 : null;
}

export type FindItFields = { what: string; qty: string; inHands: string; min: string; max: string; link: string; notes: string };

/** What's wrong with the form, field by field ('' when it's fine). The API checks it all again. */
export function findItProblems(f: FindItFields) {
  const qty = Number(f.qty);
  const min = dollars(f.min);
  const max = dollars(f.max);
  return {
    what: f.what.trim().length < 2 ? 'Tell us what you need.' : f.what.trim().length > 80 ? 'Keep it under 80 characters. Add the details in your notes.' : '',
    qty: Number.isInteger(qty) && qty >= 1 && qty <= 100000 ? '' : 'Enter how many you need.',
    budget: min === null || max === null ? 'Enter the budget in dollars.' : min !== undefined && max !== undefined && max < min ? 'The top of your budget is below the bottom.' : '',
    link: f.link.trim() && !/^https:\/\/\S{1,590}$/.test(f.link.trim()) ? 'Paste the full link, starting with https://' : '',
  };
}

/** The request's `sourcing`, from the form and the photo they uploaded. */
export function sourcingOf(f: FindItFields, photo: string): SourcingInput {
  const min = dollars(f.min);
  const max = dollars(f.max);
  return { what: f.what.trim(), ...(min != null ? { budgetMin: min } : {}), ...(max != null ? { budgetMax: max } : {}), ...(photo ? { photo } : {}), ...(f.link.trim() ? { link: f.link.trim() } : {}) };
}

const LOGGED_KEY = 'clp-ws-no-result';

/** The searches this tab already counted (so a reload or a back step doesn't count one twice). */
function logged(): string[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(LOGGED_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Tells CLP a Wholesale search found nothing (once per search in this tab). Never blocks or breaks the page. */
export async function logNoResult(q: string) {
  const key = q.trim().toLowerCase();
  if (key.length < 2 || logged().includes(key)) return;
  try {
    sessionStorage.setItem(LOGGED_KEY, JSON.stringify([...logged(), key].slice(-50)));
  } catch {
    // Storage blocked: it may be counted again next time, which is fine.
  }
  await call('/wholesale/searches', { method: 'POST', body: JSON.stringify({ q: key }) }).catch(() => undefined);
}
