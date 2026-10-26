'use client';

import { useState, type FormEvent } from 'react';
import { PartnerApiError } from '@/content/partnerPages';
import { confirmEmail, memberSignUp, partnerSignIn, resendConfirmation, type PartnerUser } from '@/content/partnerSession';
import CodeStep, { useCodeStep } from './CodeStep';
import { PasswordField, useCooldown } from './authParts';
import auth from './authLook.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** The API's rule for a new password (clp-api parseNewPassword). */
const STRONG = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);
const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';

type Props = {
  onSignedIn: (user: PartnerUser) => void;
  onPartner: () => void;
  onSignIn: () => void;
  /** While the code step shows (the page shows only the form then). */
  onCodeStep?: (on: boolean) => void;
};

/**
 * Sign up on the CLP site (the Sign In page's Sign Up): a CLP member account, in the admin's sign-in look, two fields to
 * a row. Name, email and a password, then only the 6-digit code Cognito e-mails. Once it's entered they are signed in.
 * Partners don't sign up here: `onPartner` opens the partner application, `onSignIn` the sign-in for a known address.
 */
export default function SignUpForm({ onSignedIn, onPartner, onSignIn, onCodeStep }: Props) {
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [form, setForm] = useState({ name: '', email: '', password: '', again: '' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exists, setExists] = useState(false);
  const [notice, setNotice] = useState('');
  const [wait, startWait] = useCooldown();
  useCodeStep(step === 'code', onCodeStep);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const address = form.email.trim().toLowerCase();

  const formError = () => {
    if (!form.name.trim()) return 'Enter your name.';
    if (!EMAIL.test(address)) return 'Enter a valid email address.';
    if (!STRONG(form.password)) return PASSWORD_HINT;
    if (form.password !== form.again) return 'The two passwords don’t match.';
    return '';
  };

  const signUp = async () => {
    await memberSignUp(form.name.trim(), address, form.password);
    setCode('');
    setNotice('');
    setStep('code');
    startWait();
  };

  /** The code, then signing in with the password they chose (a confirm that already went through counts as done). */
  const confirmAndSignIn = async () => {
    await confirmEmail(address, code.replace(/\s+/g, ''));
    const r = await partnerSignIn(address, form.password);
    // A brand-new member never has a temporary password: this is only a safeguard.
    if ('challenge' in r) throw new Error('Sign in to finish setting up your account.');
    onSignedIn(r.user);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExists(false);
    const invalid = step === 'form' ? formError() : /^\d{6}$/.test(code.replace(/\s+/g, '')) ? '' : 'Enter the 6-digit code from the email.';
    if (invalid) return setError(invalid);
    setBusy(true);
    try {
      await (step === 'form' ? signUp() : confirmAndSignIn());
    } catch (err) {
      if (err instanceof PartnerApiError && err.code === 'EMAIL_EXISTS') setExists(true);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await resendConfirmation(address);
      startWait();
      setNotice('We sent a new code. Check your spam folder too.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code. Please try again.');
    }
  };

  return (
    <form className={auth.layout} onSubmit={submit} noValidate>
      <div className={auth.stack}>
        <span className={auth.title}>{step === 'form' ? 'Create Your CLP Account' : 'Check Your Email'}</span>
        <span className={auth.text}>
          {step === 'form' ? (
            'Book sessions, follow partners, request team gear and keep everything in one place.'
          ) : (
            <>
              Enter the 6-digit code we sent to <strong>{address}</strong>.
            </>
          )}
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
          <CodeStep look={auth} large code={code} onCode={setCode} wait={wait} onResend={resend} backLabel="Use a Different Email" onBack={() => (setStep('form'), setNotice(''), setError(''))} />
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
