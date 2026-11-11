import Link from 'next/link';
import type { BulkRequest } from '@/content/bulk';
import { canPay, lastRejected, payHref, paymentPending } from '@/content/bulkStages';
import st from './requestStage.module.css';

const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * A request's payment on its card: what's due with the button to the payment page, a payment CLP is confirming, or one
 * CLP couldn't find (with their note) to send again. Nothing when nothing is due.
 */
export default function RequestPay({ r }: { r: BulkRequest }) {
  const m = r.money;
  if (!m) return null;
  if (paymentPending(r)) {
    const p = r.payments?.findLast((x) => x.status === 'submitted');
    return (
      <div className={st.box}>
        <strong>PAYMENT BEING CONFIRMED</strong>
        <span>
          You told us you sent {money(m.pending)}
          {p ? ` (ref ${p.reference})` : ''}. We confirm it once it’s in our account, usually within 1 business day.
        </span>
      </div>
    );
  }
  if (!canPay(r)) return null;
  const opts = r.payOptions ?? [];
  const balance = opts.find((o) => o.kind === 'balance');
  const deposit = opts.find((o) => o.kind === 'deposit');
  const rejected = lastRejected(r);
  return (
    <div className={st.box} data-on="true">
      <strong>{rejected ? 'PAYMENT NOT RECEIVED' : balance ? 'BALANCE DUE' : 'DEPOSIT DUE'}</strong>
      <span>
        {rejected ? `We couldn’t find your ${money(rejected.amount)} payment. ${rejected.reviewNote ?? ''} ` : ''}
        {balance
          ? `${money(balance.amount)} is left to pay before your order ships. You’ve paid ${money(m.paid)} of ${money(m.total)}.`
          : `A 50% deposit (${money(deposit?.amount ?? m.deposit)}) starts your proof and production. Or pay all ${money(m.balance)} now.`}
      </span>
      <span className={st.acts}>
        <Link href={payHref(r.id)} className={st.dark}>
          {balance ? `Pay Balance · ${money(balance.amount)}` : `Pay Deposit · ${money(deposit?.amount ?? m.deposit)}`}
        </Link>
      </span>
    </div>
  );
}
