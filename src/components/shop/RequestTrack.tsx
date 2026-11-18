import { CLIENT_STEPS, type StepState } from '@/content/requestStatus';
import w from './wholesale.module.css';

/**
 * A request's tracker on Quote Requests (content/requestStatus.ts trackOf): the steps done are full, the steps it's at
 * now are half lit (Files and Payment can both be), the rest are to come.
 */
export default function RequestTrack({ steps }: { steps: StepState[] }) {
  return (
    <div className={w.reqTrack}>
      {CLIENT_STEPS.map((label, i) => (
        <span key={label} data-on={steps[i] === 'done'} data-now={steps[i] === 'now'}>
          <i />
          {label}
        </span>
      ))}
    </div>
  );
}
