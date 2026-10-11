'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import FieldSelect from '@/components/ui/FieldSelect';
import claimOptions from '@/content/data/claimOptions.json';
import { requestClaim, type ClaimConfirmation } from '@/content/listings';
import type { DirectoryItem } from '@/content/types';
import styles from './ClaimModal.module.css';

type Props = {
  item: DirectoryItem;
  /** The listing's directory (with the item's id, the claimed listing). */
  widgetId: number;
  onClose: () => void;
};

/** The roles a claimant picks from (one list with the claims API). */
const ROLES = claimOptions.roles.map((r) => ({ value: r, label: r }));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+().\-\s]{5,40}$/;

/**
 * "Claim this listing" (Community listings; the new design's form popup): who the person is, their organization and
 * role, and how CLP can verify they run the program. Sent to the claims API, which keeps the claim and e-mails the
 * listing's owner and CLP; the confirmation shows its reference. Esc, the close button or a click outside closes it
 * (not while it is sending).
 */
export default function ClaimModal({ item, widgetId, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', organization: item.subtitle ?? '', role: '', phone: '', website: '', message: '' });
  const [authorized, setAuthorized] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [sent, setSent] = useState<ClaimConfirmation | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once: the parent's re-renders don't move the focus).
  // While the claim is being sent it stays open.
  const closeRef = useRef(onClose);
  const sendingRef = useRef(false);
  useEffect(() => {
    closeRef.current = () => !sendingRef.current && onClose();
    sendingRef.current = sending;
  });
  useEffect(() => {
    document.body.classList.add('menu-open');
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const errors = {
    name: !form.name.trim() ? 'Enter your name.' : '',
    email: !EMAIL.test(form.email.trim()) ? 'Enter a valid work email.' : '',
    organization: !form.organization.trim() ? 'Enter the organization or program.' : '',
    role: !form.role ? 'Choose your role.' : '',
    phone: form.phone.trim() && !PHONE.test(form.phone.trim()) ? 'Enter the phone number with digits only.' : '',
    authorized: !authorized ? 'Confirm you’re authorized to manage this listing.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || sending) return;
    setSending(true);
    setFailure('');
    try {
      setSent(
        await requestClaim({
          widgetId,
          listingId: item.id,
          name: form.name.trim(),
          email: form.email.trim(),
          organization: form.organization.trim(),
          role: form.role,
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          message: form.message.trim() || undefined,
          authorized,
        }),
      );
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Could not send your claim. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const error = (key: keyof typeof errors) =>
    tried && errors[key] ? (
      <span className={styles.fieldError} role="alert">
        {errors[key]}
      </span>
    ) : null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Claim ${item.title}`} tabIndex={-1}>
        <button type="button" className={styles.close} aria-label="Close" disabled={sending} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {sent ? (
          <div className={styles.layout}>
            <div className={styles.body}>
              <div className={styles.stack}>
                <span className={styles.doneKicker}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  CLAIM SUBMITTED
                </span>
                <span className={styles.title}>We&rsquo;ll verify your claim</span>
                <span className={styles.text}>
                  CLP checks that you run <strong>{sent.listingTitle}</strong>, then emails <strong>{sent.email}</strong> to hand the listing over. You&rsquo;ll be
                  able to edit its details and photos, and take bookings on CLP once you&rsquo;re a partner.
                </span>
                <span className={styles.reference}>
                  Claim reference <strong>{sent.id.replace(/^cl-/, '').slice(0, 8).toUpperCase()}</strong>
                </span>
              </div>
            </div>
            <div className={styles.footer}>
              <button type="button" className={styles.primary} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.layout} onSubmit={submit} noValidate>
            <div className={styles.body}>
              <div className={styles.stack}>
                <span className={styles.kicker}>CLAIM THIS LISTING</span>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.text}>
                  This listing was added from public info. Claim it to keep its details accurate, add photos and link to your own registration.
                </span>

                <div className={styles.fields}>
                  <label className={styles.field}>
                    Full name
                    <input className={styles.input} autoComplete="name" maxLength={120} value={form.name} onChange={set('name')} aria-invalid={tried && Boolean(errors.name)} />
                    {error('name')}
                  </label>
                  <label className={styles.field}>
                    Work email
                    <input
                      className={styles.input}
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      value={form.email}
                      onChange={set('email')}
                      aria-invalid={tried && Boolean(errors.email)}
                    />
                    {error('email')}
                  </label>
                  <label className={styles.field}>
                    Organization or program
                    <input
                      className={styles.input}
                      autoComplete="organization"
                      maxLength={200}
                      value={form.organization}
                      onChange={set('organization')}
                      aria-invalid={tried && Boolean(errors.organization)}
                    />
                    {error('organization')}
                  </label>
                  <div className={styles.field}>
                    <span>Your role</span>
                    <FieldSelect
                      label="Your role"
                      className={styles.input}
                      value={form.role}
                      options={ROLES}
                      invalid={tried && Boolean(errors.role)}
                      onChange={(role) => setForm({ ...form, role })}
                    />
                    {error('role')}
                  </div>
                  <label className={styles.field}>
                    Phone (optional)
                    <input
                      className={styles.input}
                      type="tel"
                      autoComplete="tel"
                      maxLength={40}
                      value={form.phone}
                      onChange={set('phone')}
                      aria-invalid={tried && Boolean(errors.phone)}
                    />
                    {error('phone')}
                  </label>
                  <label className={styles.field}>
                    Website or social page (optional)
                    <input className={styles.input} type="url" inputMode="url" placeholder="https://" maxLength={300} value={form.website} onChange={set('website')} />
                  </label>
                  <label className={`${styles.field} ${styles.wide}`}>
                    How can we verify you run this program? (optional)
                    <textarea className={styles.input} rows={3} maxLength={1000} value={form.message} onChange={set('message')} />
                  </label>
                </div>

                <label className={styles.check}>
                  <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} />
                  <span className={styles.box} aria-hidden />
                  <span>I&rsquo;m authorized to manage this listing on behalf of the organization.</span>
                </label>
                {error('authorized')}
              </div>
            </div>
            {/* Always in view under the form. */}
            <div className={styles.footer}>
              {failure && (
                <span className={styles.fieldError} role="alert">
                  {failure}
                </span>
              )}
              <button type="submit" className={styles.primary} disabled={sending}>
                {sending ? 'Submitting…' : 'Submit claim'}
              </button>
              <span className={styles.hint}>CLP reviews every claim before handing a listing over, usually within 2 business days.</span>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
