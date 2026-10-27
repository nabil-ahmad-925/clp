'use client';

import Link from 'next/link';
import { ADMIN_URL } from '@/content/partnerPages';
import { isMember, isStudioUser, partnerSignOut, type PartnerUser } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import { Brand } from './authParts';
import own from './account.module.css';
import auth from './authLook.module.css';

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** Signed in: who, what kind of account, where to go (back to `next`, the shop, a partner's tools), Sign Out. */
export default function AccountView({ user, next }: { user: PartnerUser; next: string }) {
  const partner = isStudioUser(user);
  return (
    <div className={own.page} data-header-tone="dark">
      <div className={own.card}>
        <Brand product="Account" />
        <div className={auth.layout}>
          <div className={auth.stack}>
            <span className={auth.doneKicker}>
              <Check />
              {partner ? 'CLP PARTNER' : isMember(user) ? 'CLP MEMBER' : 'SIGNED IN'}
            </span>
            <span className={auth.title}>Welcome, {user.name.split(/\s+/)[0] || user.name}</span>
            <span className={auth.text}>
              You’re signed in as <strong>{user.email}</strong>
              {user.access?.partnerName ? ` for ${user.access.partnerName}` : ''}.
            </span>
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
              <Link href={shopHref()} className={auth.secondary}>
                Shop CLP
              </Link>
            )}
            <button type="button" className={auth.secondary} onClick={() => void partnerSignOut()}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
