import type { BulkRequest, Payment } from '@/content/bulk';
import p from './pay.module.css';

export const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const METHOD: Record<string, string> = { bank: 'Bank transfer', zelle: 'Zelle', check: 'Check', card: 'Card', other: 'Other' };
const KIND = { deposit: 'Deposit', full: 'Paid in full', balance: 'Balance' } as const;
const STATUS = { submitted: ['Being confirmed', '#F2F1ED', '#444444'], confirmed: ['Received', '#E7F3EC', '#1E7A45'], rejected: ['Not received', '#FBEAE8', '#B03A2E'] } as const;

/** The order and its money: item, quantity, total, the 50% deposit, the balance, what's paid and waiting. */
export function OrderSummary({ r }: { r: BulkRequest }) {
  const m = r.money!;
  return (
    <section className={p.card} aria-label="Your order">
      <span className={p.kicker}>YOUR ORDER</span>
      <strong className={p.item}>
        {r.qty} × {r.itemName}
      </strong>
      <span className={p.mut}>{[r.ref, r.quote ? `${money(r.quote.unitPrice)} each` : ''].filter(Boolean).join(' · ')}</span>
      <dl className={p.rows}>
        {r.shipment?.price && (
          <>
            <dt>Shipping (freight, duties and handling)</dt>
            <dd>{money(r.shipment.price.amount)}</dd>
          </>
        )}
        <dt>Order total</dt>
        <dd>{money(m.total)}</dd>
        <dt>Deposit (50%)</dt>
        <dd>{money(m.deposit)}</dd>
        <dt>Balance (before shipping)</dt>
        <dd>{money(Math.round((m.total - m.deposit) * 100) / 100)}</dd>
        <dt>Paid</dt>
        <dd>{money(m.paid)}</dd>
        {m.pending > 0 && (
          <>
            <dt>Being confirmed</dt>
            <dd>{money(m.pending)}</dd>
          </>
        )}
        <dt className={p.strong}>Left to pay</dt>
        <dd className={p.strong}>{money(m.balance)}</dd>
      </dl>
    </section>
  );
}

/** Every payment on the order, newest first: amount, how, the reference, and where it stands (with CLP's note). */
export function PaymentHistory({ list }: { list: Payment[] }) {
  if (!list.length) return null;
  return (
    <section className={p.card} aria-label="Your payments">
      <span className={p.kicker}>YOUR PAYMENTS</span>
      <ul className={p.history}>
        {[...list].reverse().map((x) => {
          const [label, bg, fg] = STATUS[x.status];
          return (
            <li key={x.id}>
              <span>
                <b>
                  {money(x.amount)} · {KIND[x.kind]}
                </b>
                <span className={p.mut}>
                  {METHOD[x.method] ?? x.method} · ref {x.reference || '—'} · {x.sentOn ? `sent ${day(x.sentOn)}` : day(x.at)}
                </span>
                {x.reviewNote && <span className={p.warn}>{x.reviewNote}</span>}
              </span>
              <span className={p.chip} style={{ background: bg, color: fg }}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
