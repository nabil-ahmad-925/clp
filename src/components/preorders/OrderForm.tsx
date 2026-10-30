'use client';

import { useState } from 'react';
import { money } from '@/content/cart';
import type { OrderInput, PublicPreorder } from '@/content/preorders';
import { linesOf, piecesOf, totalOf, MAX_PIECES, type Draft } from './preorderMath';
import styles from './Preorder.module.css';

type Contact = { name: string; email: string; phone: string };
type Props = {
  preorder: PublicPreorder;
  draft: Draft;
  initial?: Contact;
  submitLabel: string;
  /** Saves the order; rejects with the message to show. */
  onSubmit: (input: OrderInput) => Promise<void>;
  onCancel?: () => void;
};

/** The buyer's name, email and phone, what they picked and its total, and the button that sends it. */
export default function OrderForm({ preorder, draft, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [contact, setContact] = useState<Contact>(initial ?? { name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pieces = piecesOf(draft);
  const field = (key: keyof Contact) => ({ value: contact[key], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setContact({ ...contact, [key]: e.target.value }) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pieces) return setError('Pick at least one item.');
    setBusy(true);
    setError('');
    try {
      await onSubmit({ ...contact, lines: linesOf(draft, preorder) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h2 className={styles.formTitle}>Your Order</h2>
      <div className={styles.summary}>
        <span>
          {pieces} {pieces === 1 ? 'piece' : 'pieces'}
          {pieces >= MAX_PIECES ? ` (the most in one order)` : ''}
        </span>
        <strong>{money(totalOf(draft, preorder))}</strong>
      </div>
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
      <p className={styles.note}>Nothing is charged here. CLP arranges payment with you before your order is made, and the pieces are handed out by {preorder.partner.name}.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={busy || !pieces}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button className={styles.secondary} type="button" onClick={onCancel} disabled={busy}>
            Keep My Order As It Is
          </button>
        )}
      </div>
    </form>
  );
}
