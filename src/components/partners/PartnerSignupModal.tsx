'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import claim from '@/components/sections/ClaimModal.module.css';
import PartnerApplicationForm from './PartnerApplicationForm';

type Props = {
  /** The partner type chosen at the start (the person can change it). */
  type?: string;
  onClose: () => void;
};

/**
 * "Become a Partner" (the form popup of the other program forms, see ProgramModal): the application to become a CLP
 * Partner (PartnerApplicationForm), without leaving the site. Esc, the close button or a click outside closes it (not
 * while it is sending).
 */
export default function PartnerSignupModal({ type = '', onClose }: Props) {
  const [sending, setSending] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once). While it is sending it stays open.
  const closeRef = useRef(onClose);
  const sendingRef = useRef(false);
  useEffect(() => {
    closeRef.current = () => !sendingRef.current && onClose();
    sendingRef.current = sending;
  });
  useEffect(() => {
    document.body.classList.add('menu-open');
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return createPortal(
    <div className={claim.overlay} onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <div ref={dialog} className={claim.dialog} role="dialog" aria-modal="true" aria-label="Become a Partner" tabIndex={-1}>
        <button type="button" className={claim.close} aria-label="Close" disabled={sending} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <PartnerApplicationForm type={type} onSending={setSending} doneLabel="Done" onDone={onClose} />
      </div>
    </div>,
    document.body,
  );
}
