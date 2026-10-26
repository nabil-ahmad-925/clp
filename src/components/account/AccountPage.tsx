'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import PartnerApplicationForm from '@/components/partners/PartnerApplicationForm';
import { isMember, onPartnerSession, partnerSessionSnapshot, userFromSnapshot } from '@/content/partnerSession';
import AccountView from './AccountView';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import own from './account.module.css';
import { Brand } from './authParts';

/** Where to go after signing in (?next=), only a page of this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '');
type Tab = 'signin' | 'signup' | 'partner';
const tabOf = (value: string | null): Tab => (value === 'signup' || value === 'partner' ? value : 'signin');

/**
 * The Sign In page (/sign-in/, the main menu's Sign In). Two kinds of account: a CLP member (Sign Up, the site's own
 * account) and a CLP partner (Apply to Become a Partner: CLP approves the application and makes the account, or turns
 * a member's into a partner's). ?tab=signup is Sign Up, ?tab=partner the partner application. While a form asks for
 * the e-mail code, the page shows only that form (no tabs or links around it). Signed in, it shows the account
 * (AccountView). ?next=/path/ returns there after signing in.
 */
export default function AccountPage() {
  const params = useSearchParams();
  const router = useRouter();
  const user = userFromSnapshot(useSyncExternalStore(onPartnerSession, partnerSessionSnapshot, () => ''));
  const tab = tabOf(params.get('tab'));
  const [codeStep, setCodeStep] = useState(false);
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

  if (user) return <AccountView user={user} next={next} />;

  return (
    <div className={own.page} data-header-tone="dark">
      <div className={`${own.card} ${tab !== 'signin' && !codeStep ? own.cardWide : ''}`}>
        <Brand product={tab === 'partner' ? 'Partners' : 'Account'} />
        {tab !== 'partner' && !codeStep && (
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
            <SignUpForm onSignedIn={signedIn} onPartner={() => show('partner')} onSignIn={() => show('signin')} onCodeStep={setCodeStep} />
          ) : (
            <SignInForm look="page" onSignedIn={signedIn} onCodeStep={setCodeStep} />
          )}
        </div>
      </div>
      {!codeStep && (
        <p className={own.switch}>
          {tab === 'partner' ? 'Not a club, team, school or business? ' : tab === 'signup' ? 'Already have an account? ' : 'New to CLP? '}
          <button type="button" className={own.link} onClick={() => show(tab === 'signin' ? 'signup' : tab === 'partner' ? 'signup' : 'signin')}>
            {tab === 'partner' ? 'Create a Member Account' : tab === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      )}
    </div>
  );
}
