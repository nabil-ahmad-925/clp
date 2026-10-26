'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SignInForm from '@/components/account/SignInForm';
import claim from '@/components/sections/ClaimModal.module.css';

/**
 * "Partner sign in" on the shop (the design studio, saved designs and partner pricing): the partner's CLP account, the
 * same as the admin's and the site's Sign In page (SignInForm, for partners only here).
 */
export default function PartnerSignIn({ onClose, onSignedIn }: { onClose: () => void; onSignedIn?: () => void }) {
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

  return createPortal(
    <div className={claim.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={claim.dialog} role="dialog" aria-modal="true" aria-label="Partner sign in" style={{ maxWidth: 460 }}>
        <button type="button" className={claim.close} aria-label="Close" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <SignInForm
          studio
          onSignedIn={() => {
            onSignedIn?.();
            onClose();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
