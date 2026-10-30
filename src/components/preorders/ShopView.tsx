'use client';

import { useRouter } from 'next/navigation';
import { placeOrder, orderHref } from '@/content/preorders';
import ItemCard from './ItemCard';
import OrderForm from './OrderForm';
import PreorderHero from './PreorderHero';
import { acceptsOrders } from './preorderMath';
import { usePreorder } from './usePreorder';
import { useDraft } from './useDraft';
import styles from './Preorder.module.css';

/** A pre-order's page (/pre-order/?c=<id>): pick pieces, then place the order. */
export default function ShopView({ id }: { id: string }) {
  const router = useRouter();
  const { preorder, error } = usePreorder(id);
  const { draft, setQty } = useDraft();
  if (error) return <p className={styles.error}>{error}</p>;
  if (!preorder) return <p className={styles.muted}>Loading…</p>;
  const open = acceptsOrders(preorder);

  return (
    <>
      <PreorderHero preorder={preorder} />
      <div className={styles.layout}>
        <section className={styles.items} aria-label="Items">
          {preorder.items.map((item) => (
            <ItemCard key={item.itemId} item={item} draft={draft} setQty={setQty} disabled={!open} />
          ))}
        </section>
        {open && (
          <OrderForm
            preorder={preorder}
            draft={draft}
            submitLabel="Place Pre-order"
            onSubmit={async (input) => {
              const { order, token } = await placeOrder(id, input);
              router.push(orderHref(order.id, token));
            }}
          />
        )}
      </div>
    </>
  );
}
