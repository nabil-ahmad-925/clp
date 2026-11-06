import { Warn } from './parts';
import s from './steps.module.css';

type Props = { name: string; born: number; divisionName?: string; most: number; value: string; onChange: (reason: string) => void };

/** An older player: the organizer decides, and the coach asks with a reason. A younger player just plays up. */
export default function ExceptionAsk({ name, born, divisionName, most, value, onChange }: Props) {
  if (most === 0) {
    return (
      <Warn>
        <strong>
          {name} was born in {born}
        </strong>
        , so they&rsquo;re older than {divisionName} allows, and this tournament takes no age exceptions.
      </Warn>
    );
  }
  return (
    <div className={s.panel} role="group" aria-label={`Age exception for ${name}`}>
      <Warn>
        <strong>
          {name} was born in {born}
        </strong>
        , so they&rsquo;re older than {divisionName} allows. The organizer decides. Up to {most} per team.
      </Warn>
      <label className={s.field}>
        Why should they play? (optional)
        <input className={s.input} maxLength={300} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
