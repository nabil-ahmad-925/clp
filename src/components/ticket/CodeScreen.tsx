'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { checkInWithCode } from '@/content/ticket';
import styles from './ticket.module.css';
import { Back, PoweredBy, partyOf, type ScreenProps } from './parts';

/** Field code check-in (design board 8): the guest types the 4-digit code from the host's phone. */
export default function CodeScreen({ ticket: t, id, token, href, onChange }: ScreenProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 4) return setError('Enter the 4 digits on the host’s phone.');
    setBusy(true);
    setError('');
    try {
      onChange(await checkInWithCode(id, token, digits));
      router.push(href('ticket'));
    } catch (err) {
      setError((err as Error).message);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className={styles.body}>
        <Back href={href('start')} label="Back" />
        <h1 className={styles.title}>Checking In {t.name}</h1>
        <p className={styles.muted}>Found you: {t.name} · {partyOf(t)} · ticket {t.ref}.{t.needsSigning ? '' : ' Documents all signed.'}</p>
        {t.checkedInAt ? (
          <Link href={href('ticket')} className={`${styles.btn} ${styles.primary}`}>You’re Already Checked In · See Your Ticket</Link>
        ) : t.needsSigning ? (
          <>
            <p className={styles.error}>Sign the waiver first, then check in.</p>
            <Link href={href('ticket')} className={`${styles.btn} ${styles.primary}`}>Sign On Your Ticket</Link>
          </>
        ) : !t.selfCheckIn ? (
          <>
            <p className={styles.note}>This host checks everyone in at the field today. Show them your ticket.</p>
            <Link href={href('ticket')} className={`${styles.btn} ${styles.primary}`}>Show My Ticket</Link>
          </>
        ) : (
          <form className={styles.card} onSubmit={submit}>
            <strong>Enter today’s field code</strong>
            <span className={styles.muted}>It’s on the host’s phone at check-in. It changes every 2 minutes.</span>
            <input className={styles.code} value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={4} aria-label="Field code" onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} />
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={busy || code.length !== 4}>{busy ? 'Checking In…' : 'Check In'}</button>
            <Link href={href('ticket')} className={styles.btn}>Show My Ticket To The Host Instead</Link>
          </form>
        )}
      </main>
      <PoweredBy />
    </>
  );
}
