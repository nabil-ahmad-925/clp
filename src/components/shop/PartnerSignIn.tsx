'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import claim from '@/components/sections/ClaimModal.module.css';
import { partnerSignInHref } from '@/content/partnerPages';
import { isStudioUser, partnerFirstPassword, partnerSignIn, partnerSignOut } from '@/content/partnerSession';

/**
 * "Partner sign in" on the shop (the design studio, saved designs and partner pricing): the partner's CLP account, the
 * same as the admin's. An invited partner on their temporary password chooses their own here first.
 */
export default function PartnerSignIn({ onClose, onSignedIn }: { onClose: () => void; onSignedIn?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<{ session: string; email: string } | null>(null);
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('menu-open');
    dialog.current?.querySelector('input')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const done = async (allowed: boolean) => {
    if (!allowed) {
      await partnerSignOut();
      setError('This account isn’t a CLP partner’s. The design studio is for approved partners.');
      setBusy(false);
      return;
    }
    onSignedIn?.();
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (challenge) {
        if (next.length < 8) throw new Error('Choose a password of at least 8 characters.');
        const user = await partnerFirstPassword(challenge.email, challenge.session, next);
        return done(isStudioUser(user));
      }
      const r = await partnerSignIn(email.trim().toLowerCase(), password);
      if ('challenge' in r) {
        setChallenge({ session: r.session, email: r.email });
        setBusy(false);
        return;
      }
      return done(isStudioUser(r.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in. Please try again.');
      setBusy(false);
    }
  };

  return createPortal(
    <div className={claim.overlay} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div ref={dialog} className={claim.dialog} role="dialog" aria-modal="true" aria-label="Partner sign in" style={{ maxWidth: 460 }}>
        <button type="button" className={claim.close} aria-label="Close" disabled={busy} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <form className={claim.layout} onSubmit={submit} noValidate>
          <div className={claim.body}>
            <div className={claim.stack}>
              <span className={claim.kicker}>CLP PARTNERS</span>
              <span className={claim.title}>{challenge ? 'Choose your password' : 'Partner sign in'}</span>
              <span className={claim.text}>
                {challenge
                  ? 'You’re signing in for the first time with your temporary password. Choose your own to continue.'
                  : 'Sign in with your CLP partner account to use the design studio, live mockups, saved designs and partner pricing.'}
              </span>
              <div className={claim.fields} style={{ gridTemplateColumns: '1fr' }}>
                {challenge ? (
                  <label className={claim.field}>
                    New password
                    <input className={claim.input} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
                  </label>
                ) : (
                  <>
                    <label className={claim.field}>
                      Email
                      <input className={claim.input} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    <label className={claim.field}>
                      Password
                      <input className={claim.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </label>
                    <a href={partnerSignInHref} target="_blank" rel="noopener" style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                      Forgot your password?
                    </a>
                  </>
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
            <button type="submit" className={claim.primary} disabled={busy || (!challenge && (!email.trim() || !password))}>
              {busy ? 'Signing in…' : challenge ? 'Save and sign in' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
