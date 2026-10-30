'use client';

import { useState } from 'react';
import type { PublicLink } from '@/content/links';
import styles from '../preorders/Preorder.module.css';

/** A private link before it's opened: its password, or the invited email. */
export default function LockedLink({ link, onUnlock }: { link: PublicLink; onUnlock: (secret: { password?: string; email?: string }) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const password = link.access === 'pw';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onUnlock(password ? { password: value } : { email: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }
  return (
    <form className={styles.form} style={{ maxWidth: 460 }} onSubmit={submit} noValidate>
      <h2 className={styles.formTitle}>This Link Is Private</h2>
      <p className={styles.note}>{password ? `Enter the password ${link.partner.name} gave you.` : `Enter the email ${link.partner.name} invited.`}</p>
      <label className={styles.label}>
        {password ? 'Password' : 'Email'}
        <input className={styles.input} type={password ? 'password' : 'email'} autoComplete={password ? 'current-password' : 'email'} value={value} onChange={(e) => setValue(e.target.value)} required />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.primary} type="submit" disabled={busy || !value.trim()}>
        {busy ? 'Opening…' : 'Open Link'}
      </button>
    </form>
  );
}
