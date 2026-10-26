'use client';

import { createContext, useContext, useEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import s from '../partnerPage.module.css';

/** The partner page's colours (its CSS variables), so popups opened from it wear them too. */
export const PaletteContext = createContext<CSSProperties>({});

/**
 * A popup over the partner page: the dark backdrop (a click on it or Escape closes), and the white dialog, or the
 * content as it is (`bare`: a video or photo viewer). The page behind doesn't scroll meanwhile.
 */
export function Overlay({
  children,
  onClose,
  width = 560,
  bare,
  dark,
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  width?: number;
  bare?: boolean;
  /** A near-black backdrop (the photo viewer). */
  dark?: boolean;
  label?: string;
}) {
  const palette = useContext(PaletteContext);
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={`${s.overlay} ${dark ? s.overlayDark : ''}`} style={palette} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      {bare ? (
        children
      ) : (
        <div className={s.dialog} role="dialog" aria-modal="true" aria-label={label} style={{ maxWidth: width }}>
          {children}
        </div>
      )}
    </div>,
    document.body,
  );
}

