'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos (their own uploads), shown as they are. */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ListingHero from '@/components/sections/ListingHero';
import { getOrder, money, type ShopOrder } from '@/content/cart';
import { partnerHref } from '@/content/partnerPages';
import styles from './Checkout.module.css';

const PAYMENT: Record<ShopOrder['paymentStatus'], { label: string; className: string; title: string; text: string }> = {
  paid: { label: 'Paid', className: styles.paid, title: 'Thanks, your order is confirmed', text: 'Your payment went through. The store ships your order to the address below, and we e-mailed you a receipt.' },
  pending: { label: 'Confirming payment', className: styles.waiting, title: 'Confirming your payment…', text: 'This takes a few seconds. You can keep this page open.' },
  unpaid: { label: 'Awaiting payment', className: styles.waiting, title: 'Thanks, we got your order', text: 'Nothing was charged. Compete Like Pros will e-mail you to arrange payment, then the store ships your order.' },
  expired: { label: 'Not paid', className: styles.stopped, title: 'Your payment wasn’t completed', text: 'Nothing was charged. Your cart is still on the store’s page if you’d like to try again.' },
  refunded: { label: 'Refunded', className: styles.stopped, title: 'This order was refunded', text: 'The payment was refunded in full.' },
};
const FULFILMENT: Partial<Record<ShopOrder['status'], string>> = { shipped: 'Shipped', done: 'Delivered', cancelled: 'Cancelled' };
/** While Stripe confirms a payment, the order is checked again this often, this many times. */
const POLL_MS = 2500;
const POLLS = 12;

/**
 * The shopper's order (/checkout/done/?order=<id>&t=<token>): where Stripe sends them back after paying, and the link of
 * an offline order. A payment still being confirmed is checked again for a little while.
 */
export default function OrderDone() {
  const params = useSearchParams();
  const id = params.get('order') ?? '';
  const token = params.get('t') ?? '';
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [error, setError] = useState('');
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!id || !token) return;
    let live = true;
    const timer = window.setTimeout(
      () =>
        getOrder(id, token).then(
          (o) => {
            if (!live) return;
            setOrder(o);
            if (o.paymentStatus === 'pending' && polls < POLLS) setPolls((n) => n + 1);
          },
          (err) => live && setError(err instanceof Error ? err.message : 'Could not load your order.'),
        ),
      polls ? POLL_MS : 0,
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [id, token, polls]);

  const state = order ? PAYMENT[order.paymentStatus] : null;
  return (
    <>
      <ListingHero title={['Your order']} blurb={order ? order.partner.name : undefined} />
      <div className={styles.page} data-header-tone="dark">
        <div className={`${styles.card} ${styles.narrow}`}>
          {!id || !token ? (
            <p className={styles.muted}>This order link isn’t complete. Use the link in your order e-mail.</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : !order || !state ? (
            <p className={styles.muted} role="status">
              Loading your order…
            </p>
          ) : (
            <div className={styles.stack}>
              <span className={styles.badges}>
                <span className={`${styles.badge} ${state.className}`}>{state.label}</span>
                {FULFILMENT[order.status] && <span className={`${styles.badge} ${styles.neutral}`}>{FULFILMENT[order.status]}</span>}
              </span>
              <h2 className={styles.title}>{state.title}</h2>
              <p className={styles.muted} role="status">
                {order.paymentStatus === 'pending' && polls >= POLLS ? 'It’s taking longer than usual. We’ll e-mail you as soon as it’s confirmed.' : state.text}
              </p>
              <dl className={styles.facts}>
                <dt>Order</dt>
                <dd>{order.number}</dd>
                <dt>Store</dt>
                <dd>{order.partner.name}</dd>
                <dt>Ship to</dt>
                <dd>{[order.shipping.line1, order.shipping.line2, `${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}`].filter(Boolean).join(', ')}</dd>
              </dl>
              <div className={styles.lines}>
                {order.lines.map((l, i) => (
                  <div key={`${l.productId}-${i}`} className={styles.line}>
                    <span className={styles.thumb}>{l.image && <img src={l.image} alt="" />}</span>
                    <span className={styles.lineText}>
                      <strong>{l.title}</strong>
                      <span className={styles.muted}>{[l.option, `Qty ${l.qty}`].filter(Boolean).join(' · ')}</span>
                    </span>
                    <strong>{money(l.price * l.qty)}</strong>
                  </div>
                ))}
                <span className={`${styles.totals} ${styles.total}`}>
                  Total <span>{money(order.total)}</span>
                </span>
              </div>
              <a className={styles.secondary} href={partnerHref(order.partner.slug)}>
                Back to {order.partner.name}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
