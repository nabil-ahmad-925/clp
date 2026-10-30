import Link from 'next/link';
import type { PublicPreorder } from '@/content/preorders';
import { phaseLine, progressOf } from './preorderMath';
import styles from './Preorder.module.css';

const eventLine = (p: PublicPreorder) =>
  [p.event, p.eventDate && new Date(`${p.eventDate}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })].filter(Boolean).join(' · ');

/** The top of a pre-order: whose it is, where it stands and how close it is to being made. */
export default function PreorderHero({ preorder: p }: { preorder: PublicPreorder }) {
  const left = Math.max(0, p.minPieces - p.pieces);
  return (
    <header className={styles.hero}>
      <span className={styles.eyebrow}>
        Pre-order by{' '}
        {p.partner.slug ? <Link href={`/partner/?p=${encodeURIComponent(p.partner.slug)}`}>{p.partner.name}</Link> : p.partner.name}
      </span>
      <h1 className={styles.title}>{p.name}</h1>
      <p className={styles.phase}>{phaseLine(p)}</p>
      {eventLine(p) && <p className={styles.meta}>Handed out at {eventLine(p)}</p>}
      {(p.phase === 'open' || p.phase === 'scheduled') && (
        <>
          <div className={styles.progress} role="img" aria-label={`${p.pieces} of ${p.minPieces} pieces ordered`}>
            <span style={{ width: `${progressOf(p) * 100}%` }} />
          </div>
          <p className={styles.meta}>
            {p.pieces} of {p.minPieces} pieces ordered. {left > 0 ? `It’s made once ${p.minPieces} are ordered, so share it!` : 'It will be made. You can still order until it closes.'}
          </p>
        </>
      )}
    </header>
  );
}
