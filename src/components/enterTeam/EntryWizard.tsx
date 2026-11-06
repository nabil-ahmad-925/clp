'use client';

import { useEffect, useRef } from 'react';
import type { PartnerUser } from '@/content/partnerSession';
import type { ClubTeam, EntryTerms } from '@/content/teamEntry';
import DivisionStep from './DivisionStep';
import DocumentsStep from './DocumentsStep';
import EntryDone from './EntryDone';
import EntrySummary from './EntrySummary';
import { STEPS } from './entryRules';
import PaymentStep from './PaymentStep';
import ReviewStep from './ReviewStep';
import RosterStep from './RosterStep';
import StepNav from './StepNav';
import type { ClubData } from './useEntryData';
import { useEntryDraft } from './useEntryDraft';
import s from './enterTeam.module.css';

type Props = { widgetId: string; listingId: string; terms: EntryTerms; club: ClubData | null | undefined; user: PartnerUser | null; invite?: string; keepTeam: (team: ClubTeam) => void; signInHref: string };

/** The five steps beside "Your application", then the sent screen. */
export default function EntryWizard({ widgetId, listingId, terms, club, user, keepTeam, signInHref, invite }: Props) {
  // A partner's teams still loading count as theirs (none yet), so the form doesn't flip to a typed team and back.
  const entry = useEntryDraft({ widgetId, listingId, terms, teams: club === undefined ? [] : (club?.teams ?? null), user, invite });
  const top = useRef<HTMLDivElement>(null);
  const last = entry.step === STEPS.length - 1;
  // Each step starts at the top of the steps.
  useEffect(() => {
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ block: 'start' });
  }, [entry.step, entry.sent]);

  if (entry.sent) {
    return (
      <div className={s.wrap} ref={top}>
        <EntryDone sent={entry.sent} organizer={terms.organizerName} club={entry.club} />
      </div>
    );
  }
  return (
    <div className={s.wrap} ref={top}>
      <StepNav step={entry.step} reached={entry.reached} onGo={entry.goTo} />
      <div className={s.layout}>
        <section className={s.main} aria-label="Step content">
          {entry.step === 0 && <DivisionStep terms={terms} entry={entry} />}
          {entry.step === 1 && <RosterStep entry={entry} club={club} keepTeam={keepTeam} signInHref={signInHref} most={terms.maxExceptions ?? 2} />}
          {entry.step === 2 && <DocumentsStep entry={entry} club={club} />}
          {entry.step === 3 && <PaymentStep terms={terms} entry={entry} />}
          {entry.step === 4 && <ReviewStep terms={terms} entry={entry} />}
          {entry.error && (
            <p className={s.error} role="alert">
              {entry.error}
            </p>
          )}
          <div className={s.foot}>
            <button type="button" className={s.back} disabled={entry.sending} onClick={entry.step === 0 ? () => window.history.back() : entry.back}>
              Back
            </button>
            {entry.problem && <span className={s.footHint}>{entry.problem}</span>}
            <button type="button" className={s.next} disabled={Boolean(entry.problem) || entry.sending} onClick={last ? entry.submit : entry.next}>
              {last ? (entry.sending ? 'Sending…' : 'Submit Application') : 'Continue'}
            </button>
          </div>
        </section>
        <EntrySummary terms={terms} entry={entry} />
      </div>
    </div>
  );
}
