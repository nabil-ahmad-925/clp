import Link from 'next/link';
import { repliesOf, seenReplies } from '@/content/ticket';
import styles from './ticket.module.css';
import { Back, PoweredBy, clock, firstName, timeOf, type ScreenProps } from './parts';
import SignCard from './SignCard';

function Status({ t }: { t: ScreenProps['ticket'] }) {
  const out = Boolean(t.checkedOutAt);
  const here = Boolean(t.checkedInAt);
  const [title, sub] = out
    ? ['Picked up', `Left with ${t.name} at ${timeOf(t.checkedOutAt)}`]
    : here
      ? ['You’re checked in', `${t.checkedInAt && `Since ${timeOf(t.checkedInAt)}`}${t.startTime ? ` · starts ${clock(t.startTime)}` : ''}`]
      : ['Not checked in yet', 'Use the field code or show this ticket to the host'];
  return (
    <div className={`${styles.status} ${out ? styles.statusOut : here ? styles.statusIn : ''}`} role="status">
      <span className={styles.statusDot} aria-hidden="true">{here ? '✓' : '·'}</span>
      <span>
        <strong>{title}</strong>
        {sub}
      </span>
    </div>
  );
}

/** Ticket (design board 8): where they stand, the QR the host scans, who drops off and picks up, and updates. */
export default function TicketScreen(props: ScreenProps) {
  const { ticket: t, id, href } = props;
  const unread = Math.max(0, repliesOf(t) - seenReplies(id));
  return (
    <>
      <main className={styles.body}>
        <Back href={href('start')} label={t.listingTitle} />
        <Status t={t} />
        {t.needsSigning && <SignCard {...props} />}
        {t.ticket && !t.checkedOutAt && (
          <section className={styles.card}>
            <span className={styles.eyebrow}>Your ticket</span>
            <svg className={styles.qr} viewBox={`0 0 ${t.ticket.qr.size} ${t.ticket.qr.size}`} role="img" aria-label={`Ticket QR code ${t.ticket.code}`} shapeRendering="crispEdges">
              <path d={t.ticket.qr.path} fill="#111" />
            </svg>
            <span className={styles.muted}>Show this at check-in, or the host finds you by name. Ticket {t.ref}.</span>
          </section>
        )}
        {t.kids > 0 && (
          <section className={styles.card}>
            <span className={styles.eyebrow}>Drop-off and pick-up</span>
            <span><strong>Dropped off:</strong> {t.checkedInAt ? `checked in at ${timeOf(t.checkedInAt)}` : 'not dropped off yet'}</span>
            <span><strong>Can pick up:</strong> {t.name} (booked)</span>
            {t.checkedOutAt && <span><strong>Picked up:</strong> by {t.name} at {timeOf(t.checkedOutAt)}</span>}
            <Link href={href('adults')} className={styles.back}>Manage Approved Adults ›</Link>
          </section>
        )}
        <Link href={href('updates')} className={`${styles.card} ${styles.row}`}>
          <strong>Updates &amp; Messages</strong>
          <span className={`${styles.pill} ${unread ? styles.pillOn : ''}`}>{unread ? `${unread} new` : 'All read'}</span>
        </Link>
        {t.checkedInAt && <Link href={href('next')} className={`${styles.btn} ${styles.gold}`}>Had Fun, {firstName(t.name)}? See What’s Coming Up →</Link>}
      </main>
      <PoweredBy />
    </>
  );
}
