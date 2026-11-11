'use client';

import Link from 'next/link';
import { useState } from 'react';
import { designAction, guestRequestAction, type BulkRequest, type RequestActionInput } from '@/content/bulk';
import { canPay, paymentPending } from '@/content/bulkStages';
import { shopHref } from '@/content/storefront';
import PayForm from './PayForm';
import { OrderSummary, PaymentHistory, money } from './PaySummary';
import p from './pay.module.css';

/**
 * The payment page for one Wholesale request (?view=bulk&pay=<id>): the order and its money, what to pay now and how,
 * and the payments so far. Sending a payment tells CLP, who confirms it once it's in the account.
 */
export default function PayPage({ id, items, partner, loaded, onChange }: { id: string; items: BulkRequest[]; partner: boolean; loaded: boolean; onChange: (r: BulkRequest) => void }) {
  const r = items.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const send = async (input: RequestActionInput) => {
    setBusy(true);
    setError('');
    try {
      onChange(await (partner ? designAction : guestRequestAction)(id, 'submit-payment', input));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t go through. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={p.page}>
      <Link href={shopHref({ view: 'bulk', reqs: '1' })} className={p.back}>
        ← Back to Quote Requests
      </Link>
      <h1 className={p.title}>{r ? `Pay for ${r.ref}` : 'Payment'}</h1>
      {!r ? (
        <p className={p.mut}>{loaded ? 'We couldn’t find this request on this browser. Open it from Quote Requests, or from the link in our e-mail.' : 'Loading your request…'}</p>
      ) : !r.money ? (
        <p className={p.mut}>There’s no quote on this request yet, so there’s nothing to pay.</p>
      ) : (
        <div className={p.grid}>
          <div className={p.main}>
            {sent || paymentPending(r) ? (
              <section className={p.card} aria-live="polite">
                <span className={p.kicker}>{sent ? 'PAYMENT SENT' : 'BEING CONFIRMED'}</span>
                <strong className={p.item}>Thank you. We’re confirming {money(r.money.pending)}.</strong>
                <span className={p.mut}>We check it’s in our account, usually within 1 business day, and e-mail you a receipt. Nothing else to do now.</span>
              </section>
            ) : canPay(r) ? (
              <PayForm r={r} busy={busy} error={error} onSend={(input) => void send(input)} />
            ) : (
              <section className={p.card}>
                <span className={p.kicker}>NOTHING TO PAY NOW</span>
                <strong className={p.item}>{r.money.balance <= 0 ? 'Your order is paid in full.' : r.po ? `Your purchase order ${r.po.number} covers it.` : 'Nothing is due right now.'}</strong>
              </section>
            )}
            <PaymentHistory list={r.payments ?? []} />
          </div>
          <OrderSummary r={r} />
        </div>
      )}
    </div>
  );
}
