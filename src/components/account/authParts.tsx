'use client';

import { useEffect, useState } from 'react';
import auth from './authLook.module.css';

type Look = Record<string, string>;

/** A password field. In the Sign In page's look (authLook), Show/Hide sits beside its label as on the admin's. */
export function PasswordField({
  look,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  wide,
}: {
  look: Look;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  wide?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const toggle = look === auth;
  return (
    <label className={`${look.field} ${wide ? look.wide : ''}`}>
      {toggle ? (
        <span className={look.labelRow}>
          {label}
          <button type="button" className={`${look.link} ${look.small}`} onClick={() => setShown(!shown)}>
            {shown ? 'Hide' : 'Show'}
          </button>
        </span>
      ) : (
        label
      )}
      <input className={look.input} type={toggle && shown ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className={look.hint}>{hint}</span>}
    </label>
  );
}

/** Seconds until a new code may be asked for (30 after each), as on the admin's. */
export function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(30)] as const;
}

/** The Sign In page card's head: the CLP wordmark, as the admin's sign-in card. */
export function Brand({ product }: { product: string }) {
  return (
    <div className={auth.brand}>
      <span className={auth.logo}>CLP</span>
      <span className={auth.product}>{product}</span>
    </div>
  );
}
