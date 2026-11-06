import type { ServicePlan } from '@/content/service';
import styles from '../BookingModal.module.css';

const dollars = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** What a service's button does, or why nothing can be booked now. */
function footerOf(plan: ServicePlan) {
  const cancel = `Free to change or cancel until ${plan.freeCancelHours} hours before.`;
  if (plan.kind === 'pack') return { label: `Reserve This Pack · ${dollars(plan.price)}`, hint: `${plan.sessions} sessions to use within ${plan.validMonths} months. Nothing is charged here: ${plan.providerName} gets in touch about paying.` };
  const paid = plan.price ? ` · ${dollars(plan.price)}` : '';
  if (plan.kind === 'group') {
    if (!plan.sessions.length) return { hint: `No sessions are open right now. Check back soon, or contact ${plan.providerName}.` };
    return { label: `Book A Seat${paid}`, hint: `${cancel} ${plan.price ? `Paid to ${plan.providerName} on the day.` : 'It’s free.'}` };
  }
  if (plan.closed) return { hint: plan.closed };
  if (!plan.days.length) return { hint: `No open times in the next ${plan.aheadWeeks} ${plan.aheadWeeks === 1 ? 'week' : 'weeks'}. Check back soon, or contact ${plan.providerName}.` };
  return { label: plan.price ? `Book A Time${paid}` : 'Book A Free Session', hint: `${cancel} ${plan.price ? `Paid to ${plan.providerName} on the day.` : 'It’s free.'}` };
}

/** The foot of a coach's service's details: book a time, a seat or the pack, or why it can't be booked now. */
export default function ServiceFooter({ plan, onBook }: { plan: ServicePlan; onBook: () => void }) {
  const { label, hint } = footerOf(plan);
  return (
    <div className={styles.footer}>
      {label && (
        <button type="button" className={styles.primary} onClick={onBook}>
          {label}
        </button>
      )}
      <span className={styles.hint}>{hint}</span>
    </div>
  );
}
