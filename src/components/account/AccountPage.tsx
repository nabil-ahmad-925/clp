'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import PartnerApplicationForm from '@/components/partners/PartnerApplicationForm';
import { ADMIN_URL } from '@/content/partnerPages';
import { changePassword, isMember, isStudioUser, onPartnerSession, partnerSessionSnapshot, partnerSignOut, userFromSnapshot, type PartnerUser } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import own from './account.module.css';
import auth from './authLook.module.css';
import { Brand, PasswordField } from './authParts';

/** Where to go after signing in (?next=), only a page of this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '');
type Tab = 'signin' | 'signup' | 'partner';
const tabOf = (value: string | null): Tab => (value === 'signup' || value === 'partner' ? value : 'signin');

/**
 * The Sign In page (/sign-in/, the main menu's Sign In). Two kinds of account: a CLP member (Sign Up, the site's own
 * account) and a CLP partner (Apply to Become a Partner: CLP approves the application and makes the account, or turns
 * a member's into a partner's). ?tab=signup is Sign Up, ?tab=partner the partner application. Signed in, it shows the
 * account: a member's (apply to become a partner, change password), a partner's (their dashboard and the wholesale
 * studio), and Sign Out. ?next=/path/ returns there after signing in.
 */
export default function AccountPage() {
  const params = useSearchParams();
  const router = useRouter();
  const user = userFromSnapshot(useSyncExternalStore(onPartnerSession, partnerSessionSnapshot, () => ''));
  const tab = tabOf(params.get('tab'));
  const next = safeNext(params.get('next'));
  const show = (to: Tab) => {
    const q = new URLSearchParams(params.toString());
    if (to === 'signin') q.delete('tab');
    else q.set('tab', to);
    const query = q.toString();
    router.replace(`/sign-in/${query ? `?${query}` : ''}`, { scroll: false });
  };
  const signedIn = () => next && router.push(next);

  // A signed-in member applying to become a partner: the application, with their name and email.
  if (user && tab === 'partner' && isMember(user)) {
    return (
      <div className={own.page} data-header-tone="dark">
        <div className={`${own.card} ${own.cardWide}`}>
          <Brand product="Partners" />
          <PartnerApplicationForm look="page" type={params.get('type') ?? ''} initial={{ name: user.name, email: user.email }} doneLabel="Back to My Account" onDone={() => show('signin')} />
        </div>
        <p className={own.switch}>
          <button type="button" className={own.link} onClick={() => show('signin')}>
            ← Back to My Account
          </button>
        </p>
      </div>
    );
  }

  if (user) return <Account user={user} next={next} onApply={() => show('partner')} />;

  return (
    <div className={own.page} data-header-tone="dark">
      <div className={`${own.card} ${tab !== 'signin' ? own.cardWide : ''}`}>
        <Brand product={tab === 'partner' ? 'Partners' : 'Account'} />
        {tab !== 'partner' && (
          <div className={own.tabs} role="tablist" aria-label="Sign in or sign up">
            <button type="button" role="tab" className={own.tab} aria-selected={tab === 'signin'} onClick={() => show('signin')}>
              Sign In
            </button>
            <button type="button" role="tab" className={own.tab} aria-selected={tab === 'signup'} onClick={() => show('signup')}>
              Sign Up
            </button>
          </div>
        )}
        <div role="tabpanel">
          {tab === 'partner' ? (
            <PartnerApplicationForm look="page" type={params.get('type') ?? ''} doneLabel="Back to Sign In" onDone={() => show('signin')} onSignIn={() => show('signin')} />
          ) : tab === 'signup' ? (
            <SignUpForm onSignedIn={signedIn} onPartner={() => show('partner')} onSignIn={() => show('signin')} />
          ) : (
            <SignInForm look="page" onSignedIn={signedIn} />
          )}
        </div>
      </div>
      <p className={own.switch}>
        {tab === 'partner' ? 'Not a club, team, school or business? ' : tab === 'signup' ? 'Already have an account? ' : 'New to CLP? '}
        <button type="button" className={own.link} onClick={() => show(tab === 'signin' ? 'signup' : tab === 'partner' ? 'signup' : 'signin')}>
          {tab === 'partner' ? 'Create a Member Account' : tab === 'signup' ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}

const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';
const STRONG = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

/** Signed in: who, what kind of account, where to go, change password and Sign Out. */
function Account({ user, next, onApply }: { user: PartnerUser; next: string; onApply: () => void }) {
  const partner = isStudioUser(user);
  const member = isMember(user);
  const [pw, setPw] = useState({ old: '', next: '' });
  const [pwOpen, setPwOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pw.old) return setError('Enter your current password.');
    if (!STRONG(pw.next)) return setError(PASSWORD_HINT);
    setBusy(true);
    try {
      await changePassword(pw.old, pw.next);
      setPw({ old: '', next: '' });
      setPwOpen(false);
      setNotice('Your password is changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change it. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={own.page} data-header-tone="dark">
      <div className={own.card}>
        <Brand product="Account" />
        <div className={auth.layout}>
          <div className={auth.stack}>
            <span className={auth.doneKicker}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {partner ? 'CLP PARTNER' : member ? 'CLP MEMBER' : 'SIGNED IN'}
            </span>
            <span className={auth.title}>Welcome, {user.name.split(/\s+/)[0] || user.name}</span>
            <span className={auth.text}>
              You’re signed in as <strong>{user.email}</strong>
              {user.access?.partnerName ? ` for ${user.access.partnerName}` : ''}.
            </span>
            {notice && (
              <span className={auth.notice} role="status">
                {notice}
              </span>
            )}
          </div>
          <div className={auth.footer}>
            {next && (
              <Link href={next} className={auth.primary}>
                Continue
              </Link>
            )}
            {partner ? (
              <>
                <Link href={shopHref({ view: 'bulk' })} className={auth.secondary}>
                  Wholesale & Design Studio
                </Link>
                <a href={`${ADMIN_URL}/`} className={auth.secondary} target="_blank" rel="noopener">
                  Partner Dashboard
                </a>
              </>
            ) : (
              <>
                <Link href={shopHref()} className={auth.secondary}>
                  Shop CLP
                </Link>
                {member && (
                  <button type="button" className={auth.secondary} onClick={onApply}>
                    Apply to Become a CLP Partner
                  </button>
                )}
              </>
            )}
            <button type="button" className={auth.secondary} onClick={() => (setPwOpen(!pwOpen), setError(''))}>
              {pwOpen ? 'Cancel' : 'Change Password'}
            </button>
            <button type="button" className={auth.secondary} onClick={() => void partnerSignOut()}>
              Sign Out
            </button>
          </div>
          {pwOpen && (
            <form className={own.section} onSubmit={savePassword} noValidate>
              <span className={own.sectionTitle}>Change Password</span>
              <div className={auth.fields}>
                <PasswordField look={auth} label="Current password" autoComplete="current-password" value={pw.old} onChange={(v) => setPw({ ...pw, old: v })} />
                <PasswordField look={auth} label="New password" autoComplete="new-password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} hint={PASSWORD_HINT} />
              </div>
              {error && (
                <span className={auth.fieldError} role="alert">
                  {error}
                </span>
              )}
              <button type="submit" className={auth.primary} disabled={busy}>
                {busy ? 'Saving…' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
