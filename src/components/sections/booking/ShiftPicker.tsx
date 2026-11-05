'use client';

import type { VolunteerShift } from '@/content/volunteer';
import modal from '../BookingModal.module.css';
import s from './DetailsFooter.module.css';

type Props = { shifts: VolunteerShift[]; chosen: string; onChoose: (id: string) => void };

const clock = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const dayOf = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "Pick a shift": each with its time, role and spots left. A full one can't be picked. */
export default function ShiftPicker({ shifts, chosen, onChoose }: Props) {
  return (
    <div className={modal.section}>
      <span className={modal.label} id="shift-pick">
        Pick A Shift
      </span>
      <div className={s.shifts} role="radiogroup" aria-labelledby="shift-pick">
        {shifts.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={chosen === x.id} disabled={x.left <= 0} className={s.choice} onClick={() => onChoose(x.id)}>
            <span className={s.dot} aria-hidden />
            <span>
              <strong>{x.title}</strong>
              <span className={s.line}>
                {dayOf(x.date)} · {clock(x.startTime)} to {clock(x.endTime)} · {x.place}
              </span>
              <span className={s.line}>{x.left > 0 ? `${x.left} ${x.left === 1 ? 'spot' : 'spots'} left` : 'Full'}{x.youthFacing ? ' · Works with young players, background check needed' : ''}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
