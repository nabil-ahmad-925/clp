import type { BulkRequest } from './bulk';
import { canPay, proofWaiting, stageChip } from './bulkStages';
import type { ClientSourcing } from './sourcing';

/**
 * Where a Wholesale request stands for the person who asked for it, and whether it waits on them. Pure. The site's
 * Quote Requests and the partner admin's My orders & quotes both use it (the admin copies this file with
 * scripts/sync-widgets.mjs), so both always say the same thing.
 */

/** Its quote is past the 14 days it holds. */
export const expired = (r: BulkRequest) => r.status === 'quoted' && Boolean(r.quote) && new Date(r.quote!.validUntil).getTime() < Date.now();

/** Still being found ("Can't Find It?"): CLP hasn't replied with its quote yet (the last step). */
export const findingIt = (r: { sourcing?: ClientSourcing | null }) => Boolean(r.sourcing) && !r.sourcing!.steps.at(-1)?.done;

/** Something from the maker waits for their approval. */
export const sampleWaiting = (r: BulkRequest) => (r.samples ?? []).some((s) => s.status === 'waiting');

/** CLP's change to one of their files, or a paid service offer, waits on their answer. */
export const fileChangeWaiting = (r: BulkRequest) => Object.values(r.files ?? {}).some((f) => f?.status === 'client') || (r.services ?? []).some((s) => s.status === 'offered');

/** What needs the requester: a quote, proof, photos or a file change to approve, or new artwork to send. */
export const needsYou = (r: BulkRequest) => r.status === 'changes' || proofWaiting(r) || sampleWaiting(r) || fileChangeWaiting(r) || (canPay(r) && ['deposit', 'in-production'].includes(r.status)) || (r.status === 'quoted' && Boolean(r.quote) && !expired(r));

/**
 * Where a request is: its chip (words, background, text color) and the tracker step it's at now (0 Submitted, 1 Quote,
 * 2 Files & proof, 3 In production, 4 Shipped; 5 all done). Sent, it's at the quote.
 */
export function statusOf(r: BulkRequest): [string, string, string, number] {
  // A "Can't Find It?" request until our quote.
  if (findingIt(r)) return ['Finding it for you', '#FBF3E2', '#8A6D2F', 1];
  const stage = stageChip(r);
  // The quote approved: the deposit, files and proof come next, then production.
  if (stage) return [...stage, r.status === 'in-production' ? 3 : 2];
  if (r.status === 'changes') return ['Changes requested', '#FBEAE8', '#B03A2E', 1];
  if (r.status === 'art') return ['Preparing your quote', '#F2F1ED', '#444444', 1];
  if (r.status === 'quoted') return expired(r) ? ['Quote expired', '#F2F1ED', '#666666', 1] : ['Quote ready', '#111111', '#FFFFFF', 1];
  if (r.status === 'in-production') return ['In production', '#E7F3EC', '#1E7A45', 3];
  if (r.status === 'shipped') return r.shipping?.deliveredAt ? ['Delivered', '#E7F3EC', '#1E7A45', 5] : ['Shipped', '#E7F3EC', '#1E7A45', 4];
  if (r.status === 'closed') return [r.reply?.kind === 'declined' ? 'Declined' : 'Closed', '#F2F1ED', '#666666', 0];
  if (r.reply?.kind === 'changes') return ['Updating your quote', '#F2F1ED', '#444444', 1];
  return ['Preparing your quote', '#F2F1ED', '#444444', 1];
}
