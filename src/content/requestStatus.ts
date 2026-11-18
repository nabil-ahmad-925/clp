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
export const needsYou = (r: BulkRequest) => (r.hold ? canPay(r) : r.status === 'changes' || proofWaiting(r) || sampleWaiting(r) || fileChangeWaiting(r) || (canPay(r) && ['deposit', 'in-production'].includes(r.status)) || (r.status === 'quoted' && Boolean(r.quote) && !expired(r)));

/** Where a request is: its chip (words, background, text color). */
export function statusOf(r: BulkRequest): [string, string, string] {
  // Paused or cancelled by CLP (clp-api shared/bulk-hold.mjs, bulk-cancel.mjs).
  if (r.hold && r.status !== 'closed') return ['On hold', '#FBF3E2', '#8A6F33'];
  if (r.status === 'closed' && r.cancelled) return [(r.refund?.due ?? 0) > 0 ? 'Cancelled · refund due' : 'Cancelled', '#F2F1ED', '#666666'];
  // A "Can't Find It?" request until our quote.
  if (findingIt(r)) return ['Finding it for you', '#FBF3E2', '#8A6D2F'];
  const stage = stageChip(r);
  // The quote approved: files and payment, then production.
  if (stage) return stage;
  if (r.status === 'changes') return ['Changes requested', '#FBEAE8', '#B03A2E'];
  if (r.status === 'art') return ['Preparing your quote', '#F2F1ED', '#444444'];
  if (r.status === 'quoted') return expired(r) ? ['Quote expired', '#F2F1ED', '#666666'] : ['Quote ready', '#111111', '#FFFFFF'];
  if (r.status === 'in-production') return ['In production', '#E7F3EC', '#1E7A45'];
  if (r.status === 'shipped') return r.shipping?.deliveredAt ? ['Delivered', '#E7F3EC', '#1E7A45'] : ['Shipped', '#E7F3EC', '#1E7A45'];
  // Closed before it shipped is cancelled; after, it's done.
  if (r.status === 'closed') return [r.reply?.kind === 'declined' ? 'Declined' : r.shipping ? 'Closed' : 'Cancelled', '#F2F1ED', '#666666'];
  if (r.reply?.kind === 'changes') return ['Updating your quote', '#F2F1ED', '#444444'];
  return ['Preparing your quote', '#F2F1ED', '#444444'];
}

/**
 * The steps the client sees (the user's list, 2026-11-18). CLP's own steps (the maker, vendors, freight) stay in CLP
 * Admin: Quote → Approve → Files → Payment → In production → Shipped → Delivered.
 */
export const CLIENT_STEPS = ['Quote', 'Approve', 'Files', 'Payment', 'In production', 'Shipped', 'Delivered'] as const;
export type StepState = 'done' | 'now' | 'todo';

const APPROVED = ['deposit', 'proof', 'in-production', 'shipped'];

/** Their files and proof approved (every required production file, then the proof). */
const filesApproved = (r: BulkRequest) => r.proof?.state === 'approved' && Object.values(r.files ?? {}).every((f) => !f?.required || f.status === 'approved');

/**
 * Each client step: done, at it now, or to come. Files and Payment run side by side after the quote is approved, so
 * both can be "now" at once. A closed request shows what it got to, with nothing now.
 */
export function trackOf(r: BulkRequest): StepState[] {
  const open = r.status !== 'closed';
  const approved = Boolean(r.approvedAt) || APPROVED.includes(r.status);
  const made = r.status === 'in-production' || r.status === 'shipped' || Boolean(r.shipping);
  const step = (done: boolean, now: boolean): StepState => (done ? 'done' : now && open ? 'now' : 'todo');
  return [
    step(Boolean(r.quote), true),
    step(approved, r.status === 'quoted'),
    step(made || filesApproved(r), approved),
    step(made || Boolean(r.po) || Boolean(r.money?.depositMet), approved),
    step(Boolean(r.shipping), r.status === 'in-production'),
    step(Boolean(r.shipping), false),
    step(Boolean(r.shipping?.deliveredAt), Boolean(r.shipping)),
  ];
}
