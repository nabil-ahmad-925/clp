'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Pages that end without the site footer on the original: the partner directory and profiles. */
const NO_FOOTER = ['/clp-partners/'];

export default function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return NO_FOOTER.some((p) => pathname.startsWith(p)) ? null : children;
}
