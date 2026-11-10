import { SAFETY_EMAIL } from '@/content/expectations';
import rows from './rows.module.css';

const REPORT_HREF = `mailto:${SAFETY_EMAIL}?subject=${encodeURIComponent('Report a concern')}&body=${encodeURIComponent(
  'What happened, where and when (add photos if you have them):\n\n\nYou can leave your name out to stay anonymous.',
)}`;

/** Report a Concern (opens an e-mail to CLP Trust & Safety) and the "Call 911 first" note. */
export default function SafetyActions() {
  return (
    <div className={rows.safety}>
      <a className={rows.report} href={REPORT_HREF}>
        Report a Concern
      </a>
      <span className={rows.danger}>Someone in danger? Call 911 first.</span>
    </div>
  );
}
