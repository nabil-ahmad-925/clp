import f from './findIt.module.css';

/** Before they send it: what happens next (the same 3 steps the API sends back once it's in). */
export const FIND_STEPS = [
  { label: 'We check our catalog', done: false },
  { label: 'We search our makers, suppliers and the web', done: false },
  { label: 'A specialist confirms the price and timing', done: false },
];

/** The 3 steps of finding it, numbered, the done ones ticked. */
export default function FindingSteps({ steps }: { steps: { label: string; done: boolean }[] }) {
  return (
    <ol className={f.steps}>
      {steps.map((s, i) => (
        <li key={s.label} className={f.step} data-done={s.done}>
          <span className={f.dot} role="img" aria-label={s.done ? 'Done' : 'Not yet'}>
            {s.done ? '✓' : ''}
          </span>
          <span>
            {i + 1}. {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
