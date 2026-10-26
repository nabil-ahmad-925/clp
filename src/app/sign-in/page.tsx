import type { Metadata } from 'next';
import { Suspense } from 'react';
import AccountPage from '@/components/account/AccountPage';
import own from '@/components/account/account.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Sign In - Compete Like Pros™' },
  description: 'Sign in to your CLP account, or sign up to become a CLP Partner.',
  alternates: { canonical: '/sign-in/' },
  robots: { index: false, follow: true },
};

/** Sign In and Sign Up (the main menu's Sign In): see AccountPage. Its tab comes from the address, known only in the browser. */
export default function SignInPage() {
  // The light page behind the header from the first paint (the account is only known in the browser): the header's
  // logo and menu read dark over it.
  return (
    <div className={own.shell} data-header-tone="dark">
      <Suspense>
        <AccountPage />
      </Suspense>
    </div>
  );
}
