'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import claim from '@/components/sections/ClaimModal.module.css';
import FieldSelect from '@/components/ui/FieldSelect';
import { PARTNER_SPORTS, PARTNER_TYPES, PartnerApiError, applyAsPartner, partnerSignInHref } from '@/content/partnerPages';
import own from './partnerSignupModal.module.css';

type Props = {
  /** The partner type chosen at the start (the person can change it). */
  type?: string;
  onClose: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+().\-\s]{5,40}$/;
const TYPE_OPTIONS = PARTNER_TYPES.map((t) => ({ value: t.id, label: t.label }));
const EMPTY = { name: '', email: '', phone: '', organization: '', area: '', website: '', message: '' };

/**
 * "Become a Partner" (the form popup of the other program forms, see ProgramModal): the application to become a CLP
 * Partner, without leaving the site. No password here: CLP reviews the application, and once it's approved the partner
 * gets an e-mail with a temporary password and the sign-in link, where they choose their own password. Esc, the close
 * button or a click outside closes it (not while it is sending).
 */
export default function PartnerSignupModal({ type = '', onClose }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [partnerType, setPartnerType] = useState(PARTNER_TYPES.some((t) => t.id === type) ? type : '');
  const [sports, setSports] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [exists, setExists] = useState(false);
  const [sent, setSent] = useState<{ email: string; repeat: boolean } | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once). While it is sending it stays open.
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

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const errors = {
    name: !form.name.trim() ? 'Enter your name.' : '',
    email: !EMAIL.test(form.email.trim()) ? 'Enter a valid email address.' : '',
    phone: form.phone.trim() && !PHONE.test(form.phone.trim()) ? 'Enter the phone number with digits only.' : '',
    partnerType: !partnerType ? 'Choose what kind of partner you are.' : '',
    organization: !form.organization.trim() ? 'Enter your organization, or your name if you work on your own.' : '',
    area: !form.area.trim() ? 'Enter your city or area.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const error = (key: keyof typeof errors) =>
    tried && errors[key] ? (
      <span className={claim.fieldError} role="alert">
        {errors[key]}
      </span>
    ) : null;
  const input = (key: keyof typeof errors & keyof typeof EMPTY, label: string, extra: { max: number; type?: string; autoComplete?: string }) => (
    <label className={claim.field}>
      {label}
      <input
        className={claim.input}
        type={extra.type}
        autoComplete={extra.autoComplete ?? 'off'}
        maxLength={extra.max}
        value={form[key]}
        onChange={set(key)}
        aria-invalid={tried && Boolean(errors[key])}
      />
      {error(key)}
    </label>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || sending) return;
    const email = form.email.trim().toLowerCase();
    setSending(true);
    setFailure('');
    setExists(false);
    try {
      const result = await applyAsPartner({
        name: form.name.trim(),
        email,
        phone: form.phone.trim() || undefined,
        partnerType,
        organization: form.organization.trim(),
        area: form.area.trim(),
        sports,
        website: form.website.trim() || undefined,
        message: form.message.trim() || undefined,
      });
      setSent({ email, repeat: Boolean(result.repeat) });
    } catch (err) {
      if (err instanceof PartnerApiError && err.status === 409) setExists(true);
      setFailure(err instanceof Error ? err.message : 'Could not send your application. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className={claim.overlay} onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <div ref={dialog} className={claim.dialog} role="dialog" aria-modal="true" aria-label="Become a Partner" tabIndex={-1}>
        <button type="button" className={claim.close} aria-label="Close" disabled={sending} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {sent ? (
          <div className={claim.layout}>
            <div className={claim.body}>
              <div className={claim.stack}>
                <span className={claim.doneKicker}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {sent.repeat ? 'ALREADY RECEIVED' : 'APPLICATION SUBMITTED'}
                </span>
                <span className={claim.title}>{sent.repeat ? 'Your Application Is With Us' : 'Thanks for Applying'}</span>
                <span className={claim.text}>
                  {sent.repeat ? 'We already have an application from this address, and CLP is reviewing it. ' : 'CLP reviews every application, usually within 5 business days. '}
                  Once it’s approved, we’ll email <strong>{sent.email}</strong> a temporary password and a link to sign in, where you choose your own password and
                  start building your partner page.
                </span>
              </div>
            </div>
            <div className={claim.footer}>
              <button type="button" className={claim.primary} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className={claim.layout} onSubmit={submit} noValidate>
            <div className={claim.body}>
              <div className={claim.stack}>
                <span className={claim.kicker}>CLP PARTNER</span>
                <span className={claim.title}>Become a Partner</span>
                <span className={claim.text}>
                  Your own page on CLP with bookings, a store, partnerships and verified reviews. Tell us about you; once CLP approves your application, you’ll get an
                  email with a temporary password to sign in.
                </span>

                <div className={claim.fields}>
                  {input('name', 'Full name', { max: 100, autoComplete: 'name' })}
                  {input('email', 'Email', { max: 254, type: 'email', autoComplete: 'email' })}
                  {input('phone', 'Phone (optional)', { max: 40, type: 'tel', autoComplete: 'tel' })}
                  <div className={claim.field}>
                    <span>I’m applying as</span>
                    <FieldSelect label="I’m applying as" className={claim.input} value={partnerType} options={TYPE_OPTIONS} invalid={tried && Boolean(errors.partnerType)} onChange={setPartnerType} />
                    {error('partnerType')}
                  </div>
                  {input('organization', 'Organization or name', { max: 100, autoComplete: 'organization' })}
                  {input('area', 'City or area', { max: 80, autoComplete: 'address-level2' })}
                  <label className={`${claim.field} ${claim.wide}`}>
                    Website (optional)
                    <input className={claim.input} type="url" inputMode="url" placeholder="https://" maxLength={300} value={form.website} onChange={set('website')} />
                  </label>
                  <div className={`${claim.field} ${claim.wide}`}>
                    <span>Sports (optional)</span>
                    <span className={own.chips}>
                      {PARTNER_SPORTS.map((s) => {
                        const on = sports.includes(s.id);
                        return (
                          <button key={s.id} type="button" aria-pressed={on} className={`${own.chip} ${on ? own.chipOn : ''}`} onClick={() => setSports(on ? sports.filter((x) => x !== s.id) : [...sports, s.id])}>
                            {s.label}
                          </button>
                        );
                      })}
                    </span>
                  </div>
                  <label className={`${claim.field} ${claim.wide}`}>
                    Tell us about your program (optional)
                    <textarea className={claim.input} rows={3} maxLength={1000} value={form.message} onChange={set('message')} />
                  </label>
                </div>
              </div>
            </div>
            {/* Always in view under the form. */}
            <div className={claim.footer}>
              {failure && (
                <span className={claim.fieldError} role="alert">
                  {failure}
                  {exists && (
                    <>
                      {' '}
                      <a href={partnerSignInHref} className={own.link} target="_blank" rel="noopener">
                        Sign in
                      </a>
                    </>
                  )}
                </span>
              )}
              <button type="submit" className={claim.primary} disabled={sending}>
                {sending ? 'Sending…' : 'Send Application'}
              </button>
              <span className={claim.hint}>
                CLP reviews every application, usually within 5 business days. Already a partner?{' '}
                <a href={partnerSignInHref} className={own.link} target="_blank" rel="noopener">
                  Sign in
                </a>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
