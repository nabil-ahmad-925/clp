'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import claim from '@/components/sections/ClaimModal.module.css';
import FieldSelect from '@/components/ui/FieldSelect';
import { PARTNER_SPORTS, PARTNER_TYPES, confirmPartnerSignup, partnerSignInHref, resendPartnerCode, signUpPartner } from '@/content/partnerPages';
import own from './partnerSignupModal.module.css';

type Props = {
  /** The partner type chosen at the start (the person can change it). */
  type?: string;
  onClose: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_HINT = 'At least 8 characters, with an uppercase letter, a lowercase letter and a number.';
const weakPassword = (p: string) => p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p);
const TYPE_OPTIONS = PARTNER_TYPES.map((t) => ({ value: t.id, label: t.label }));
const EMPTY = { name: '', email: '', password: '', repeat: '', organization: '', area: '', website: '' };

/**
 * "Become a Partner" (the form popup of the other program forms, see ProgramModal): the partner sign-up the admin has,
 * without leaving the site. Their details and application (POST /auth/signup), then the 6-digit code e-mailed to them
 * (POST /auth/confirm). Once confirmed, CLP reviews the application; approved partners sign in to the admin to build
 * their page. Esc, the close button or a click outside closes it (not while it is sending).
 */
export default function PartnerSignupModal({ type = '', onClose }: Props) {
  const [step, setStep] = useState<'details' | 'code' | 'done'>('details');
  const [form, setForm] = useState(EMPTY);
  const [partnerType, setPartnerType] = useState(PARTNER_TYPES.some((t) => t.id === type) ? type : '');
  const [sports, setSports] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [note, setNote] = useState('');
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once). While something is being sent it stays open.
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
    password: weakPassword(form.password) ? PASSWORD_HINT : '',
    repeat: form.password !== form.repeat ? 'The passwords do not match.' : '',
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
  const input = (key: keyof typeof errors & keyof typeof EMPTY, label: string, extra: { max: number; type?: string; autoComplete?: string; wide?: boolean }) => (
    <label className={`${claim.field} ${extra.wide ? claim.wide : ''}`}>
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

  /** Runs a request with the sending state and the failure shown. */
  const run = async (task: () => Promise<void>) => {
    setSending(true);
    setFailure('');
    setNote('');
    try {
      await task();
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || sending) return;
    const email = form.email.trim().toLowerCase();
    void run(async () => {
      await signUpPartner({ email, name: form.name.trim(), password: form.password, partnerType, organization: form.organization.trim(), area: form.area.trim(), sports, website: form.website.trim() });
      setForm({ ...form, email });
      setStep('code');
    });
  };
  const confirm = (e: FormEvent) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return setFailure('Enter the 6-digit code from the email.');
    if (sending) return;
    void run(async () => {
      await confirmPartnerSignup(form.email, digits);
      setStep('done');
    });
  };
  const resend = () =>
    void run(async () => {
      await resendPartnerCode(form.email);
      setNote('A new code is on its way.');
    });

  const closeButton = (
    <button type="button" className={claim.close} aria-label="Close" disabled={sending} onClick={onClose}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );

  return createPortal(
    <div className={claim.overlay} onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <div ref={dialog} className={claim.dialog} role="dialog" aria-modal="true" aria-label="Become a Partner" tabIndex={-1}>
        {closeButton}

        {step === 'done' ? (
          <div className={claim.layout}>
            <div className={claim.body}>
              <div className={claim.stack}>
                <span className={claim.doneKicker}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  APPLICATION SUBMITTED
                </span>
                <span className={claim.title}>Thanks for Applying</span>
                <span className={claim.text}>
                  Your email is confirmed and your application is with CLP. Once it’s approved you can sign in with <strong>{form.email}</strong> to build your partner page.
                </span>
              </div>
            </div>
            <div className={claim.footer}>
              <button type="button" className={claim.primary} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : step === 'code' ? (
          <form className={claim.layout} onSubmit={confirm} noValidate>
            <div className={claim.body}>
              <div className={claim.stack}>
                <span className={claim.kicker}>CONFIRM YOUR EMAIL</span>
                <span className={claim.title}>Enter the Code</span>
                <span className={claim.text}>
                  We sent a 6-digit code to <strong>{form.email}</strong>. Enter it to confirm your email and send your application.
                </span>
                <label className={claim.field}>
                  6-digit code
                  <input
                    className={`${claim.input} ${own.code}`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={7}
                    placeholder="000000"
                    value={code}
                    autoFocus
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
                <span className={own.links}>
                  <button type="button" className={own.link} disabled={sending} onClick={resend}>
                    Send a new code
                  </button>
                  <button type="button" className={own.link} disabled={sending} onClick={() => setStep('details')}>
                    Wrong email? Go back
                  </button>
                </span>
                {note && <span className={own.note}>{note}</span>}
              </div>
            </div>
            <div className={claim.footer}>
              {failure && (
                <span className={claim.fieldError} role="alert">
                  {failure}
                </span>
              )}
              <button type="submit" className={claim.primary} disabled={sending}>
                {sending ? 'Confirming…' : 'Confirm & Apply'}
              </button>
            </div>
          </form>
        ) : (
          <form className={claim.layout} onSubmit={submit} noValidate>
            <div className={claim.body}>
              <div className={claim.stack}>
                <span className={claim.kicker}>CLP PARTNER</span>
                <span className={claim.title}>Become a Partner</span>
                <span className={claim.text}>
                  Your own page on CLP with bookings, a store, partnerships and verified reviews. Create your account; CLP reviews every application before it can sign in.
                </span>

                <div className={claim.fields}>
                  {input('name', 'Full name', { max: 100, autoComplete: 'name' })}
                  {input('email', 'Email', { max: 254, type: 'email', autoComplete: 'email' })}
                  {input('password', 'Password', { max: 256, type: 'password', autoComplete: 'new-password' })}
                  {input('repeat', 'Confirm password', { max: 256, type: 'password', autoComplete: 'new-password' })}
                  <div className={claim.field}>
                    <span>I’m applying as</span>
                    <FieldSelect label="I’m applying as" className={claim.input} value={partnerType} options={TYPE_OPTIONS} invalid={tried && Boolean(errors.partnerType)} onChange={setPartnerType} />
                    {error('partnerType')}
                  </div>
                  {input('organization', 'Organization or name', { max: 100, autoComplete: 'organization' })}
                  {input('area', 'City or area', { max: 80, autoComplete: 'address-level2' })}
                  <label className={claim.field}>
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
                </div>
              </div>
            </div>
            {/* Always in view under the form. */}
            <div className={claim.footer}>
              {failure && (
                <span className={claim.fieldError} role="alert">
                  {failure}
                  {failure.includes('already exists') && (
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
                {sending ? 'Creating account…' : 'Create Account & Apply'}
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
