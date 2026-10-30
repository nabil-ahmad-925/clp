'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { pickHref, placePick, type GiftItem, type PublicLink, type Shipping } from '@/content/links';
import ItemCard from '../preorders/ItemCard';
import { linesOf, piecesOf } from '../preorders/preorderMath';
import { useDraft } from '../preorders/useDraft';
import styles from '../preorders/Preorder.module.css';

const BLANK = { name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' };
type Form = typeof BLANK;
const ADDRESS: [keyof Form, string, string][] = [
  ['line1', 'Street Address', 'address-line1'],
  ['line2', 'Apartment or Suite (Optional)', 'address-line2'],
  ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'],
  ['postalCode', 'ZIP Code', 'postal-code'],
];

const allowText = (a: PublicLink['allow']) => (a?.count !== undefined ? `You can pick ${a.count} ${a.count === 1 ? 'item' : 'items'}.` : a?.value !== undefined ? `You can pick up to $${a.value} of items.` : '');

/** A paid-for link: the items to pick from (free for the person), their details and, when each person gets theirs, where to send it. */
export default function GiftLink({ page, link, data, items, keyValue }: { page: string; link: string; data: PublicLink; items: GiftItem[]; keyValue: string }) {
  const router = useRouter();
  const { draft, setQty } = useDraft({}, data.allow?.count);
  const [form, setForm] = useState<Form>(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pieces = piecesOf(draft);
  const open = data.phase === 'open';
  const field = (k: keyof Form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });
  const lines = linesOf(draft, { items });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { name, email, phone, ...address } = form;
    const shipping: Shipping | undefined = data.ship === 'each' ? address : undefined;
    try {
      const { pick, token } = await placePick(page, link, { key: keyValue || undefined, name, email, phone, shipping, lines });
      router.push(pickHref(pick.id, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className={styles.layout}>
      <section className={styles.items} aria-label="Items">
        {items.map((item) => (
          <ItemCard key={item.itemId} item={item} draft={draft} setQty={setQty} disabled={!open} />
        ))}
      </section>
      {open && (
        <form className={styles.form} onSubmit={submit} noValidate>
          <h2 className={styles.formTitle}>Your Pick</h2>
          <div className={styles.summary}>
            <span>{pieces} {pieces === 1 ? 'piece' : 'pieces'}</span>
            <strong>Free</strong>
          </div>
          <p className={styles.note}>{allowText(data.allow)} You can pick once.</p>
          <label className={styles.label}>
            Your Name
            <input className={styles.input} autoComplete="name" required {...field('name')} />
          </label>
          <label className={styles.label}>
            Email
            <input className={styles.input} type="email" autoComplete="email" required {...field('email')} />
          </label>
          <label className={styles.label}>
            Phone (Optional)
            <input className={styles.input} type="tel" autoComplete="tel" {...field('phone')} />
          </label>
          {data.ship === 'each' ? (
            ADDRESS.map(([k, label, auto]) => (
              <label key={k} className={styles.label}>
                {label}
                <input className={styles.input} autoComplete={auto} {...field(k)} />
              </label>
            ))
          ) : (
            <p className={styles.note}>Your items are shipped to {data.partner.name} together, and they hand them out.</p>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button className={styles.primary} type="submit" disabled={busy || !pieces}>
            {busy ? 'Saving…' : 'Confirm My Pick'}
          </button>
        </form>
      )}
    </div>
  );
}
