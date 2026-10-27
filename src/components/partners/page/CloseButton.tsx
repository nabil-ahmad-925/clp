import s from '../partnerPage.module.css';

export const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);

/** A popup's × (top right of its head). */
export function CloseButton({ onClose, label = 'Close' }: { onClose: () => void; label?: string }) {
  return (
    <button type="button" className={s.close} aria-label={label} onClick={onClose}>
      <CloseIcon />
    </button>
  );
}
