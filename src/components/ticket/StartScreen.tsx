import Link from 'next/link';
import styles from './ticket.module.css';
import { PoweredBy, clock, dayLine, firstName, type ScreenProps } from './parts';

/** Start (design board 8): today's session, "We're here" when the field code is on, and where to go. */
export default function StartScreen({ ticket: t, href }: ScreenProps) {
  const here = Boolean(t.checkedInAt);
  return (
    <>
      <main className={styles.body}>
        <section className={styles.hero}>
          {t.listingSubtitle && <span className={styles.eyebrow}>{t.listingSubtitle}</span>}
          <h1 className={styles.title}>{t.listingTitle}</h1>
          <span className={styles.muted}>{[dayLine(t.date), clock(t.startTime)].filter(Boolean).join(' · ')}{t.address ? ` · ${t.address}` : ''}</span>
        </section>
        {t.status !== 'confirmed' ? (
          <p className={styles.error}>This booking is {t.status}. There’s nothing to check in.</p>
        ) : here ? (
          <Link href={href('ticket')} className={`${styles.btn} ${styles.primary}`}>You’re Checked In · See Your Ticket</Link>
        ) : t.selfCheckIn ? (
          <Link href={href('code')} className={`${styles.btn} ${styles.primary}`}>We’re Here · Check {firstName(t.name)} In</Link>
        ) : (
          <Link href={href('ticket')} className={`${styles.btn} ${styles.primary}`}>Show My Ticket</Link>
        )}
        {t.checkInInstructions && <p className={styles.note}>{t.checkInInstructions}</p>}
        <Link href={href('updates')} className={`${styles.card} ${styles.row}`}>
          <strong>Updates &amp; Messages</strong>
          <span className={styles.pill}>Open ›</span>
        </Link>
        <Link href={href('next')} className={`${styles.card} ${styles.row}`}>
          <strong>Coming Up</strong>
          <span className={styles.pill}>See All →</span>
        </Link>
      </main>
      <PoweredBy />
    </>
  );
}
