'use client';

import { useSearchParams } from 'next/navigation';
import OrderView from './OrderView';
import ShopView from './ShopView';
import styles from './Preorder.module.css';

/** /pre-order/?c=<id> is a pre-order's page, /pre-order/?o=<id>&t=<secret> a buyer's own order. */
export default function PreorderPage() {
  const params = useSearchParams();
  const pre = params.get('c') ?? '';
  const order = params.get('o') ?? '';
  const token = params.get('t') ?? '';
  return (
    <>
      <section className={styles.band} data-header-tone="light" />
      <div className={styles.page} data-header-tone="dark">
        {order && token ? <OrderView id={order} token={token} /> : pre ? <ShopView id={pre} /> : <p className={styles.muted}>This link isn’t complete. Use the link the organizer shared with you.</p>}
      </div>
    </>
  );
}
