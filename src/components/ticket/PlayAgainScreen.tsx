import Link from 'next/link';
import styles from './ticket.module.css';
import { Back, PoweredBy, type ScreenProps } from './parts';

/**
 * Play again (design board 8): what's coming up from the same host, joined in one tap with the saved details. The
 * booking doesn't say which host's sessions follow it yet, so this points to every session on CLP until it does.
 */
export default function PlayAgainScreen({ ticket: t, href }: ScreenProps) {
  return (
    <>
      <main className={styles.body}>
        <Back href={href(t.checkedInAt ? 'ticket' : 'start')} label="Back" />
        <h1 className={styles.title}>Play Again</h1>
        <p className={styles.muted}>Loved {t.listingTitle}? Find the next session, clinic or camp near you.</p>
        <p className={styles.note}>Soon this shows what’s next from the same host, ready to join in one tap with your saved details and waiver.</p>
        <Link href="/experiences/" className={`${styles.btn} ${styles.primary}`}>Browse What’s Coming Up</Link>
      </main>
      <PoweredBy />
    </>
  );
}
