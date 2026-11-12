import type { BulkRequest } from '@/content/bulk';
import { budgetWords, findingIt } from '@/content/sourcing';
import FindingSteps from './FindingSteps';
import f from './findIt.module.css';

const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/** On a "Can't Find It?" request in Quote Requests, until our quote: "Finding it for you", its 3 steps and our reply's day. */
export default function RequestFinding({ r }: { r: BulkRequest }) {
  if (!findingIt(r)) return null;
  const s = r.sourcing!;
  return (
    <div className={f.finding}>
      <strong>FINDING IT FOR YOU</strong>
      <FindingSteps steps={s.steps} />
      <p className={f.note}>
        {s.searching ? 'We need a little more time to find the right match. ' : s.steps[1]?.done ? 'We found options and a specialist is confirming the price and timing. ' : 'We’re searching our makers, suppliers and the web. '}
        Expect our reply by {when(s.replyBy)}.{budgetWords(s) ? ` Your budget: ${budgetWords(s)}.` : ''}
      </p>
    </div>
  );
}
