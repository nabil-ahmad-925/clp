'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos (their own uploads), shown as they are. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { setHeaderBrand } from '@/components/layout/headerBrand';
import { useEffect, useState } from 'react';
import { getCheckout, getOrder, money, type CheckoutInfo, type ShopOrder } from '@/content/cart';
import { shopHref } from '@/content/storefront';
import styles from './Checkout.module.css';

const FULFILMENT: Partial<Record<ShopOrder['status'], string>> = { shipped: 'Shipped', done: 'Delivered', cancelled: 'Cancelled' };
/** While Stripe confirms a payment, the checkout is checked again this often, this many times. */
const POLL_MS = 2500;
const POLLS = 12;

/** The page's heading and line for the checkout's payment. */
function stateOf(orders: ShopOrder[]) {
  const status = (s: ShopOrder['paymentStatus']) => orders.some((o) => o.paymentStatus === s);
  const covered = orders.some((o) => o.claimant?.name);
  if (status('pending')) return { title: 'Confirming your payment…', text: 'This takes a few seconds. You can keep this page open.', done: false };
  if (status('expired')) return { title: 'Your payment wasn’t completed', text: 'Nothing was charged. Your cart is still here if you’d like to try again.', done: false };
  if (status('refunded')) return { title: 'This order was refunded', text: 'The payment was refunded in full.', done: false };
  if (status('unpaid'))
    return { title: 'Thanks, we got your order', text: 'Nothing was charged. Compete Like Pros will e-mail you to arrange payment, then your order ships.', done: true };
  return {
    title: 'Order confirmed',
    text: covered
      ? 'Thanks! Your claim is logged with the team, and covered items go on the team account (organizer billing or team credits). We’ll email your receipt and tracking.'
      : 'Thanks! We’ll email your receipt and tracking. Items from different stores may ship separately.',
    done: true,
  };
}

/**
 * The shopper's confirmation (/checkout/done/?checkout=<id>&t=<token>, or ?order=<id>&t=<token> for an order from
 * before checkouts): where Stripe sends them back after paying, and the link of an offline order. A payment still being
 * confirmed is checked again for a little while.
 */
export default function OrderDone() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    setHeaderBrand({ label: 'SHOP', shop: true, cartCount: 0, onCart: () => router.push(shopHref()) });
    return () => setHeaderBrand(null);
  }, [router]);
  const checkoutId = params.get('checkout') ?? '';
  const orderId = params.get('order') ?? '';
  const token = params.get('t') ?? '';
  const [data, setData] = useState<{ checkout: CheckoutInfo | null; orders: ShopOrder[] } | null>(null);
  const [error, setError] = useState('');
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if ((!checkoutId && !orderId) || !token) return;
    let live = true;
    const load = () => (checkoutId ? getCheckout(checkoutId, token) : getOrder(orderId, token).then((order) => ({ checkout: null, orders: [order] })));
    const timer = window.setTimeout(
      () =>
        load().then(
          (d) => {
            if (!live) return;
            setData(d);
            if (d.orders.some((o) => o.paymentStatus === 'pending') && polls < POLLS) setPolls((n) => n + 1);
          },
          (err) => live && setError(err instanceof Error ? err.message : 'Could not load your order.'),
        ),
      polls ? POLL_MS : 0,
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [checkoutId, orderId, token, polls]);

  const orders = data?.orders ?? [];
  const state = orders.length ? stateOf(orders) : null;
  const number = data?.checkout?.number ?? orders[0]?.number ?? '';
  const total = data?.checkout?.amounts.total ?? orders.reduce((n, o) => n + o.total, 0);

  return (
    <>
      <section className={styles.band} data-header-tone="light" />
      <div className={styles.page} data-header-tone="dark">
        {(!checkoutId && !orderId) || !token ? (
          <div className={styles.card}>
            <p className={styles.muted}>This order link isn’t complete. Use the link in your order e-mail.</p>
          </div>
        ) : error ? (
          <div className={styles.card}>
            <p className={styles.error}>{error}</p>
          </div>
        ) : !state ? (
          <div className={styles.card}>
            <p className={styles.muted} role="status">
              Loading your order…
            </p>
          </div>
        ) : (
          <section className={styles.done}>
            <span className={`${styles.doneMark} ${state.done ? '' : styles.doneWait}`} aria-hidden>
              {state.done ? '✓' : '…'}
            </span>
            <span className={styles.doneNumber}>ORDER #{number}</span>
            <h1 className={styles.doneTitle}>{state.title}</h1>
            <span className={styles.doneText} role="status">
              {orders.some((o) => o.paymentStatus === 'pending') && polls >= POLLS ? 'It’s taking longer than usual. We’ll e-mail you as soon as it’s confirmed.' : state.text}
            </span>
            <strong className={styles.donePaid}>
              {orders.every((o) => o.paymentStatus === 'paid') ? 'Total paid' : 'Total'}: {money(total)}
            </strong>
            <div className={styles.doneOrders}>
              {orders.map((o) => (
                <div key={o.id} className={styles.doneOrder}>
                  <span className={styles.doneStore}>
                    <strong>{o.partner.name}</strong>
                    <span>
                      {o.number}
                      {FULFILMENT[o.status] ? ` · ${FULFILMENT[o.status]}` : ''}
                    </span>
                  </span>
                  {o.lines.map((l, i) => (
                    <div key={`${l.productId}-${i}`} className={styles.line}>
                      <span className={styles.thumb}>
                        {l.image && <img src={l.image} alt="" />}
                        <span className={styles.qtyBadge}>{l.qty}</span>
                      </span>
                      <span className={styles.lineText}>
                        <strong>{l.title}</strong>
                        <span>{[l.option, l.coveredQty ? `${l.coveredQty} covered` : ''].filter(Boolean).join(' · ')}</span>
                      </span>
                      <strong className={styles.linePrice}>{money(l.price * l.qty)}</strong>
                    </div>
                  ))}
                  <span className={styles.doneShip}>
                    {o.delivery === 'pickup'
                      ? `Pick up from ${o.partner.name}${o.pickupNote ? `: ${o.pickupNote}` : ''}`
                      : o.shipping
                        ? `Ships to ${[o.shipping.line1, o.shipping.line2, `${o.shipping.city}, ${o.shipping.state} ${o.shipping.postalCode}`].filter(Boolean).join(', ')}`
                        : ''}
                  </span>
                </div>
              ))}
            </div>
            <Link className={styles.keep} href={shopHref()}>
              Keep Shopping
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
