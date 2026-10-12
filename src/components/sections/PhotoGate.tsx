'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { albumsEnabled, liveAlbumHref, unlockAlbum, type LiveAlbum } from '@/content/albums';
import type { AlbumAccess } from '@/content/gallery';
import styles from './PhotoGate.module.css';

type Props = {
  kind: Exclude<AlbumAccess, 'public'>;
  /** A code already typed (the home page's "Find my photos", or a link with ?code=): it is tried at once. */
  initialCode?: string;
  /** A private album opened by its code (default: go to the album). */
  onUnlocked?: (album: LiveAlbum) => void;
};

const Lock = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/**
 * The gate of an album that isn't public (new design): a private album's access code (it opens the album made in the
 * admin with that code), a youth album's parent sign-in, or a client gallery's login (those two come later: a try
 * answers with what to do next).
 */
export default function PhotoGate({ kind, initialCode = '', onUnlocked }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const unlock = async (value: string) => {
    if (!value.trim()) return setNote('Enter the access code.');
    if (!albumsEnabled) return setNote('No album matches this code. Check the code on your photo card, ticket or invite.');
    setBusy(true);
    setNote('');
    try {
      const album = await unlockAlbum(value.trim());
      if (onUnlocked) onUnlocked(album);
      else router.push(liveAlbumHref(album));
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'That didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // A code that came with the address is tried once, straight away.
  const tried = useRef(false);
  useEffect(() => {
    if (kind !== 'code' || !initialCode.trim() || tried.current) return;
    tried.current = true;
    void unlock(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (kind === 'code') void unlock(code);
    else if (kind === 'client') setNote(login.email.trim() && login.password ? 'We couldn’t sign you in. Check the client login we sent you.' : 'Enter your email and password.');
    else setNote('Parent accounts are coming soon. Ask the event organizer for your family’s photos meanwhile.');
  };

  if (kind === 'family') {
    return (
      <form className={`${styles.gate} ${styles.wide}`} onSubmit={submit}>
        <span className={`${styles.icon} ${styles.family}`}>
          <Lock color="#FFFFFF" />
        </span>
        <span className={styles.title}>Youth Album: Families Only</span>
        <span className={styles.text}>
          This event had players under 18. Only parents or guardians with a CLP account linked to a registered player can view these photos.
        </span>
        <button type="submit" className={styles.primary}>
          Sign In With Parent Account
        </button>
        {note && <span className={styles.note} role="status">{note}</span>}
        <span className={styles.small}>
          Youth photos are never public or searchable, and downloads are for personal use only. Don&rsquo;t see your child&rsquo;s event? Ask the organizer to
          add your account.
        </span>
      </form>
    );
  }
  if (kind === 'client') {
    return (
      <form className={`${styles.gate} ${styles.left}`} onSubmit={submit}>
        <span className={`${styles.icon} ${styles.client}`}>
          <Lock color="#000000" />
        </span>
        <span className={`${styles.title} ${styles.center}`}>Client Gallery</span>
        <span className={`${styles.text} ${styles.center}`}>Sign in with the client login we sent you.</span>
        <label className={styles.field}>
          Email
          <input className={styles.input} type="email" autoComplete="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
        </label>
        <label className={styles.field}>
          Password
          <input className={styles.input} type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
        </label>
        <button type="submit" className={styles.primary}>
          Open Gallery
        </button>
        {note && <span className={styles.note} role="status">{note}</span>}
      </form>
    );
  }
  return (
    <form className={styles.gate} onSubmit={submit}>
      <span className={`${styles.icon} ${styles.private}`}>
        <Lock color="#FFFFFF" />
      </span>
      <span className={styles.title}>Private Event Album</span>
      <span className={styles.text}>Enter the access code from your photo card, ticket or invite.</span>
      <input
        className={`${styles.input} ${styles.code}`}
        aria-label="Access code"
        placeholder="e.g. RIP-2410"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? 'Opening…' : 'Unlock Album'}
      </button>
      {note && <span className={styles.note} role="status">{note}</span>}
      <span className={styles.small}>Private albums don&rsquo;t show up in search, and their photos can&rsquo;t be shared publicly.</span>
    </form>
  );
}
