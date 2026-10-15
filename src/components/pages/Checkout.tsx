'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos (their own uploads), shown as they are. */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import ListingHero from '@/components/sections/ListingHero';
import { checkout, getCart, money, orderHref, type Cart } from '@/content/cart';
import { partnerHref } from '@/content/partnerPages';
import styles from './Checkout.module.css';

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];
const EMPTY = { name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', note: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Checkout (/checkout/?store=<slug>): a partner store's part of the shopper's cart, who they are and where it ships.
 * Online payment on: the order is made and the shopper goes to Stripe's checkout page (paid to CLP), then comes back to
 * the confirmation. Off: the order is placed unpaid and CLP contacts them to arrange payment.
 */
export default function Checkout() {
  const params = useSearchParams();
  const slug = params.get('store') ?? '';
  const cancelled = params.get('cancelled') === '1';
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let live = true;
    getCart(slug).then(
      (c) => live && setCart(c),
      (err) => live && setLoadError(err instanceof Error ? err.message : 'Could not load your cart.'),
    );
    return () => {
      live = false;
    };
  }, [slug]);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const errors = {
    name: form.name.trim() ? '' : 'Enter your name.',
    email: EMAIL.test(form.email.trim()) ? '' : 'Enter a valid email address.',
    line1: form.line1.trim() ? '' : 'Enter the street address.',
    city: form.city.trim() ? '' : 'Enter the city.',
    state: form.state ? '' : 'Choose the state.',
    postalCode: /^\d{5}(-\d{4})?$/.test(form.postalCode.trim()) ? '' : 'Enter a 5-digit ZIP code.',
  };
  const invalid = Object.values(errors).some(Boolean);
  const online = cart?.payments === 'online';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (invalid || !cart?.lines.length) return;
    setSending(true);
    setError('');
    try {
      const r = await checkout({
        slug,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        note: form.note.trim(),
        shipping: { line1: form.line1.trim(), line2: form.line2.trim(), city: form.city.trim(), state: form.state, postalCode: form.postalCode.trim(), country: 'US' },
      });
      // Online: Stripe's payment page; offline: the order's confirmation.
      window.location.href = r.payUrl ?? orderHref(r.order.id, r.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place your order. Please try again.');
      setSending(false);
    }
  };

  const field = (key: keyof typeof errors) => (tried && errors[key] ? <span className={styles.fieldError}>{errors[key]}</span> : null);

  return (
    <>
      <ListingHero title={['Checkout']} />
      <div className={styles.page} data-header-tone="dark">
        {!slug ? (
          <div className={styles.card}>
            <p className={styles.muted}>This checkout link isn’t complete. Open your cart from the partner’s page.</p>
          </div>
        ) : loadError ? (
          <div className={styles.card}>
            <p className={styles.error}>{loadError}</p>
          </div>
        ) : !cart ? (
          <div className={styles.card}>
            <p className={styles.muted} role="status">
              Loading your cart…
            </p>
          </div>
        ) : cart.lines.length === 0 ? (
          <div className={styles.card}>
            <p className={styles.title}>Your cart is empty</p>
            <a className={styles.secondary} href={partnerHref(slug)}>
              Back to the store
            </a>
          </div>
        ) : (
          <form className={styles.layout} onSubmit={submit} noValidate>
            <div className={styles.card}>
              {cancelled && <p className={styles.notice}>Payment was cancelled. Nothing was charged and your cart is still here.</p>}
              <h2 className={styles.section}>Contact</h2>
              <div className={styles.grid}>
                <label className={styles.field}>
                  Full name
                  <input className={styles.input} autoComplete="name" maxLength={120} value={form.name} onChange={set('name')} />
                  {field('name')}
                </label>
                <label className={styles.field}>
                  Email
                  <input className={styles.input} type="email" autoComplete="email" maxLength={200} value={form.email} onChange={set('email')} />
                  {field('email')}
                </label>
                <label className={`${styles.field} ${styles.wide}`}>
                  Phone (optional)
                  <input className={styles.input} type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={set('phone')} />
                </label>
              </div>
              <h2 className={styles.section}>Shipping address</h2>
              <div className={styles.grid}>
                <label className={`${styles.field} ${styles.wide}`}>
                  Street address
                  <input className={styles.input} autoComplete="address-line1" maxLength={120} value={form.line1} onChange={set('line1')} />
                  {field('line1')}
                </label>
                <label className={`${styles.field} ${styles.wide}`}>
                  Apartment, suite (optional)
                  <input className={styles.input} autoComplete="address-line2" maxLength={120} value={form.line2} onChange={set('line2')} />
                </label>
                <label className={styles.field}>
                  City
                  <input className={styles.input} autoComplete="address-level2" maxLength={80} value={form.city} onChange={set('city')} />
                  {field('city')}
                </label>
                <span className={styles.pair}>
                  <label className={styles.field}>
                    State
                    <select className={styles.input} autoComplete="address-level1" value={form.state} onChange={set('state')}>
                      <option value="">Choose…</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {field('state')}
                  </label>
                  <label className={styles.field}>
                    ZIP code
                    <input className={styles.input} inputMode="numeric" autoComplete="postal-code" maxLength={10} value={form.postalCode} onChange={set('postalCode')} />
                    {field('postalCode')}
                  </label>
                </span>
                <label className={`${styles.field} ${styles.wide}`}>
                  Note for the store (optional)
                  <textarea className={styles.input} rows={3} maxLength={500} value={form.note} onChange={set('note')} />
                </label>
              </div>
              <p className={styles.muted}>We ship within the United States.</p>
            </div>

            <aside className={styles.summary}>
              <h2 className={styles.section}>Your order</h2>
              {cart.lines.map((l) => (
                <div key={l.key} className={styles.line}>
                  <span className={styles.thumb}>{l.image && <img src={l.image} alt="" />}</span>
                  <span className={styles.lineText}>
                    <strong>{l.title}</strong>
                    <span className={styles.muted}>{[l.option, `Qty ${l.qty}`].filter(Boolean).join(' · ')}</span>
                  </span>
                  <strong>{money(l.price * l.qty)}</strong>
                </div>
              ))}
              <div className={styles.totals}>
                <span>
                  Subtotal <span>{money(cart.subtotal)}</span>
                </span>
                <span>
                  Shipping <span>Free</span>
                </span>
                <span className={styles.total}>
                  Total <span>{money(cart.subtotal)}</span>
                </span>
              </div>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className={styles.primary} disabled={sending}>
                {sending ? (online ? 'Opening secure payment…' : 'Placing your order…') : online ? `Pay ${money(cart.subtotal)}` : 'Place order'}
              </button>
              <p className={styles.small}>
                {online
                  ? 'You’ll pay on Stripe’s secure page (card, Apple Pay or Google Pay). Payments go to Compete Like Pros, who pays the store.'
                  : 'Online payment opens soon: nothing is charged now. Compete Like Pros e-mails you to arrange payment, then the store ships your order.'}
              </p>
              <a className={styles.back} href={partnerHref(slug)}>
                ← Back to the store
              </a>
            </aside>
          </form>
        )}
      </div>
    </>
  );
}
