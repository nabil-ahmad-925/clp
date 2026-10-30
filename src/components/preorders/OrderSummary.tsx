import type { PreorderOrder } from '@/content/preorders';
import { money } from '@/content/cart';
import { moneyLine } from './preorderMath';
import styles from './Preorder.module.css';

/** A placed order: its number, pieces, total and where the money stands. */
export default function OrderSummary({ order }: { order: PreorderOrder }) {
  return (
    <section className={styles.order} aria-label="Your order">
      <div className={styles.orderHead}>
        <span className={styles.orderNumber}>ORDER #{order.number}</span>
        <strong>{order.status === 'cancelled' ? 'Cancelled' : money(order.total)}</strong>
      </div>
      <ul className={styles.lines}>
        {order.lines.map((l) => (
          <li key={`${l.itemId}-${l.size}`}>
            <span>
              {l.qty} × {l.name}
              {l.size ? ` (${l.size})` : ''}
            </span>
            <span>{money(l.total)}</span>
          </li>
        ))}
      </ul>
      <p className={styles.money}>{moneyLine(order)}</p>
      <p className={styles.meta}>
        {order.name} · {order.email}
        {order.phone ? ` · ${order.phone}` : ''}
      </p>
    </section>
  );
}
