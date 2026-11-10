import { APPEAL_LINE, ladder } from '@/content/expectations';
import rows from './rows.module.css';

/** If rules are broken: the four steps, each with its coloured STEP pill, then the 14-day appeal line. */
export default function RulesLadder() {
  return (
    <>
      <ol className={rows.list}>
        {ladder.map((s, i) => (
          <li key={s.t} className={`${rows.point} ${rows.step}`}>
            <span className={rows.stepPill} style={{ background: s.color }}>
              STEP {i + 1}
            </span>
            <span className={rows.stepText}>
              <strong>{s.t}</strong>
              <span>{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className={rows.appeal}>{APPEAL_LINE}</p>
    </>
  );
}
