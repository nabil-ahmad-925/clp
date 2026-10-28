'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos (their own uploads), shown as they are. */

import Link from 'next/link';
import StoresSupport from '@/components/partners/donate/StoresSupport';
import { useRouter, useSearchParams } from 'next/navigation';
import { setHeaderBrand } from '@/components/layout/headerBrand';
import { useEffect, useState, type FormEvent } from 'react';
import { CART_EVENT, cartChanged, checkout, checkoutDoneHref, getCart, keepCodes, money, orderHref, readCodes, type Cart, type Delivery } from '@/content/cart';
import { shopHref } from '@/content/storefront';
import styles from './Checkout.module.css';

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];
const EMPTY = { name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', note: '', claimName: '', claimRole: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Checkout (/checkout/[?store=<slug>], the Shop design's one page): the whole cart (or one store's part), who the
 * shopper is, how it reaches them (shipped, or picked up when every store offers it), discount and team codes (a team
 * code asks who is claiming), and the order summary with every amount. Online payment: the orders are made and the
 * shopper pays on Stripe's page (card, Apple Pay or Google Pay; to CLP), then comes back to the confirmation. Off, or
 * nothing to pay: the orders are placed at once.
 */
export default function Checkout() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get('store') ?? '';
  const cancelled = params.get('cancelled') === '1';
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [marketing, setMarketing] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>('ship');
  const [codes, setCodes] = useState<string[]>(() => (typeof window === 'undefined' ? [] : readCodes()));
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // The cart, priced with the codes and delivery (again whenever they change, or the cart changes elsewhere).
  useEffect(() => {
    let live = true;
    getCart(slug || undefined, { codes, delivery }).then(
      (c) => {
        if (!live) return;
        setCart(c);
        if (c.badCodes?.length) {
          const good = codes.filter((x) => !c.badCodes!.includes(x));
          setCodeError('That code isn’t valid for this order.');
          setCodes(good);
          keepCodes(good);
        }
        if (delivery === 'pickup' && !c.pickup) setDelivery('ship');
      },
      (err) => live && setLoadError(err instanceof Error ? err.message : 'Could not load your cart.'),
    );
    const onChange = () => getCart(slug || undefined, { codes, delivery }).then((c) => live && setCart(c), () => {});
    window.addEventListener(CART_EVENT, onChange);
    return () => {
      live = false;
      window.removeEventListener(CART_EVENT, onChange);
    };
  }, [slug, codes, delivery]);

  // The shop's header ("CLP │ SHOP"), its cart going back to the shop.
  const count = cart?.count ?? 0;
  useEffect(() => {
    setHeaderBrand({ label: 'SHOP', shop: true, cartCount: count, onCart: () => router.push(shopHref()) });
  }, [count, router]);
  useEffect(() => () => setHeaderBrand(null), []);

  const team = cart?.codes?.find((c) => c.kind === 'team');
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const ship = delivery === 'ship';
  const errors = {
    name: form.name.trim() ? '' : 'Enter your name.',
    email: EMAIL.test(form.email.trim()) ? '' : 'Enter a valid email address.',
    line1: !ship || form.line1.trim() ? '' : 'Enter the street address.',
    city: !ship || form.city.trim() ? '' : 'Enter the city.',
    state: !ship || form.state ? '' : 'Choose the state.',
    postalCode: !ship || /^\d{5}(-\d{4})?$/.test(form.postalCode.trim()) ? '' : 'Enter a 5-digit ZIP code.',
    claimName: !team || form.claimName.trim() ? '' : 'Enter the player or staff name.',
  };
  const invalid = Object.values(errors).some(Boolean);
  const totals = cart?.totals;
  const online = cart?.payments === 'online';
  const nothingToPay = Boolean(cart?.allCovered || (totals && totals.total === 0));

  const applyCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(code)) {
      setCodeError('That code isn’t valid for this order.');
      return;
    }
    setCodeError('');
    setCodeInput('');
    const next = [...codes.filter((c) => c !== code), code];
    setCodes(next);
    keepCodes(next);
  };
  const removeCode = (code: string) => {
    const next = codes.filter((c) => c !== code);
    setCodes(next);
    keepCodes(next);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setTried(true);
    if (invalid || !cart?.lines.length) return;
    setSending(true);
    setError('');
    try {
      const r = await checkout({
        ...(slug ? { slug } : {}),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        note: form.note.trim(),
        delivery,
        ...(ship ? { shipping: { line1: form.line1.trim(), line2: form.line2.trim(), city: form.city.trim(), state: form.state, postalCode: form.postalCode.trim(), country: 'US' } } : {}),
        codes,
        ...(team ? { claimant: { name: form.claimName.trim(), role: form.claimRole.trim() } } : {}),
        marketing,
      });
      keepCodes([]);
      cartChanged(r.cart);
      // Online: Stripe's payment page; otherwise the confirmation.
      window.location.href = r.payUrl ?? (r.checkout ? checkoutDoneHref(r.checkout.id, r.token) : orderHref(r.orders[0].id, r.token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place your order. Please try again.');
      setSending(false);
    }
  };

  const field = (key: keyof typeof errors) => (tried && errors[key] ? <span className={styles.fieldError}>{errors[key]}</span> : null);
  const payLabel = sending ? (online && !nothingToPay ? 'Opening secure payment…' : 'Placing your order…') : nothingToPay ? 'Place order · $0.00' : online ? `Pay ${money(totals?.total ?? 0)}` : 'Place order';

  return (
    <>
      <section className={styles.band} data-header-tone="light" />
      <div className={styles.page} data-header-tone="dark">
        {loadError ? (
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
            <h1 className={styles.title}>Your cart is empty</h1>
            <Link className={styles.primarySmall} href={shopHref()}>
              Keep Shopping
            </Link>
          </div>
        ) : (
          <form className={styles.layout} onSubmit={submit} noValidate>
            <div className={styles.main}>
              <div className={styles.head}>
                <nav className={styles.crumbs}>
                  <Link href={shopHref()}>Shop</Link> › Checkout
                </nav>
                <h1 className={styles.h1}>Checkout</h1>
                <span className={styles.muted}>One page. Pay in one tap.</span>
              </div>
              {cancelled && <p className={styles.notice}>Payment was cancelled. Nothing was charged and your cart is still here.</p>}

              {online && !nothingToPay && (
                <div className={styles.block}>
                  <span className={styles.small}>Express checkout</span>
                  <div className={styles.express}>
                    <button type="button" className={`${styles.expressBtn} ${styles.applePay}`} onClick={() => submit()} disabled={sending}>
                      Apple Pay
                    </button>
                    <button type="button" className={`${styles.expressBtn} ${styles.googlePay}`} onClick={() => submit()} disabled={sending}>
                      Google Pay
                    </button>
                  </div>
                  <span className={styles.or}>
                    <span />
                    or pay with card
                    <span />
                  </span>
                </div>
              )}

              <div className={styles.block}>
                <h2 className={styles.section}>Contact</h2>
                <div className={styles.grid2}>
                  <label className={styles.field}>
                    <span className={styles.srOnly}>Full name</span>
                    <input className={styles.input} placeholder="Full name" autoComplete="name" maxLength={120} value={form.name} onChange={set('name')} />
                    {field('name')}
                  </label>
                  <label className={styles.field}>
                    <span className={styles.srOnly}>Email</span>
                    <input className={styles.input} type="email" placeholder="Email" autoComplete="email" maxLength={200} value={form.email} onChange={set('email')} />
                    {field('email')}
                  </label>
                </div>
                <label className={styles.check}>
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Email me drops and news from CLP
                </label>
              </div>

              {team && (
                <div className={styles.claim}>
                  <span className={styles.claimHead}>
                    <h2 className={styles.section}>Who’s claiming?</h2>
                    <span className={styles.claimCode}>{team.label.toUpperCase()}</span>
                  </span>
                  <div className={styles.claimGrid}>
                    <label className={styles.field}>
                      <span className={styles.srOnly}>Player or staff name</span>
                      <input className={styles.input} placeholder="Player or staff name" maxLength={80} value={form.claimName} onChange={set('claimName')} />
                      {field('claimName')}
                    </label>
                    <label className={styles.field}>
                      <span className={styles.srOnly}>Jersey number or role</span>
                      <input className={styles.input} placeholder="Jersey # or role" maxLength={40} value={form.claimRole} onChange={set('claimRole')} />
                    </label>
                  </div>
                  <span className={styles.claimNote}>
                    {team.team || 'The team'} sees what each person claims. Covered items are billed to the coach or organizer, or paid from the team’s available credits.
                  </span>
                </div>
              )}

              <div className={styles.block}>
                <h2 className={styles.section}>Delivery</h2>
                <div className={styles.options} role="radiogroup" aria-label="Delivery">
                  <button type="button" role="radio" aria-checked={ship} className={`${styles.option} ${ship ? styles.optionOn : ''}`} onClick={() => setDelivery('ship')}>
                    <span className={styles.radio}>
                      <span />
                    </span>
                    <span className={styles.optionText}>
                      <strong>Ship to Me</strong>
                      <span>Standard shipping in the United States</span>
                    </span>
                    <strong>{ship ? (totals?.shipping ? money(totals.shipping) : 'Free') : ''}</strong>
                  </button>
                  {cart.pickup && (
                    <button type="button" role="radio" aria-checked={!ship} className={`${styles.option} ${!ship ? styles.optionOn : ''}`} onClick={() => setDelivery('pickup')}>
                      <span className={styles.radio}>
                        <span />
                      </span>
                      <span className={styles.optionText}>
                        <strong>Pick Up from the Team</strong>
                        <span>{cart.stores?.map((st) => st.pickupNote).filter(Boolean).join(' · ') || 'Collect at practice or the next CLP event'}</span>
                      </span>
                      <strong>Free</strong>
                    </button>
                  )}
                </div>
                {ship && (
                  <div className={styles.address}>
                    <label className={`${styles.field} ${styles.full}`}>
                      <span className={styles.srOnly}>Address</span>
                      <input className={styles.input} placeholder="Address" autoComplete="address-line1" maxLength={120} value={form.line1} onChange={set('line1')} />
                      {field('line1')}
                    </label>
                    <label className={`${styles.field} ${styles.full}`}>
                      <span className={styles.srOnly}>Apartment, suite (optional)</span>
                      <input className={styles.input} placeholder="Apartment, suite (optional)" autoComplete="address-line2" maxLength={120} value={form.line2} onChange={set('line2')} />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.srOnly}>City</span>
                      <input className={styles.input} placeholder="City" autoComplete="address-level2" maxLength={80} value={form.city} onChange={set('city')} />
                      {field('city')}
                    </label>
                    <label className={styles.field}>
                      <span className={styles.srOnly}>State</span>
                      <select className={styles.input} autoComplete="address-level1" value={form.state} onChange={set('state')}>
                        <option value="">State</option>
                        {US_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {field('state')}
                    </label>
                    <label className={styles.field}>
                      <span className={styles.srOnly}>ZIP</span>
                      <input className={styles.input} placeholder="ZIP" inputMode="numeric" autoComplete="postal-code" maxLength={10} value={form.postalCode} onChange={set('postalCode')} />
                      {field('postalCode')}
                    </label>
                  </div>
                )}
                <label className={`${styles.field} ${styles.full}`}>
                  <span className={styles.srOnly}>Note for the store (optional)</span>
                  <textarea className={styles.input} rows={2} placeholder="Note for the store (optional)" maxLength={500} value={form.note} onChange={set('note')} />
                </label>
              </div>

              <div className={styles.block}>
                <h2 className={styles.section}>Payment</h2>
                {nothingToPay ? (
                  <div className={styles.covered}>✓ Everything in your order is covered by {team?.team || 'your team'}. No payment needed.</div>
                ) : online ? (
                  <p className={styles.payNote}>You’ll pay on Stripe’s secure page: card, Apple Pay or Google Pay. Payments go to Compete Like Pros, who pays the stores.</p>
                ) : (
                  <p className={styles.payNote}>Online payment opens soon. Nothing is charged now. Compete Like Pros e-mails you to arrange payment, then your order ships.</p>
                )}
              </div>

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className={styles.pay} disabled={sending}>
                {payLabel}
              </button>
              <span className={styles.secure}>Secure checkout by CLP · Items from different stores may ship separately</span>
            </div>

            <aside className={styles.summary}>
              <strong className={styles.summaryTitle}>Order summary</strong>
              {cart.lines.map((l) => {
                const covered = l.coveredQty ?? 0;
                const all = covered === l.qty && covered > 0;
                return (
                  <div key={l.key} className={styles.line}>
                    <span className={styles.thumb}>
                      {l.image && <img src={l.image} alt="" />}
                      <span className={styles.qtyBadge}>{l.qty}</span>
                    </span>
                    <span className={styles.lineText}>
                      <strong>{l.title}</strong>
                      <span>{[cart.stores?.find((st) => st.slug === l.slug)?.name, l.option].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className={styles.linePrice}>
                      <strong className={all ? styles.strike : undefined}>{money(all ? l.price * l.qty : (l.lineCharge ?? (l.unitCharge ?? l.price) * (l.qty - covered)))}</strong>
                      {covered > 0 && <span className={styles.coveredTag}>Covered</span>}
                    </span>
                  </div>
                );
              })}
              <div className={styles.codes}>
                <span className={styles.small}>Discount or team code</span>
                <div className={styles.codeRow}>
                  <input
                    className={`${styles.input} ${styles.codeInput}`}
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value);
                      setCodeError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCode();
                      }
                    }}
                    aria-label="Discount or team code"
                    placeholder="Enter code"
                  />
                  <button type="button" className={styles.apply} onClick={applyCode}>
                    Apply
                  </button>
                </div>
                {codeError && <span className={styles.fieldError}>{codeError}</span>}
                {(cart.codes?.length ?? 0) > 0 && (
                  <div className={styles.chips}>
                    {cart.codes!.map((c) => (
                      <span key={c.code} className={styles.codeChip}>
                        {c.label}
                        <button type="button" aria-label={`Remove ${c.code}`} onClick={() => removeCode(c.code)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {totals && (
                <div className={styles.totals}>
                  <span>
                    <span>Subtotal</span>
                    <span>{money(totals.subtotal)}</span>
                  </span>
                  {totals.covered > 0 && (
                    <span className={styles.gold}>
                      <span>Covered by {team?.team || 'team'}</span>
                      <span>−{money(totals.covered)}</span>
                    </span>
                  )}
                  {totals.discount > 0 && (
                    <span className={styles.green}>
                      <span>Discount</span>
                      <span>−{money(totals.discount)}</span>
                    </span>
                  )}
                  <span>
                    <span>{ship ? 'Shipping' : 'Pick-up'}</span>
                    <span>{totals.shipping ? money(totals.shipping) : 'Free'}</span>
                  </span>
                  {totals.tax > 0 && (
                    <span>
                      <span>Est. tax</span>
                      <span>{money(totals.tax)}</span>
                    </span>
                  )}
                  <span className={styles.total}>
                    <strong>Total</strong>
                    <strong>{money(totals.total)}</strong>
                  </span>
                </div>
              )}
              <StoresSupport slugs={(cart.stores ?? []).map((st) => st.slug)} />
            </aside>
          </form>
        )}
      </div>
    </>
  );
}
