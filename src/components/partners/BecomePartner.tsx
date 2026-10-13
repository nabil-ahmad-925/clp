'use client';

import { useState, type ReactNode } from 'react';
import PartnerSignupModal from './PartnerSignupModal';

/** A "Become a Partner" button: opens the partner sign-up popup on the page (nothing leaves the site). */
export default function BecomePartner({ className, type, children }: { className?: string; type?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <PartnerSignupModal type={type} onClose={() => setOpen(false)} />}
    </>
  );
}
