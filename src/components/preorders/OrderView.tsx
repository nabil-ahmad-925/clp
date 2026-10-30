'use client';

import { useEffect, useState } from 'react';
import { money } from '@/content/cart';
import { cancelOrder, changeOrder, getOrder, type PreorderOrder } from '@/content/preorders';
import ItemCard from './ItemCard';
import OrderForm from './OrderForm';
import OrderSummary from './OrderSummary';
import PreorderHero from './PreorderHero';
import { draftOf } from './preorderMath';
import { useDraft } from './useDraft';
import styles from './Preorder.module.css';

/** Edits an order: the pre-order's items with this order's pieces, and the form to save them. */
function EditOrder({ order, token, onSaved, onDone }: { order: PreorderOrder; token: string; onSaved: (o: PreorderOrder) => void; onDone: () => void }) {
  const { draft, setQty } = useDraft(draftOf(order.lines));
  return (
    <div className={styles.layout}>
      <section className={styles.items} aria-label="Items">
        {order.preorder.items.map((item) => (
          <ItemCard key={item.itemId} item={item} draft={draft} setQty={setQty} />
        ))}
      </section>
      <OrderForm
        preorder={order.preorder}
        draft={draft}
        initial={{ name: order.name, email: order.email, phone: order.phone }}
        submitLabel="Save Changes"
        onSubmit={async (input) => {
          onSaved(await changeOrder(order.id, token, input));
          onDone();
        }}
        onCancel={onDone}
      />
    </div>
  );
}

/** A buyer's own order (/pre-order/?o=<id>&t=<secret>): what they ordered, what they owe, and changing or cancelling it until orders close. */
export default function OrderView({ id, token }: { id: string; token: string }) {
  const [order, setOrder] = useState<PreorderOrder | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    getOrder(id, token).then(
      (o) => live && setOrder(o),
      (err) => live && setError(err instanceof Error ? err.message : 'Could not load your order.'),
    );
    return () => {
      live = false;
    };
  }, [id, token]);

  async function cancel() {
    try {
      setOrder(await cancelOrder(id, token));
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel your order.');
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setError('Copy this page’s address from your browser instead.');
    }
  }

  if (!order) return error ? <p className={styles.error}>{error}</p> : <p className={styles.muted}>Loading your order…</p>;
  if (editing) return <EditOrder order={order} token={token} onSaved={setOrder} onDone={() => setEditing(false)} />;

  return (
    <>
      <PreorderHero preorder={order.preorder} />
      <OrderSummary order={order} />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        {order.canChange && (
          <button className={styles.primary} type="button" onClick={() => setEditing(true)}>
            Change Order
          </button>
        )}
        <button className={styles.secondary} type="button" onClick={copy}>
          {copied ? 'Link Copied' : 'Copy Order Link'}
        </button>
        {order.canChange && !confirming && (
          <button className={styles.danger} type="button" onClick={() => setConfirming(true)}>
            Cancel Order
          </button>
        )}
      </div>
      {confirming && (
        <div className={styles.confirm} role="alertdialog" aria-label="Cancel this order">
          <span>Cancel this order of {money(order.total)}?</span>
          <button className={styles.danger} type="button" onClick={cancel}>
            Yes, Cancel It
          </button>
          <button className={styles.secondary} type="button" onClick={() => setConfirming(false)}>
            Keep It
          </button>
        </div>
      )}
      <p className={styles.note}>Save this page’s link: it’s the only way back to your order.</p>
    </>
  );
}
