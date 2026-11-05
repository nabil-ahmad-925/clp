import { STEPS } from './entryRules';
import s from './enterTeam.module.css';

/** The five steps across the top: done ones go back to themselves, later ones wait for Continue. */
export default function StepNav({ step, reached, onGo }: { step: number; reached: number; onGo: (n: number) => void }) {
  return (
    <ol className={s.steps} aria-label="Steps">
      {STEPS.map((label, i) => {
        const state = i === step ? 'now' : i <= reached ? 'done' : 'later';
        return (
          <li key={label}>
            <button type="button" className={s.stepButton} data-state={state} aria-current={i === step ? 'step' : undefined} disabled={state === 'later'} onClick={() => onGo(i)}>
              <span className={s.stepNum}>
                Step {i + 1}
                {state === 'done' ? ' ✓' : ''}
              </span>
              <span className={s.stepLabel}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
