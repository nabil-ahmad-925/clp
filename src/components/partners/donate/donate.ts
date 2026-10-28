import type { PartnerDonations } from '@/content/partnerPages';

/** Where a donation is made, as supporters read it ("on Stripe"). */
export const PROVIDER_NAMES: Record<PartnerDonations['provider'], string> = { stripe: 'Stripe', paypal: 'PayPal', givebutter: 'Givebutter', link: 'the partner’s own page' };

const MAX = 100_000;

/** "$25", "$12.50": whole dollars without cents. */
export const dollars = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** A typed amount ("25", "$25.50", "1,000") in dollars with at most cents, from $1 to $100,000, or null. */
export function parseAmount(text: string): number | null {
  const s = text.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= MAX ? n : null;
}

/** Whether the provider takes the amount in the link: only a PayPal.Me page does (paypal.me/name/25USD). */
export const prefillsAmount = (d: PartnerDonations) => {
  try {
    const u = new URL(d.link);
    return d.provider === 'paypal' && u.hostname.toLowerCase() === 'paypal.me' && u.pathname.split('/').filter(Boolean).length === 1;
  } catch {
    return false;
  }
};

/**
 * Where the Donate button goes: the partner's own link, as they saved it (the API only keeps https links on the provider's
 * own site). A PayPal.Me link carries the chosen amount, the other providers don't take one, so the supporter confirms
 * it there.
 */
export function donateUrl(d: PartnerDonations, amount: number | null): string {
  if (amount === null || !prefillsAmount(d)) return d.link;
  const u = new URL(d.link);
  u.pathname = `${u.pathname.replace(/\/$/, '')}/${amount}USD`;
  return u.toString();
}
