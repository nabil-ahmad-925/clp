'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Pages that end without the site footer: the partner directory and profiles (as the original), and Sign In / Sign Up. */
const NO_FOOTER = ['/clp-partners/', '/sign-in/'];

export default function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return NO_FOOTER.some((p) => pathname.startsWith(p)) ? null : children;
}
