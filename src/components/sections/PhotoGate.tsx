'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  albumsEnabled,
  chooseFirstPassword,
  forgotPassword,
  liveAlbumHref,
  resetPassword,
  signIn,
  signOut,
  unlockAlbum,
  type LiveAlbum,
} from '@/content/albums';
import type { AlbumAccess } from '@/content/gallery';
import usePhotoLogin from '@/components/photos/usePhotoLogin';
import styles from './PhotoGate.module.css';

type Props = {
  /** An album's gate, or `login`: the photo login's own sign-in (the invitation e-mail's link). */
  kind: Exclude<AlbumAccess, 'public'> | 'login';
  /** A code already typed (the home page's "Find my photos", or a link with ?code=): it is tried at once. */
  initialCode?: string;
  /** A private album opened by its code (default: go to the album). */
  onUnlocked?: (album: LiveAlbum) => void;
  /** A families-only album or a client gallery that the signed-in photo login wasn't added to. */
  notAdded?: boolean;
};

const Lock = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const message = (err: unknown) => (err instanceof Error ? err.message : 'That didn’t work. Try again.');
const PASSWORD_HINT = 'At least 8 characters, with an uppercase letter, a lowercase letter and a number.';

/**
 * Signing in with a photo login (the e-mail and password CLP sent): the sign-in, the first sign-in's own password (in
 * place of the invitation's temporary one), and a forgotten password's reset by e-mailed code. Signed in, the page
 * opens what the login may see (its parent listens to the sign-in).
 */
function LoginForm({ button, children }: { button: string; children?: ReactNode }) {
  const [step, setStep] = useState<'signin' | 'new' | 'forgot' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [session, setSession] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setNote('');
    try {
      await fn();
    } catch (err) {
      setNote(message(err));
    } finally {
      setBusy(false);
    }
  };
  const go = (next: typeof step, text = '') => {
    setStep(next);
    setPassword('');
    setCode('');
    setNote(text);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) return setNote('Enter your email address.');
    if (step === 'signin') {
      if (!password) return setNote('Enter your password.');
      return void run(async () => {
        const r = await signIn(email.trim(), password);
        if ('challenge' in r) {
          setSession(r.session);
          go('new', 'Welcome! Choose your own password to finish signing in.');
        }
      });
    }
    if (step === 'new') {
      if (!password) return setNote('Choose a password.');
      return void run(() => chooseFirstPassword(email.trim(), session, password));
    }
    if (step === 'forgot') {
      return void run(async () => {
        await forgotPassword(email.trim());
        go('reset', 'If this email has a photo login, we sent it a 6-digit code. Enter it with your new password.');
      });
    }
    if (!code.trim()) return setNote('Enter the 6-digit code from the email.');
    if (!password) return setNote('Choose a new password.');
    return void run(async () => {
      await resetPassword(email.trim(), code.trim(), password);
      go('signin', 'Your password was reset. Sign in with your new password.');
    });
  };

  return (
    <form className={styles.login} onSubmit={submit} noValidate>
      {children}
      <label className={styles.field}>
        Email
        <input
          className={styles.input}
          type="email"
          autoComplete="email"
          value={email}
          readOnly={step === 'new' || step === 'reset'}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {step === 'reset' && (
        <label className={styles.field}>
          Code
          <input className={styles.input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
      )}
      {step !== 'forgot' && (
        <label className={styles.field}>
          {step === 'signin' ? 'Password' : 'New password'}
          <input
            className={styles.input}
            type="password"
            autoComplete={step === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {step !== 'signin' && <span className={styles.fieldHint}>{PASSWORD_HINT}</span>}
        </label>
      )}
      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? 'One moment…' : step === 'signin' ? button : step === 'new' ? 'Save Password' : step === 'forgot' ? 'Send Code' : 'Reset Password'}
      </button>
      {note && (
        <span className={styles.note} role="status">
          {note}
        </span>
      )}
      {step === 'signin' ? (
        <button type="button" className={styles.link} onClick={() => go('forgot')}>
          Forgot your password?
        </button>
      ) : (
        <button type="button" className={styles.link} onClick={() => go('signin')}>
          Back to sign in
        </button>
      )}
      {step === 'forgot' && <span className={styles.small}>Haven&rsquo;t signed in yet? Use the temporary password from your invitation email.</span>}
    </form>
  );
}

/** Signed in, but this album's owner didn't add this login: who is signed in, and a way to switch. */
function NotAdded({ email }: { email: string }) {
  return (
    <>
      <span className={styles.note} role="status">
        You&rsquo;re signed in as <strong>{email}</strong>, but this login hasn&rsquo;t been added to this album. Ask the organizer to add your email.
      </span>
      <button type="button" className={styles.primary} onClick={() => void signOut()}>
        Sign In With Another Login
      </button>
    </>
  );
}

/**
 * The gate of an album that isn't public (new design): a private album's access code (it opens the album made in the
 * admin with that code), a youth album's parent sign-in, or a client gallery's login (both with the photo login CLP
 * e-mailed the people its owner added); `login` is that sign-in on its own.
 */
export default function PhotoGate({ kind, initialCode = '', onUnlocked, notAdded }: Props) {
  const router = useRouter();
  const email = usePhotoLogin();
  const [code, setCode] = useState(initialCode);
  const [parentForm, setParentForm] = useState(false);
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
      setNote(message(err));
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

  const signedInElsewhere = Boolean(notAdded && email);

  if (kind === 'family') {
    const form = parentForm && !signedInElsewhere;
    return (
      <div className={`${styles.gate} ${styles.wide} ${form ? styles.left : ''}`}>
        <span className={`${styles.icon} ${styles.family}`}>
          <Lock color="#FFFFFF" />
        </span>
        <span className={`${styles.title} ${styles.center}`}>Youth Album: Families Only</span>
        <span className={`${styles.text} ${styles.center}`}>
          This event had players under 18. Only the parents or guardians the organizer added can view these photos, signed in with the photo login we
          emailed them.
        </span>
        {signedInElsewhere ? (
          <NotAdded email={email!} />
        ) : form ? (
          <LoginForm button="Sign In" />
        ) : (
          <button type="button" className={styles.primary} onClick={() => setParentForm(true)}>
            Sign In With Parent Account
          </button>
        )}
        <span className={`${styles.small} ${styles.center}`}>
          Youth photos are never public or searchable, and downloads are for personal use only. Don&rsquo;t see your child&rsquo;s event? Ask the organizer to
          add your account.
        </span>
      </div>
    );
  }
  if (kind === 'client' || kind === 'login') {
    return (
      <div className={`${styles.gate} ${styles.left}`}>
        <span className={`${styles.icon} ${kind === 'client' ? styles.client : styles.private}`}>
          <Lock color={kind === 'client' ? '#000000' : '#FFFFFF'} />
        </span>
        <span className={`${styles.title} ${styles.center}`}>{kind === 'client' ? 'Client Gallery' : 'Your Photos'}</span>
        <span className={`${styles.text} ${styles.center}`}>
          {kind === 'client' ? 'Sign in with the client login we sent you.' : 'Sign in with the photo login we emailed you.'}
        </span>
        {signedInElsewhere ? <NotAdded email={email!} /> : <LoginForm button={kind === 'client' ? 'Open Gallery' : 'Sign In'} />}
      </div>
    );
  }
  return (
    <form
      className={styles.gate}
      onSubmit={(e) => {
        e.preventDefault();
        void unlock(code);
      }}
    >
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
