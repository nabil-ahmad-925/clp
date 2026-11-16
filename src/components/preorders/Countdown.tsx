'use client';

import { useEffect, useState } from 'react';
import styles from './Preorder.module.css';

const parts = (ms: number) => [
  [Math.floor(ms / 86_400_000), 'days'],
  [Math.floor(ms / 3_600_000) % 24, 'hrs'],
  [Math.floor(ms / 60_000) % 60, 'min'],
  [Math.floor(ms / 1000) % 60, 'sec'],
] as const;

/**
 * The live countdown buyers see while orders are open (or until they open): days, hours, minutes and seconds to `to`.
 * It shows nothing once the time is up (the page then reads the pre-order again and says it's closed).
 */
export default function Countdown({ to, label }: { to: string; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = Date.parse(to) - now;
  if (!(left > 0)) return null;
  return (
    <div className={styles.countdown} role="timer" aria-label={`${label} ${parts(left).map(([n, l]) => `${n} ${l}`).join(' ')}`}>
      <span className={styles.countdownLabel}>{label}</span>
      <span className={styles.countdownParts}>
        {parts(left).map(([n, l]) => (
          <span key={l}>
            <strong>{String(n).padStart(2, '0')}</strong>
            {l}
          </span>
        ))}
      </span>
    </div>
  );
}
