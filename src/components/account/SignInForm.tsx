'use client';

import { useState, type FormEvent } from 'react';
import claim from '@/components/sections/ClaimModal.module.css';
import { PartnerApiError } from '@/content/partnerPages';
import {
  confirmEmail,
  isStudioUser,
  partnerFirstPassword,
  partnerForgotPassword,
  partnerResetPassword,
  partnerSignIn,
  partnerSignOut,
  resendConfirmation,
  type PartnerUser,
} from '@/content/partnerSession';
import own from './account.module.css';
import auth from './authLook.module.css';
import { PasswordField, useCooldown } from './authParts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** The API's rule for a new password (clp-api parseNewPassword). */
const STRONG = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);
const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';

type Step = 'signin' | 'new-password' | 'forgot' | 'reset' | 'confirm';

/**
 * Signing in with the CLP account (the admin's, clp-api auth-login), in the form popup's look (ClaimModal.module.css) by default:
 * email and password; an invited partner on their temporary password chooses their own; "Forgot your password?" e-mails
 * a code, and the code and a new password reset it here. A member who signed up but never confirmed their e-mail gets a
 * new code and confirms it here, then is signed in. `studio`: the shop's design studio, for partners only (anyone else
 * is signed out again). `look="page"`: the Sign In page's look (the admin's sign-in card, authLook.module.css), with
 * Show/Hide on passwords.
 */
export default function SignInForm({ studio = false, look = 'popup', onSignedIn }: { studio?: boolean; look?: 'page' | 'popup'; onSignedIn?: (user: PartnerUser) => void }) {
  const page = look === 'page';
  const s = page ? auth : claim;
  const o = page ? auth : own;
  const [wait, startWait] = useCooldown();
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
      setError('This is a CLP member account. The design studio is for approved partners: apply to become a partner from Sign In in the menu.');
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
    if ((step === 'reset' || step === 'confirm') && !/^\d{6}$/.test(code.replace(/\s+/g, ''))) return setError('Enter the 6-digit code from the email.');
    setBusy(true);
    try {
      if (step === 'new-password') return await done(await partnerFirstPassword(address, session, next));
      if (step === 'confirm') {
        // Confirmed: signed in with the password they just typed.
        await confirmEmail(address, code.replace(/\s+/g, ''));
        const r = await partnerSignIn(address, password);
        if ('challenge' in r) {
          setSession(r.session);
          setStep('new-password');
          setBusy(false);
          return;
        }
        return await done(r.user);
      }
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
      // Signed up, never confirmed: a new code, then the confirm step.
      if (step === 'signin' && err instanceof PartnerApiError && err.code === 'NOT_CONFIRMED') {
        await resendConfirmation(address).catch(() => {});
        startWait();
        setCode('');
        setStep('confirm');
        setNotice(`Confirm your email first. We sent a 6-digit code to ${address}.`);
      } else setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await resendConfirmation(email.trim().toLowerCase());
      startWait();
      setNotice(`We sent a new code to ${email.trim().toLowerCase()}. Check your spam folder too.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code. Please try again.');
    }
  };

  const copy = {
    signin: {
      title: studio ? 'Partner Sign In' : 'Sign In',
      text: studio
        ? 'Sign in with your CLP partner account to use the design studio, live mockups, saved designs and partner pricing.'
        : 'Sign in with your CLP account. Partners get the design studio, saved designs and partner pricing in the shop.',
      button: 'Sign In',
    },
    'new-password': {
      title: 'Choose Your Password',
      text: 'You’re signing in for the first time with your temporary password. Choose your own to continue.',
      button: 'Save and Sign In',
    },
    forgot: { title: 'Reset Your Password', text: 'Enter your account’s email and we’ll send you a 6-digit code to choose a new password.', button: 'Send Code' },
    reset: { title: 'Choose a New Password', text: 'Enter the code from the email and your new password.', button: 'Save Password' },
    confirm: { title: 'Confirm Your Email', text: 'Enter the 6-digit code we emailed you. It’s valid for 24 hours.', button: 'Confirm and Sign In' },
  }[step];

  const emailField = (
    <label className={s.field}>
      Email
      <input className={s.input} type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
    </label>
  );
  const newPasswordField = <PasswordField look={s} label="New password" autoComplete="new-password" value={next} onChange={setNext} hint={PASSWORD_HINT} />;
  const codeField = (
    <label className={s.field}>
      Code from the email
      <input
        className={`${s.input} ${page ? auth.code : ''}`}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        placeholder={page ? '000000' : undefined}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
    </label>
  );

  return (
    <form className={s.layout} onSubmit={submit} noValidate>
      <div className={s.body}>
        <div className={s.stack}>
          <span className={s.kicker}>{studio ? 'CLP PARTNERS' : 'COMPETE LIKE PROS'}</span>
          <span className={s.title}>{copy.title}</span>
          <span className={s.text}>{copy.text}</span>
          {notice && (
            <span className={o.notice} role="status">
              {notice}
            </span>
          )}
          <div className={s.fields} style={page ? undefined : { gridTemplateColumns: '1fr' }}>
            {step === 'signin' && (
              <>
                {emailField}
                <PasswordField look={s} label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
                <button type="button" className={o.link} onClick={() => go('forgot')}>
                  Forgot Your Password?
                </button>
              </>
            )}
            {step === 'new-password' && newPasswordField}
            {step === 'forgot' && emailField}
            {step === 'reset' && (
              <>
                {emailField}
                {codeField}
                {newPasswordField}
              </>
            )}
            {step === 'confirm' && (
              <>
                {codeField}
                <button type="button" className={o.link} onClick={resend} disabled={wait > 0}>
                  {wait > 0 ? `Send a New Code in ${wait}s` : 'Send a New Code'}
                </button>
              </>
            )}
            {(step === 'forgot' || step === 'reset' || step === 'confirm') && (
              <button type="button" className={o.link} onClick={() => go('signin')}>
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={s.footer}>
        {error && (
          <span className={s.fieldError} role="alert">
            {error}
          </span>
        )}
        <button type="submit" className={s.primary} disabled={busy || (step === 'signin' && (!email.trim() || !password))}>
          {busy ? 'Please Wait…' : copy.button}
        </button>
      </div>
    </form>
  );
}
