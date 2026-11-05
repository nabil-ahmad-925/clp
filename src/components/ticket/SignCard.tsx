'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { signWaiver } from '@/content/ticket';
import styles from './ticket.module.css';
import type { ScreenProps } from './parts';

/** A walk-in added at the field signs here what booking would have asked them: the waiver, as guardian, their age. */
export default function SignCard({ ticket: t, id, token, onChange }: Omit<ScreenProps, 'href'>) {
  const [waiver, setWaiver] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [age, setAge] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const adultsOnly = t.ages?.kind === 'adult';
  const ready = waiver && (t.kids === 0 || guardian) && (!adultsOnly || age);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onChange(await signWaiver(id, token, { waiver, guardian: t.kids > 0 ? guardian : undefined, ageConfirmed: adultsOnly ? age : undefined }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <span className={styles.eyebrow}>Sign before you play</span>
      <label className={styles.check}>
        <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} />
        <span>I agree to the <Link href="/waivers-documents/" target="_blank">Waiver &amp; Release and Expectations &amp; Commitment</Link>.</span>
      </label>
      {t.kids > 0 && (
        <label className={styles.check}>
          <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} />
          <span>I’m the parent or guardian of every child booked.</span>
        </label>
      )}
      {adultsOnly && (
        <label className={styles.check}>
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} />
          <span>Everyone booked is {t.ages?.minAge ?? 18} or older.</span>
        </label>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={!ready || busy}>{busy ? 'Signing…' : 'Sign'}</button>
    </form>
  );
}
