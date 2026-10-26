'use client';

import { useState, type FormEvent } from 'react';
import claim from '@/components/sections/ClaimModal.module.css';
import { isStudioUser, partnerFirstPassword, partnerForgotPassword, partnerResetPassword, partnerSignIn, partnerSignOut, type PartnerUser } from '@/content/partnerSession';
import own from './account.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** The API's rule for a new password (clp-api parseNewPassword). */
const STRONG = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);
const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';

type Step = 'signin' | 'new-password' | 'forgot' | 'reset';

/**
 * Signing in with the CLP account (the admin's, clp-api auth-login), in the form popup's look (ClaimModal.module.css):
 * email and password; an invited partner on their temporary password chooses their own; "Forgot your password?" e-mails
 * a code, and the code and a new password reset it here. `studio`: the shop's design studio, for partners only (anyone
 * else is signed out again).
 */
export default function SignInForm({ studio = false, onSignedIn }: { studio?: boolean; onSignedIn?: (user: PartnerUser) => void }) {
  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [next, setNext] = useState('');
  const [session, setSession] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const go = (s: Step) => {
    setStep(s);
    setError('');
    setNotice('');
  };

  const done = async (user: PartnerUser) => {
    if (studio && !isStudioUser(user)) {
      await partnerSignOut();
      setError('This account isn’t a CLP partner’s. The design studio is for approved partners.');
      setBusy(false);
      return;
    }
    onSignedIn?.(user);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    setError('');
    setNotice('');
    if (step !== 'new-password' && !EMAIL.test(address)) return setError('Enter a valid email address.');
    if ((step === 'new-password' || step === 'reset') && !STRONG(next)) return setError(PASSWORD_HINT);
    if (step === 'reset' && !/^\d{6}$/.test(code.replace(/\s+/g, ''))) return setError('Enter the 6-digit code from the email.');
    setBusy(true);
    try {
      if (step === 'new-password') return await done(await partnerFirstPassword(address, session, next));
      if (step === 'forgot') {
        await partnerForgotPassword(address);
        setStep('reset');
        setNotice(`If ${address} has a CLP account, we’ve emailed it a 6-digit code.`);
      } else if (step === 'reset') {
        await partnerResetPassword(address, code.replace(/\s+/g, ''), next);
        setPassword('');
        setCode('');
        setNext('');
        setStep('signin');
        setNotice('Your password is changed. Sign in with your new password.');
      } else {
        const r = await partnerSignIn(address, password);
        if ('challenge' in r) {
          setSession(r.session);
          setStep('new-password');
        } else return await done(r.user);
      }
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const copy = {
    signin: {
      title: studio ? 'Partner sign in' : 'Sign in',
      text: studio
        ? 'Sign in with your CLP partner account to use the design studio, live mockups, saved designs and partner pricing.'
        : 'Sign in with your CLP account. Partners get the design studio, saved designs and partner pricing in the shop.',
      button: 'Sign In',
    },
    'new-password': {
      title: 'Choose your password',
      text: 'You’re signing in for the first time with your temporary password. Choose your own to continue.',
      button: 'Save and Sign In',
    },
    forgot: { title: 'Reset your password', text: 'Enter your account’s email and we’ll send you a 6-digit code to choose a new password.', button: 'Send Code' },
    reset: { title: 'Choose a new password', text: 'Enter the code from the email and your new password.', button: 'Save Password' },
  }[step];

  const emailField = (
    <label className={claim.field}>
      Email
      <input className={claim.input} type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
    </label>
  );
  const newPasswordField = (
    <label className={claim.field}>
      New password
      <input className={claim.input} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      <span className={own.hint}>{PASSWORD_HINT}</span>
    </label>
  );

  return (
    <form className={claim.layout} onSubmit={submit} noValidate>
      <div className={claim.body}>
        <div className={claim.stack}>
          <span className={claim.kicker}>{studio ? 'CLP PARTNERS' : 'COMPETE LIKE PROS'}</span>
          <span className={claim.title}>{copy.title}</span>
          <span className={claim.text}>{copy.text}</span>
          {notice && (
            <span className={own.notice} role="status">
              {notice}
            </span>
          )}
          <div className={claim.fields} style={{ gridTemplateColumns: '1fr' }}>
            {step === 'signin' && (
              <>
                {emailField}
                <label className={claim.field}>
                  Password
                  <input className={claim.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <button type="button" className={own.link} onClick={() => go('forgot')}>
                  Forgot Your Password?
                </button>
              </>
            )}
            {step === 'new-password' && newPasswordField}
            {step === 'forgot' && emailField}
            {step === 'reset' && (
              <>
                {emailField}
                <label className={claim.field}>
                  Code from the email
                  <input className={claim.input} inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} />
                </label>
                {newPasswordField}
              </>
            )}
            {(step === 'forgot' || step === 'reset') && (
              <button type="button" className={own.link} onClick={() => go('signin')}>
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={claim.footer}>
        {error && (
          <span className={claim.fieldError} role="alert">
            {error}
          </span>
        )}
        <button type="submit" className={claim.primary} disabled={busy || (step === 'signin' && (!email.trim() || !password))}>
          {busy ? 'Please Wait…' : copy.button}
        </button>
      </div>
    </form>
  );
}
