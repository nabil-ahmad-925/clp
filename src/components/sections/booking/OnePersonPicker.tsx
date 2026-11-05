'use client';

import type { AgePolicy } from '@/content/listings';
import s from './DetailsFooter.module.css';
import modal from '../BookingModal.module.css';

type Props = { policy: AgePolicy; adult: boolean; onChange: (adult: boolean) => void };

/** An individual entering a tournament or league: one person, an adult or a child where the listing takes both. */
export default function OnePersonPicker({ policy, adult, onChange }: Props) {
  const options: [boolean, string, string][] = [
    [true, policy.kind === 'adult' ? `Adult (${policy.minAge}+)` : 'Adult (18+)', 'You’re entering yourself'],
    [false, 'Child (Under 18)', 'You’re the parent or guardian'],
  ];
  return (
    <>
      <span className={modal.hint}>One person per entry. A group enters as a team.</span>
      {policy.kind === 'all' && (
        <div className={s.choices} role="radiogroup" aria-label="Who’s entering">
          {options.map(([value, title, line]) => (
            <button key={title} type="button" role="radio" aria-checked={adult === value} className={s.choice} onClick={() => onChange(value)}>
              <span className={s.dot} aria-hidden />
              <span>
                <strong>{title}</strong>
                <span className={s.line}>{line}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
