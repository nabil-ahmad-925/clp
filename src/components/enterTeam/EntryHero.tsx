import type { EntryTerms } from '@/content/teamEntry';
import { dayRange, shortDay } from './format';
import s from './enterTeam.module.css';

/** The sand band: what this is, when and where, and that applying isn't buying. */
export default function EntryHero({ terms, host }: { terms: EntryTerms; host?: string }) {
  const line = [dayRange(terms.startDate, terms.endDate), terms.venue || host, terms.closesOn && `${terms.late ? 'entries closed' : 'entries close'} ${shortDay(terms.closesOn)}`].filter(Boolean).join(' · ');
  return (
    <>
      <div className={s.headerSpace} aria-hidden />
      <div className={s.band} data-header-tone="dark">
        <div className={s.bandInner}>
          <div>
            <div className={s.eyebrow}>{terms.format === 'league' ? 'League' : 'Tournament'} · Enter a Team</div>
            <h1 className={s.title}>{terms.name}</h1>
            {line && <div className={s.line}>{line}</div>}
          </div>
          <div className={s.notice}>{terms.late ? `The last entry date has passed. You can still apply, and your team goes on the waitlist. ${terms.organizerName} offers a spot if one opens.` : `This is an application, not a purchase. ${terms.organizerName} reviews it. Nothing is charged unless your team is accepted.`}</div>
        </div>
      </div>
    </>
  );
}
