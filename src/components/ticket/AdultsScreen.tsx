import styles from './ticket.module.css';
import { Back, PoweredBy, type ScreenProps } from './parts';

/**
 * Approved adults (design board 8): who may drop off and pick up the kids on this booking. Today that's the person who
 * booked. Adding more (with a face photo the host checks) needs approved adults on bookings, which the bookings API
 * doesn't have yet, so the form is shown but can't be sent.
 */
export default function AdultsScreen({ ticket: t, href }: ScreenProps) {
  return (
    <>
      <main className={styles.body}>
        <Back href={href('ticket')} label="Ticket" />
        <h1 className={styles.title}>Who Can Drop Off And Pick Up</h1>
        <p className={styles.muted}>The host checks every adult before they can take a child. Anyone else is turned away and you’re contacted.</p>
        <section className={`${styles.card} ${styles.row}`}>
          <span>
            <strong>{t.name}</strong>
            <br />
            <span className={styles.muted}>Booked for them</span>
          </span>
          <span className={styles.pill}>Approved</span>
        </section>
        <form className={styles.card} onSubmit={(e) => e.preventDefault()} aria-describedby="adults-soon">
          <strong>Add An Adult</strong>
          <span className={styles.muted}>Name, relationship, mobile and a clear face photo. The host reviews them before their first pick-up.</span>
          <label className={styles.field}>Name<input disabled /></label>
          <label className={styles.field}>Relationship<input disabled placeholder="Aunt, grandparent, carpool" /></label>
          <label className={styles.field}>Mobile<input disabled inputMode="tel" /></label>
          <p id="adults-soon" className={styles.note}>Adding adults opens soon. Until then, only {t.name} can pick up.</p>
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled>Add And Send For Review</button>
        </form>
      </main>
      <PoweredBy />
    </>
  );
}
