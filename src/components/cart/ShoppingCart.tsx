'use client';

import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { FaDollarSign, FaExclamationTriangle, FaMinus, FaPlus, FaTimesCircle } from 'react-icons/fa';
import type { ShopImage } from '@/content/shop';
import { CART_KEY, writeCart } from './cartStore';
import styles from './ShoppingCart.module.css';

/** The cart lives in localStorage (see cartStore); re-read it when another tab changes it. */
const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener('clp-cart', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('clp-cart', onChange);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(CART_KEY) ?? '[]';
  } catch {
    return '[]';
  }
};
const serverSnapshot = () => null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORM_ERROR = 'Form contains errors, please correct all errors before submitting the order.';
const Price = ({ value }: { value: number }) => (
  <>
    <FaDollarSign className={styles.dollar} aria-hidden />
    {` ${value.toFixed(2)}`}
  </>
);

/**
 * The shopping cart (NextGEN Pro checkout): the photos whose HD download was added in the gallery lightbox,
 * a coupon box, the buyer's name and email (downloads need no shipping address), totals and the payment
 * buttons, which stay disabled until the form is valid. Hidden until the cart has been read, as on the original.
 */
export default function ShoppingCart({ images }: { images: Record<string, ShopImage> }) {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const items = useMemo(() => {
    if (raw === null) return [];
    try {
      const ids: unknown = JSON.parse(raw);
      return Array.isArray(ids) ? [...new Set(ids.map(String))].filter((id) => images[id]).map((id) => images[id]) : [];
    } catch {
      return [];
    }
  }, [raw, images]);

  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState(false);

  const setCart = (ids: string[]) => {
    writeCart(ids);
    window.dispatchEvent(new Event('clp-cart'));
  };
  const remove = (id: string) => setCart(items.map((i) => i.id).filter((i) => i !== id));

  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const nameError = name.trim() ? '' : 'Full Name is in an invalid format.';
  const emailError = EMAIL.test(email.trim()) ? '' : 'Email is in an invalid format.';
  const valid = !nameError && !emailError;

  const applyCoupon = (e: FormEvent) => {
    e.preventDefault();
    // Coupons are checked by the original's server; this copy has no coupons to accept.
    setCouponError(true);
  };
  const checkout = (e: FormEvent) => {
    e.preventDefault();
    if (valid) setNotice(true);
  };

  return (
    <div className={styles.page} data-header-tone="dark">
      <div className={styles.container}>
        <form className={`${styles.checkout} ${raw === null ? styles.loading : ''}`} onSubmit={checkout} noValidate>
          <div className={styles.links}>
            <a className={styles.btn} href="#" onClick={(e) => (e.preventDefault(), setCart([]))}>
              Empty cart
            </a>
          </div>
          <table className={styles.items}>
            <thead>
              <tr>
                <th className={styles.thumbCol}>Image</th>
                <th className={styles.qtyCol}>Quantity</th>
                <th className={styles.titleCol}>Description</th>
                <th className={styles.priceCol}>Price</th>
                <th className={styles.totalCol}>Totals</th>
              </tr>
            </thead>
            <tbody className={styles.images}>
              {items.map((image) => (
                <tr key={image.id} className={styles.item}>
                  <td className={`${styles.thumbCol} ${styles.imageCol}`}>
                    <div className={styles.thumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- the gallery's own resized copy */}
                      <img src={image.src} width={image.width} height={image.height} alt={image.title} title={image.title} />
                    </div>
                  </td>
                  <td className={`${styles.qtyCol} ${styles.download}`}>
                    <div className={styles.qty}>
                      <i role="button" aria-label="Remove one" onClick={() => remove(image.id)}>
                        <FaMinus />
                      </i>
                      <input type="number" min={0} value={1} readOnly tabIndex={-1} aria-label="Quantity" />
                      {/* A download is bought once: "+" stays greyed out. */}
                      <i aria-hidden>
                        <FaPlus />
                      </i>
                    </div>
                    <a className={styles.delete} href="#" aria-label="Remove from cart" onClick={(e) => (e.preventDefault(), remove(image.id))}>
                      <i>
                        <FaTimesCircle />
                      </i>
                    </a>
                  </td>
                  <td className={styles.titleCol}>
                    HD
                    <br />
                    {image.title}
                  </td>
                  <td className={styles.priceCol}>
                    <Price value={image.price} />
                  </td>
                  <td className={styles.totalCol}>
                    <span>
                      <Price value={image.price} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* The original always shows this row, even with items in the cart. */}
              <tr className={styles.noItems}>
                <td colSpan={5}>There have been no items added to your cart.</td>
              </tr>
              <tr className={styles.couponRow}>
                <td colSpan={5}>
                  <input
                    type="text"
                    className={styles.couponField}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    value={coupon}
                    onChange={(e) => (setCoupon(e.target.value), setCouponError(false))}
                  />{' '}
                  <button type="button" className={styles.apply} onClick={applyCoupon}>
                    Apply
                  </button>
                  <br />
                  {couponError && <div className={styles.couponError}>Invalid coupon</div>}
                </td>
              </tr>
              <tr className={styles.fieldsRow}>
                <td colSpan={5}>
                  <table className={styles.fields}>
                    <tbody>
                      {[
                        { id: 'name', label: 'Full Name', value: name, set: setName, error: nameError },
                        { id: 'email', label: 'Email', value: email, set: setEmail, error: emailError },
                      ].map((f) => (
                        <tr key={f.id}>
                          <td className={styles.fieldLabel}>
                            <label htmlFor={`cart-${f.id}`}>{f.label}</label>
                          </td>
                          <td className={styles.fieldInput} colSpan={3}>
                            <input
                              type={f.id === 'email' ? 'email' : 'text'}
                              id={`cart-${f.id}`}
                              name={f.id}
                              placeholder={f.label}
                              value={f.value}
                              onChange={(e) => (f.set(e.target.value), setNotice(false))}
                              aria-invalid={!!f.error}
                            />
                            {f.error && (
                              <span className={styles.fieldError} title={f.error}>
                                <FaExclamationTriangle aria-label={f.error} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr className={styles.subitemsRow}>
                <td colSpan={5}>
                  <div className={styles.subitems}>
                    <table>
                      <tbody>
                        <tr>
                          <th colSpan={4}>
                            <label>Subtotal:</label>
                          </th>
                          <th className={styles.amount}>
                            <Price value={subtotal} />
                          </th>
                        </tr>
                        <tr>
                          <th colSpan={4}>
                            <label>Total:</label>
                          </th>
                          <th className={styles.amount}>
                            <Price value={subtotal} />
                          </th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
          {/* With an empty cart the original shows no payment buttons at all. */}
          {items.length > 0 && (
            <div className={styles.buttons}>
              <button type="submit" className={styles.btn} disabled={!valid} title={valid ? undefined : FORM_ERROR}>
                Pay by check
              </button>
              <span className={styles.stripe}>
                <button type="submit" className={styles.btn} disabled={!valid} title={valid ? undefined : FORM_ERROR}>
                  <span>Pay with Card</span>
                </button>
              </span>
              <button type="submit" className={styles.btn} disabled={!valid} title={valid ? undefined : FORM_ERROR}>
                Place order
              </button>
            </div>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              Online checkout isn&apos;t connected on this site yet.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
