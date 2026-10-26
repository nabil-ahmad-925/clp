'use client';

import { useState, type FormEvent } from 'react';
import { changePassword } from '@/content/partnerSession';
import { PasswordField } from './authParts';
import own from './account.module.css';
import auth from './authLook.module.css';

const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';
const STRONG = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

/** A signed-in account's new password (their current one first). `onDone` once it's changed. */
export default function ChangePassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState({ old: '', next: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pw.old) return setError('Enter your current password.');
    if (!STRONG(pw.next)) return setError(PASSWORD_HINT);
    setBusy(true);
    try {
      await changePassword(pw.old, pw.next);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change it. Please try again.');
      setBusy(false);
    }
  };
  return (
    <form className={own.section} onSubmit={save} noValidate>
      <span className={own.sectionTitle}>Change Password</span>
      <div className={auth.fields}>
        <PasswordField look={auth} label="Current password" autoComplete="current-password" value={pw.old} onChange={(v) => setPw({ ...pw, old: v })} />
        <PasswordField look={auth} label="New password" autoComplete="new-password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} hint={PASSWORD_HINT} />
      </div>
      {error && (
        <span className={auth.fieldError} role="alert">
          {error}
        </span>
      )}
      <button type="submit" className={auth.primary} disabled={busy}>
        {busy ? 'Saving…' : 'Save New Password'}
      </button>
    </form>
  );
}
