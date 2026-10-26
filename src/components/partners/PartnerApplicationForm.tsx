'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import claim from '@/components/sections/ClaimModal.module.css';
import FieldSelect from '@/components/ui/FieldSelect';
import { PARTNER_SPORTS, PARTNER_TYPES, PartnerApiError, applyAsPartner } from '@/content/partnerPages';
import auth from '@/components/account/authLook.module.css';
import own from './partnerSignupModal.module.css';

type Props = {
  /** The partner type chosen at the start (the person can change it). */
  type?: string;
  /** While it sends (a popup stays open meanwhile). */
  onSending?: (sending: boolean) => void;
  /** The confirmation's button. */
  doneLabel: string;
  onDone: () => void;
  /** "Sign in" when the address already has an account (the Sign In page by default). */
  onSignIn?: () => void;
  /** A signed-in member applying: their name and email to start with. */
  initial?: { name: string; email: string };
  /** "page": the Sign In page's look (the admin's sign-in card, authLook.module.css), else the form popup's. */
  look?: 'page' | 'popup';
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+().\-\s]{5,40}$/;
const TYPE_OPTIONS = PARTNER_TYPES.map((t) => ({ value: t.id, label: t.label }));
const EMPTY = { name: '', email: '', phone: '', organization: '', area: '', website: '', message: '' };

/**
 * The application to become a CLP Partner (the "Become a Partner" popup and the Sign In page's Sign Up), in the form
 * popup's look (ClaimModal.module.css). No password here: CLP reviews the application, and once it's approved the
 * partner gets an e-mail with a temporary password and the sign-in link, where they choose their own password.
 */
export default function PartnerApplicationForm({ type = '', onSending, doneLabel, onDone, onSignIn, initial, look = 'popup' }: Props) {
  const s = look === 'page' ? auth : claim;
  const o = look === 'page' ? auth : own;
  const [form, setForm] = useState({ ...EMPTY, ...(initial ? { name: initial.name, email: initial.email } : {}) });
  const [partnerType, setPartnerType] = useState(PARTNER_TYPES.some((t) => t.id === type) ? type : '');
  const [sports, setSports] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [exists, setExists] = useState(false);
  const [sent, setSent] = useState<{ email: string; repeat: boolean } | null>(null);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const errors = {
    name: !form.name.trim() ? 'Enter your name.' : '',
    email: !EMAIL.test(form.email.trim()) ? 'Enter a valid email address.' : '',
    phone: form.phone.trim() && !PHONE.test(form.phone.trim()) ? 'Enter the phone number with digits only.' : '',
    partnerType: !partnerType ? 'Choose what kind of partner you are.' : '',
    organization: !form.organization.trim() ? 'Enter your organization, or your name if you work on your o.' : '',
    area: !form.area.trim() ? 'Enter your city or area.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const error = (key: keyof typeof errors) =>
    tried && errors[key] ? (
      <span className={s.fieldError} role="alert">
        {errors[key]}
      </span>
    ) : null;
  const input = (key: keyof typeof errors & keyof typeof EMPTY, label: string, extra: { max: number; type?: string; autoComplete?: string }) => (
    <label className={s.field}>
      {label}
      <input
        className={s.input}
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
    onSending?.(true);
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
      onSending?.(false);
    }
  };

  return sent ? (
    <div className={s.layout}>
      <div className={s.body}>
        <div className={s.stack}>
          <span className={s.doneKicker}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {sent.repeat ? 'ALREADY RECEIVED' : 'APPLICATION SUBMITTED'}
          </span>
          <span className={s.title}>{sent.repeat ? 'Your Application Is With Us' : 'Thanks for Applying'}</span>
          <span className={s.text}>
            {sent.repeat ? 'We already have an application from this address, and CLP is reviewing it. ' : 'CLP reviews every application, usually within 5 business days. '}
            {initial && sent.email === initial.email.trim().toLowerCase() ? (
              <>
                Once it’s approved, your CLP account becomes a partner account: sign in to the CLP admin with the same email and password and start building your
                partner page. We’ll email <strong>{sent.email}</strong> when it’s ready.
              </>
            ) : (
              <>
                Once it’s approved, we’ll email <strong>{sent.email}</strong> a temporary password and a link to sign in, where you choose your own password and
                start building your partner page.
              </>
            )}
          </span>
        </div>
      </div>
      <div className={s.footer}>
        <button type="button" className={s.primary} onClick={onDone}>
          {doneLabel}
        </button>
      </div>
    </div>
  ) : (
    <form className={s.layout} onSubmit={submit} noValidate>
      <div className={s.body}>
        <div className={s.stack}>
          <span className={s.kicker}>CLP PARTNER</span>
          <span className={s.title}>Become a Partner</span>
          <span className={s.text}>
            Your own page on CLP with bookings, a store, partnerships and verified reviews. Tell us about you, once CLP approves your application, you’ll get an
            email with a temporary password to sign in.
          </span>

          <div className={`${s.fields} ${look === 'page' ? auth.two : ''}`}>
            {input('name', 'Full name', { max: 100, autoComplete: 'name' })}
            {input('email', 'Email', { max: 254, type: 'email', autoComplete: 'email' })}
            {input('phone', 'Phone (optional)', { max: 40, type: 'tel', autoComplete: 'tel' })}
            <div className={s.field}>
              <span>I’m applying as</span>
              <FieldSelect label="I’m applying as" className={s.input} value={partnerType} options={TYPE_OPTIONS} invalid={tried && Boolean(errors.partnerType)} onChange={setPartnerType} />
              {error('partnerType')}
            </div>
            {input('organization', 'Organization or name', { max: 100, autoComplete: 'organization' })}
            {input('area', 'City or area', { max: 80, autoComplete: 'address-level2' })}
            <label className={`${s.field} ${s.wide}`}>
              Website (optional)
              <input className={s.input} type="url" inputMode="url" placeholder="https://" maxLength={300} value={form.website} onChange={set('website')} />
            </label>
            <div className={`${s.field} ${s.wide}`}>
              <span>Sports (optional)</span>
              <span className={o.chips}>
                {PARTNER_SPORTS.map((sport) => {
                  const on = sports.includes(sport.id);
                  return (
                    <button key={sport.id} type="button" aria-pressed={on} className={`${o.chip} ${on ? o.chipOn : ''}`} onClick={() => setSports(on ? sports.filter((x) => x !== sport.id) : [...sports, sport.id])}>
                      {sport.label}
                    </button>
                  );
                })}
              </span>
            </div>
            <label className={`${s.field} ${s.wide}`}>
              Tell us about your program (optional)
              <textarea className={s.input} rows={3} maxLength={1000} value={form.message} onChange={set('message')} />
            </label>
          </div>
        </div>
      </div>
      {/* Always in view under the form. */}
      <div className={s.footer}>
        {failure && (
          <span className={s.fieldError} role="alert">
            {failure}
            {exists && (
              <>
                {' '}
                {onSignIn ? (
                  <button type="button" className={o.link} onClick={onSignIn}>
                    Sign in
                  </button>
                ) : (
                  <Link href="/sign-in/" className={o.link}>
                    Sign in
                  </Link>
                )}
              </>
            )}
          </span>
        )}
        <button type="submit" className={s.primary} disabled={sending}>
          {sending ? 'Sending…' : 'Send Application'}
        </button>
      </div>
    </form>
  );
}
