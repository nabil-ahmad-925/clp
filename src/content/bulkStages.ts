import type { BulkRequest, Payment } from './bulk';

/**
 * A request between its approved quote and shipping (clp-api shared/bulk-stages.mjs, bulk-payments.mjs): the 50%
 * deposit (or a verified buyer's PO), the proof to approve, and the balance before it ships. Pure, for both request
 * lists on the shop and the payment page.
 */

/** A proof is waiting for them to approve it. */
export const proofWaiting = (r: BulkRequest) => r.status === 'proof' && r.proof?.state === 'sent';

/** A payment they sent that CLP is still confirming. */
export const paymentPending = (r: BulkRequest) => (r.money?.pending ?? 0) > 0;
/** Their last payment, when CLP couldn't confirm it (they can pay again). */
export const lastRejected = (r: BulkRequest): Payment | null => {
  const last = r.payments?.at(-1);
  return last?.status === 'rejected' ? last : null;
};
/** Something they can pay now (the deposit, all of it, or the balance). */
export const canPay = (r: BulkRequest) => Boolean(r.payOptions?.length);
/** The balance is due (after the deposit, before shipping). */
export const balanceDue = (r: BulkRequest) => Boolean(r.payOptions?.some((o) => o.kind === 'balance'));

/** The chip for these steps (words, background, text color), or null for any other status. */
export function stageChip(r: BulkRequest): [string, string, string] | null {
  if (paymentPending(r)) return ['Payment being confirmed', '#F2F1ED', '#444444'];
  if (r.status === 'deposit') return lastRejected(r) ? ['Payment not received', '#FBEAE8', '#B03A2E'] : ['Deposit due', '#FBF3E2', '#8A6F33'];
  if (proofWaiting(r)) return ['Proof to approve', '#111111', '#FFFFFF'];
  if (r.status === 'proof') return ['Preparing your proof', '#F2F1ED', '#444444'];
  if (r.status === 'in-production' && balanceDue(r)) return ['Balance due', '#FBF3E2', '#8A6F33'];
  return null;
}

/** The page where they pay (the shop's Wholesale view). */
export const payHref = (id: string) => `/shop/?view=bulk&pay=${encodeURIComponent(id)}`;
