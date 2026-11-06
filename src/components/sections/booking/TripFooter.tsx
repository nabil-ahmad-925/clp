import type { TripPlan } from '@/content/trip';
import styles from '../BookingModal.module.css';

const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;

/** The foot of a trip's details: Reserve, the waitlist when it's full, or why it's closed. */
export default function TripFooter({ plan, onReserve }: { plan: TripPlan; onReserve: () => void }) {
  if (plan.closed) {
    return (
      <div className={styles.footer}>
        <span className={styles.hint}>{plan.closed}</span>
      </div>
    );
  }
  const full = plan.left === 0;
  return (
    <div className={styles.footer}>
      <button type="button" className={styles.primary} onClick={onReserve}>
        {full ? 'Join The Waitlist' : `Reserve A Spot · ${dollars(plan.deposit)} Deposit`}
      </button>
      <span className={styles.hint}>{full ? 'It’s full. You’re emailed if a spot opens up.' : `${plan.left} ${plan.left === 1 ? 'spot' : 'spots'} left. Nothing is charged here: ${plan.organizerName} emails you how to pay.`}</span>
    </div>
  );
}
