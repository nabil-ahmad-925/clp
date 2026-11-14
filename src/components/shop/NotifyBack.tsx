'use client';

import { useState } from 'react';
import { notifyWhenBack } from '@/content/wholesale';
import w from './wholesale.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "Notify me": an email (a signed-in partner's to start with) for the day a back-ordered item is back. */
export default function NotifyBack({ itemId, email: start }: { itemId: string; email: string }) {
  const [email, setEmail] = useState(start);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
  if (state === 'done') return <strong className={w.backDone}>✓ We’ll email {email.trim()} the day it’s back.</strong>;
  return (
    <form
      className={w.backForm}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!EMAIL.test(email.trim())) return setError('Enter a valid email.');
        setState('busy');
        setError('');
        try {
          await notifyWhenBack(itemId, email.trim());
          setState('done');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not save that. Please try again.');
          setState('idle');
        }
      }}
    >
      <input type="email" aria-label="Your email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" disabled={state === 'busy'}>
        {state === 'busy' ? 'Saving…' : 'Notify Me'}
      </button>
      {error && <span className={w.backError}>{error}</span>}
    </form>
  );
}
