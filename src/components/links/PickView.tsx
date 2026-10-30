'use client';

import { useEffect, useState } from 'react';
import { getPick, type Pick, type PickLink } from '@/content/links';
import styles from '../preorders/Preorder.module.css';

const STATE: Record<PickLink['fulfil'], string> = {
  collecting: 'Your pick is in. It’s made once the link closes.',
  production: 'Being made now.',
  shipped: 'On its way.',
  delivered: 'Delivered.',
};

/** A person's own pick (/link/?x=<id>&t=<secret>): what they chose, where it goes and where it stands. */
export default function PickView({ id, token }: { id: string; token: string }) {
  const [data, setData] = useState<{ pick: Pick; link: PickLink } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    getPick(id, token).then(
      (d) => live && setData(d),
      (err) => live && setError(err instanceof Error ? err.message : 'Could not load your pick.'),
    );
    return () => {
      live = false;
    };
  }, [id, token]);
  if (!data) return error ? <p className={styles.error}>{error}</p> : <p className={styles.muted}>Loading your pick…</p>;
  const { pick, link } = data;
  const a = pick.shipping;
  return (
    <>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{link.partner?.name}</span>
        <h1 className={styles.title}>{link.name}</h1>
        <p className={styles.phase}>{STATE[link.fulfil]}</p>
      </header>
      <section className={styles.order} aria-label="Your pick">
        <div className={styles.orderHead}>
          <span className={styles.orderNumber}>PICK #{pick.number}</span>
          <strong>Free</strong>
        </div>
        <ul className={styles.lines}>
          {pick.lines.map((l) => (
            <li key={`${l.itemId}-${l.size}`}>
              <span>
                {l.qty} × {l.name}
                {l.size ? ` (${l.size})` : ''}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.money}>
          {a ? `Ships to ${[a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`].filter(Boolean).join(', ')}` : `Handed out by ${link.partner?.name ?? 'your organizer'}.`}
        </p>
        <p className={styles.meta}>
          {pick.name} · {pick.email}
        </p>
      </section>
      <p className={styles.note}>Save this page’s link: it’s the only way back to your pick.</p>
    </>
  );
}
