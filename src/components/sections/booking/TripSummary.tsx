import { tripWords, type TripPlan } from '@/content/trip';
import styles from '../BookingModal.module.css';

const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;
const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** What a trip's details add: how it's paid, the days, and what each person needs. */
export default function TripSummary({ plan }: { plan: TripPlan }) {
  return (
    <>
      <div className={styles.section}>
        <span className={styles.kicker}>PAYMENT PLAN</span>
        <ul className={styles.bring}>
          <li>
            {dollars(plan.deposit)} deposit holds your spot, due {plan.depositDays} days after you reserve
          </li>
          {plan.installments.map((x) => (
            <li key={x.dueDate}>
              {dollars(x.amount)} by {day(x.dueDate)}
            </li>
          ))}
          <li>{dollars(plan.total)} in total</li>
        </ul>
      </div>
      {plan.itinerary.length > 0 && (
        <div className={styles.section}>
          <span className={styles.kicker}>{tripWords(plan.style).plan}</span>
          <ul className={styles.bring}>
            {plan.itinerary.map((d, i) => (
              <li key={`${d.title}-${i}`}>{[d.date && day(d.date), d.title, d.place].filter(Boolean).join(' · ')}</li>
            ))}
          </ul>
        </div>
      )}
      {plan.included.length > 0 && (
        <div className={styles.section}>
          <span className={styles.kicker}>WHAT&rsquo;S INCLUDED</span>
          <ul className={styles.bring}>
            {plan.included.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {plan.notIncluded.length > 0 && (
        <div className={styles.section}>
          <span className={styles.kicker}>NOT INCLUDED</span>
          <ul className={styles.bring}>
            {plan.notIncluded.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {plan.meetingPoint && (
        <div className={styles.section}>
          <span className={styles.kicker}>MEETING POINT</span>
          <span>{plan.meetingPoint}</span>
        </div>
      )}
      {plan.documents.length > 0 && (
        <div className={styles.section}>
          <span className={styles.kicker}>WHAT YOU&rsquo;LL NEED</span>
          <ul className={styles.bring}>
            {plan.documents.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
