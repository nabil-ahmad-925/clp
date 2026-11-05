import type { EntryTerms } from '@/content/teamEntry';
import { entryCosts, priceOf } from './entryRules';
import { money, shortDay } from './format';
import type { EntryDraftState } from './useEntryDraft';
import s from './summary.module.css';

/** "Your application": what's been chosen so far and what it comes to. Today is always $0. */
export default function EntrySummary({ terms, entry }: { terms: EntryTerms; entry: EntryDraftState }) {
  const { division, team, roster, playerCount, teamName, club } = entry;
  const price = priceOf(terms, division);
  const costs = entryCosts(price, playerCount);
  const players = club ? (team ? `${roster.going.length} of ${team.players.length}` : '—') : playerCount ? String(playerCount) : '—';
  return (
    <aside className={s.aside} aria-label="Your application">
      <span className={s.kicker}>Your Application</span>
      <div className={s.lines}>
        <div className={s.line}>
          <span>Division</span>
          <strong>{division?.name ?? '—'}</strong>
        </div>
        <div className={s.line}>
          <span>Team</span>
          <strong>{teamName || '—'}</strong>
        </div>
        <div className={s.line}>
          <span>Players</span>
          <strong>{players}</strong>
        </div>
        <div className={s.line}>
          <span>{costs.perPlayer && price.fee > 0 ? `Entry fee (${costs.players} × ${money(costs.each)})` : 'Entry fee'}</span>
          <strong>{costs.fee > 0 ? money(costs.fee) : price.fee > 0 ? '—' : 'Free'}</strong>
        </div>
      </div>
      <div className={s.lines}>
        <div className={s.line}>
          <span>Due if accepted</span>
          <strong>{costs.dueOnAccept > 0 ? `${money(costs.dueOnAccept)}${costs.isDeposit ? ' deposit' : ''}` : '$0'}</strong>
        </div>
        {costs.balance > 0 && (
          <div className={`${s.line} ${s.muted}`}>
            <span>Balance{terms.balanceDue ? ` by ${shortDay(terms.balanceDue)}` : ''}</span>
            <span>{money(costs.balance)}</span>
          </div>
        )}
        <div className={`${s.line} ${s.today}`}>
          <span>Today</span>
          <span>$0</span>
        </div>
      </div>
      <span className={s.note}>Withdraw before acceptance: nothing charged. After acceptance, refunds follow the organizer&rsquo;s policy.</span>
    </aside>
  );
}
