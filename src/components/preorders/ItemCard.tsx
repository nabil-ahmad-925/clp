/* eslint-disable @next/next/no-img-element -- the partner's artwork pictures, shown as they are. */
import type { PublicItem } from '@/content/preorders';
import { money } from '@/content/cart';
import { draftKey, type Draft } from './preorderMath';
import styles from './Preorder.module.css';

/** A pre-order's item has a price; a paid-for link's item (free for the person) has none. */
type Props = { item: Pick<PublicItem, 'itemId' | 'name' | 'mockup' | 'sizes'> & { price?: number }; draft: Draft; setQty: (key: string, qty: number) => void; disabled?: boolean };

/** One item of a pre-order: its picture, price and a quantity for each size. */
export default function ItemCard({ item, draft, setQty, disabled }: Props) {
  const sizes = item.sizes.length ? item.sizes : [''];
  return (
    <article className={styles.item}>
      <img className={styles.itemImage} src={item.mockup} alt={`${item.name} with the team's artwork`} />
      <div className={styles.itemBody}>
        <h3 className={styles.itemName}>{item.name}</h3>
        {item.price !== undefined && <strong className={styles.itemPrice}>{money(item.price)}</strong>}
        <div className={styles.sizes}>
          {sizes.map((size) => {
            const key = draftKey(item.itemId, size);
            const qty = draft[key] ?? 0;
            const label = size || 'Quantity';
            return (
              <div key={key} className={`${styles.size} ${qty ? styles.sizeOn : ''}`}>
                <span className={styles.sizeLabel}>{label}</span>
                <div className={styles.stepper}>
                  <button type="button" aria-label={`Remove one ${item.name} ${label}`} disabled={disabled || qty === 0} onClick={() => setQty(key, qty - 1)}>
                    −
                  </button>
                  <span aria-live="polite">{qty}</span>
                  <button type="button" aria-label={`Add one ${item.name} ${label}`} disabled={disabled} onClick={() => setQty(key, qty + 1)}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
