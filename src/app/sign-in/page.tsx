import type { Metadata } from 'next';
import { Suspense } from 'react';
import AccountPage from '@/components/account/AccountPage';

export const metadata: Metadata = {
  title: { absolute: 'Sign In - Compete Like Pros™' },
  description: 'Sign in to your CLP account, or sign up to become a CLP Partner.',
  alternates: { canonical: '/sign-in/' },
  robots: { index: false, follow: true },
};

/** Sign In and Sign Up (the main menu's Sign In): see AccountPage. Its tab comes from the address, known only in the browser. */
export default function SignInPage() {
  return (
    <Suspense>
      <AccountPage />
    </Suspense>
  );
}
