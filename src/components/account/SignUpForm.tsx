'use client';

import { useState, type FormEvent } from 'react';
import { PartnerApiError } from '@/content/partnerPages';
import { confirmEmail, memberSignUp, partnerSignIn, resendConfirmation, type PartnerUser } from '@/content/partnerSession';
import { PasswordField, useCooldown } from './authParts';
import auth from './authLook.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** The API's rule for a new password (clp-api parseNewPassword). */
const STRONG = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);
const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';

/**
 * Sign up on the CLP site (the Sign In page's Sign Up): a CLP member account, in the admin's sign-in look (authLook), two fields to a row. Name, email and a
 * password; Cognito e-mails a 6-digit code, and once it's entered they are signed in. Partners don't sign up here:
 * `onPartner` opens the partner application instead, and `onSignIn` the sign-in for an address that has an account.
 */
export default function SignUpForm({ onSignedIn, onPartner, onSignIn }: { onSignedIn: (user: PartnerUser) => void; onPartner: () => void; onSignIn: () => void }) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [form, setForm] = useState({ name: '', email: '', password: '', again: '' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exists, setExists] = useState(false);
  const [notice, setNotice] = useState('');
  const [wait, startWait] = useCooldown();
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const address = form.email.trim().toLowerCase();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExists(false);
    if (step === 'form') {
      if (!form.name.trim()) return setError('Enter your name.');
      if (!EMAIL.test(address)) return setError('Enter a valid email address.');
      if (!STRONG(form.password)) return setError(PASSWORD_HINT);
      if (form.password !== form.again) return setError('The two passwords don’t match.');
    } else if (!/^\d{6}$/.test(code.replace(/\s+/g, ''))) return setError('Enter the 6-digit code from the email.');
    setBusy(true);
    try {
      if (step === 'form') {
        await memberSignUp(form.name.trim(), address, form.password);
        setStep('confirm');
        startWait();
        setNotice(`We sent a 6-digit code to ${address}. Check your spam folder too.`);
        setBusy(false);
        return;
      }
      await confirmEmail(address, code.replace(/\s+/g, ''));
      const r = await partnerSignIn(address, form.password);
      // A brand-new member never has a temporary password; this is only a safeguard.
      if ('challenge' in r) throw new Error('Sign in to finish setting up your account.');
      onSignedIn(r.user);
    } catch (err) {
      if (err instanceof PartnerApiError && err.code === 'EMAIL_EXISTS') setExists(true);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await resendConfirmation(address);
      startWait();
      setNotice(`We sent a new code to ${address}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code. Please try again.');
    }
  };

  return (
    <form className={auth.layout} onSubmit={submit} noValidate>
      <div className={auth.stack}>
        <span className={auth.title}>{step === 'form' ? 'Create Your CLP Account' : 'Confirm Your Email'}</span>
        <span className={auth.text}>
          {step === 'form'
            ? 'Book sessions, follow partners, request team gear and keep everything in one place.'
            : 'Enter the 6-digit code we emailed you. It’s valid for 24 hours.'}
        </span>
        {notice && (
          <span className={auth.notice} role="status">
            {notice}
          </span>
        )}
        {step === 'form' ? (
          <div className={`${auth.fields} ${auth.two}`}>
            <label className={auth.field}>
              Full name
              <input className={auth.input} autoComplete="name" maxLength={100} value={form.name} onChange={set('name')} />
            </label>
            <label className={auth.field}>
              Email
              <input className={auth.input} type="email" autoComplete="email" maxLength={254} value={form.email} onChange={set('email')} />
            </label>
            <PasswordField look={auth} label="Password" autoComplete="new-password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            <PasswordField look={auth} label="Confirm password" autoComplete="new-password" value={form.again} onChange={(v) => setForm({ ...form, again: v })} />
            <span className={`${auth.hint} ${auth.wide}`}>{PASSWORD_HINT}</span>
          </div>
        ) : (
          <div className={auth.fields}>
            <label className={auth.field}>
              Code from the email
              <input
                className={`${auth.input} ${auth.code}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button type="button" className={auth.link} onClick={resend} disabled={wait > 0}>
              {wait > 0 ? `Send a New Code in ${wait}s` : 'Send a New Code'}
            </button>
            <button type="button" className={auth.link} onClick={() => (setStep('form'), setNotice(''), setError(''))}>
              Use a Different Email
            </button>
          </div>
        )}
      </div>
      <div className={auth.footer}>
        {error && (
          <span className={auth.fieldError} role="alert">
            {error}
            {exists && (
              <>
                {' '}
                <button type="button" className={auth.link} onClick={onSignIn}>
                  Sign In
                </button>
              </>
            )}
          </span>
        )}
        <button type="submit" className={auth.primary} disabled={busy}>
          {busy ? 'Please Wait…' : step === 'form' ? 'Create Account' : 'Confirm and Sign In'}
        </button>
        {step === 'form' && (
          <div className={auth.note}>
            <strong>Running a club, team, school or business?</strong>
            <span>Partner accounts get a partner page, bookings, a store and wholesale pricing. CLP reviews every application.</span>
            <button type="button" className={auth.link} onClick={onPartner}>
              Apply to Become a CLP Partner →
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
