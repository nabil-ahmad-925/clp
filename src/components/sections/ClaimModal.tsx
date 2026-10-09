'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { DirectoryItem } from '@/content/types';
import styles from './ClaimModal.module.css';

type Props = {
  item: DirectoryItem;
  onClose: () => void;
};

const ROLES = ['Owner', 'Director or manager', 'Coach or instructor', 'Staff member', 'Other'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * "Claim this listing" (Community listings; the new design's form popup): who the person is, their organization and
 * role, and how CLP can verify they run the program. UI only for now: the form is checked and shows its confirmation,
 * but nothing is sent yet. Esc, the close button or a click outside closes it.
 */
export default function ClaimModal({ item, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', organization: item.subtitle ?? '', role: ROLES[0], phone: '', proof: '', message: '' });
  const [authorized, setAuthorized] = useState(false);
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once: the parent's re-renders don't move the focus).
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
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
    authorized: !authorized ? 'Confirm you’re authorized to manage this listing.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) setSent(true);
  };

  const error = (key: keyof typeof errors) =>
    tried && errors[key] ? (
      <span className={styles.fieldError} role="alert">
        {errors[key]}
      </span>
    ) : null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Claim ${item.title}`} tabIndex={-1}>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
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
                  CLP checks that you run <strong>{item.title}</strong>, then emails <strong>{form.email.trim()}</strong> to hand the listing over. You&rsquo;ll
                  be able to edit its details and photos, and take bookings on CLP once you&rsquo;re a partner.
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
                  <label className={styles.field}>
                    Your role
                    <select className={styles.input} value={form.role} onChange={set('role')}>
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    Phone (optional)
                    <input className={styles.input} type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={set('phone')} />
                  </label>
                  <label className={styles.field}>
                    Website or social page
                    <input className={styles.input} type="url" inputMode="url" placeholder="https://" maxLength={300} value={form.proof} onChange={set('proof')} />
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
              <button type="submit" className={styles.primary}>
                Submit claim
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
