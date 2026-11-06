import type { ServicePlan } from '@/content/service';
import styles from '../BookingModal.module.css';

export type Slot = { date: string; time: string; classId?: string; sessionId?: string };
type Props = { plan: Extract<ServicePlan, { kind: 'session' | 'group' }>; value: Slot | null; onChange: (slot: Slot) => void };

const dayParts = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  return { dow: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) };
};
export const clockOf = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/**
 * Pick when: a 1:1's day, then one of its open times (the coach's Availability, as the API answers it); a small group's
 * session, with the seats left. Only what can be booked is offered.
 */
export default function ServiceSlotPicker({ plan, value, onChange }: Props) {
  if (plan.kind === 'group') {
    return (
      <div className={styles.section}>
        <span className={styles.label}>Pick a Session</span>
        <div className={styles.days} role="radiogroup" aria-label="Session">
          {plan.sessions.map((s) => {
            const p = dayParts(s.date);
            const on = value?.sessionId === s.sessionId;
            return (
              <button key={s.sessionId} type="button" role="radio" aria-checked={on} className={`${styles.day} ${on ? styles.dayOn : ''}`} onClick={() => onChange({ date: s.date, time: s.time, classId: s.classId, sessionId: s.sessionId })}>
                <span className={styles.dow}>{p.dow}</span>
                <span>{p.label}</span>
                <span className={styles.dayLeft}>{clockOf(s.time)} · {s.left} left</span>
              </button>
            );
          })}
        </div>
        {plan.sessions.some((s) => s.minAge) && <span className={styles.hint}>Ages {plan.sessions.find((s) => s.minAge)?.minAge}+.</span>}
      </div>
    );
  }
  const day = plan.days.find((d) => d.date === value?.date) ?? plan.days[0];
  return (
    <>
      <div className={styles.section}>
        <span className={styles.label}>Pick a Day</span>
        <div className={styles.days} role="radiogroup" aria-label="Day">
          {plan.days.map((d) => {
            const p = dayParts(d.date);
            const on = day?.date === d.date;
            return (
              <button key={d.date} type="button" role="radio" aria-checked={on} className={`${styles.day} ${on ? styles.dayOn : ''}`} onClick={() => onChange({ date: d.date, time: d.times.includes(value?.time ?? '') ? value!.time : '' })}>
                <span className={styles.dow}>{p.dow}</span>
                <span>{p.label}</span>
                <span className={styles.dayLeft}>{d.times.length} {d.times.length === 1 ? 'time' : 'times'}</span>
              </button>
            );
          })}
        </div>
      </div>
      {day && (
        <div className={styles.section}>
          <span className={styles.label}>Pick a Time</span>
          <div className={styles.days} role="radiogroup" aria-label="Time">
            {day.times.map((t) => {
              const on = value?.date === day.date && value.time === t;
              return (
                <button key={t} type="button" role="radio" aria-checked={on} className={`${styles.day} ${on ? styles.dayOn : ''}`} onClick={() => onChange({ date: day.date, time: t })}>
                  <span>{clockOf(t)}</span>
                </button>
              );
            })}
          </div>
          <span className={styles.hint}>
            {plan.minutes} minutes{plan.online ? ', online: the call link comes with your confirmation' : ''}.
          </span>
        </div>
      )}
    </>
  );
}
