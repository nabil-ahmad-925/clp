'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import PartnerApplicationForm from '@/components/partners/PartnerApplicationForm';
import claim from '@/components/sections/ClaimModal.module.css';
import { ADMIN_URL } from '@/content/partnerPages';
import { onPartnerSession, partnerSessionSnapshot, partnerSignOut, userFromSnapshot } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import SignInForm from './SignInForm';
import own from './account.module.css';

/** Where to go after signing in (?next=), only a page of this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '');

/**
 * The Sign In page (/sign-in/, the main menu's Sign In): Sign In (the CLP account, SignInForm) or Sign Up (the
 * application to become a CLP Partner, PartnerApplicationForm), switched by ?tab=signup. Signed in, it shows who and
 * where to go (the shop's wholesale studio, the partner dashboard) and Sign Out. ?next=/path/ returns there after
 * signing in.
 */
export default function AccountPage() {
  const params = useSearchParams();
  const router = useRouter();
  const user = userFromSnapshot(useSyncExternalStore(onPartnerSession, partnerSessionSnapshot, () => ''));
  const signUp = params.get('tab') === 'signup';
  const next = safeNext(params.get('next'));
  const show = (tab: 'signin' | 'signup') => {
    const q = new URLSearchParams(params.toString());
    if (tab === 'signup') q.set('tab', 'signup');
    else q.delete('tab');
    const query = q.toString();
    router.replace(`/sign-in/${query ? `?${query}` : ''}`, { scroll: false });
  };

  if (user) {
    return (
      <div className={own.page} data-header-tone="dark">
        <div className={own.card}>
          <div className={claim.layout}>
            <div className={claim.body}>
              <div className={claim.stack}>
                <span className={claim.doneKicker}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  SIGNED IN
                </span>
                <span className={claim.title}>Welcome, {user.name.split(/\s+/)[0] || user.name}</span>
                <span className={claim.text}>
                  You’re signed in as <strong>{user.email}</strong>
                  {user.access?.partnerName ? ` for ${user.access.partnerName}` : ''}.
                </span>
                <div className={own.actions}>
                  {next && (
                    <Link href={next} className={claim.primary} style={{ display: 'grid', placeItems: 'center', color: '#fff', textDecoration: 'none' }}>
                      Continue
                    </Link>
                  )}
                  <Link href={shopHref({ view: 'bulk' })} className={own.secondary}>
                    Wholesale & Design Studio
                  </Link>
                  <a href={`${ADMIN_URL}/`} className={own.secondary} target="_blank" rel="noopener">
                    Partner Dashboard
                  </a>
                  <button type="button" className={own.secondary} onClick={() => void partnerSignOut()}>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={own.page} data-header-tone="dark">
      <div className={own.tabs} role="tablist" aria-label="Sign in or sign up">
        <button type="button" role="tab" className={own.tab} aria-selected={!signUp} onClick={() => show('signin')}>
          Sign In
        </button>
        <button type="button" role="tab" className={own.tab} aria-selected={signUp} onClick={() => show('signup')}>
          Sign Up
        </button>
      </div>
      <div className={`${own.card} ${signUp ? own.cardWide : ''}`} role="tabpanel">
        {signUp ? (
          <PartnerApplicationForm type={params.get('type') ?? ''} doneLabel="Back to Sign In" onDone={() => show('signin')} onSignIn={() => show('signin')} />
        ) : (
          <SignInForm onSignedIn={() => next && router.push(next)} />
        )}
      </div>
      <p className={own.switch}>
        {signUp ? 'Already have an account? ' : 'New to CLP? '}
        <button type="button" className={own.link} onClick={() => show(signUp ? 'signin' : 'signup')}>
          {signUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
