/* eslint-disable @next/next/no-img-element -- the partner's product photos (their own uploads), shown as they are. */
import Link from 'next/link';
import { money } from '@/content/cart';
import type { SellProduct } from '@/content/links';
import { productHref } from '@/content/storefront';
import styles from '../preorders/Preorder.module.css';

/** A link for sale: the partner's store products, each opening its product page (the shop's cart takes it from there). */
export default function SellLink({ partner, items }: { partner: string; items: SellProduct[] }) {
  if (!items.length) return <p className={styles.muted}>These products aren’t available right now.</p>;
  return (
    <section className={styles.items} aria-label="Products">
      {items.map((p) => (
        <Link key={p.productId} className={styles.item} href={productHref(partner, p.productId)} style={{ color: 'inherit', textDecoration: 'none' }}>
          <img className={styles.itemImage} src={p.image} alt={p.title} />
          <div className={styles.itemBody}>
            <h3 className={styles.itemName}>{p.title}</h3>
            <strong className={styles.itemPrice}>{money(p.price)}</strong>
            <span className={styles.meta}>Choose Size and Buy</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
