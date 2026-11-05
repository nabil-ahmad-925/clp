import { isMinor, type PlayerDraft } from './entryRules';
import s from './steps.module.css';

type Props = { value: PlayerDraft; onChange: (p: PlayerDraft) => void; label: string; onRemove?: () => void };

/** One player's details: name, birth year and number, and a parent or guardian once they're under 18. */
export default function PlayerFields({ value, onChange, label, onRemove }: Props) {
  const set = (key: keyof PlayerDraft, v: string) => onChange({ ...value, [key]: v });
  const born = Number(value.born);
  const minor = /^\d{4}$/.test(value.born) && isMinor(born);
  return (
    <div className={s.panel} role="group" aria-label={label}>
      <div className={s.headRow}>
        <span className={s.label}>{label}</span>
        {onRemove && (
          <button type="button" className={s.small} onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <div className={s.playerFields}>
        <label className={s.field}>
          Full name
          <input className={s.input} maxLength={120} autoComplete="off" value={value.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className={s.field}>
          Birth year
          <input className={s.input} inputMode="numeric" maxLength={4} placeholder="2014" value={value.born} onChange={(e) => set('born', e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className={s.field}>
          Number (optional)
          <input className={s.input} maxLength={6} value={value.number} onChange={(e) => set('number', e.target.value)} />
        </label>
        <label className={s.field}>
          Parent or guardian{minor ? '' : ' (optional)'}
          <input className={s.input} maxLength={120} value={value.guardian} onChange={(e) => set('guardian', e.target.value)} />
        </label>
        <label className={`${s.field} ${s.span2}`}>
          Guardian&rsquo;s e-mail (optional)
          <input className={s.input} type="email" maxLength={200} value={value.guardianEmail} onChange={(e) => set('guardianEmail', e.target.value)} />
        </label>
      </div>
    </div>
  );
}
