'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { enterTeamHref } from '@/content/teamEntry';
import modal from '../BookingModal.module.css';
import s from './DetailsFooter.module.css';
import { useTeamsOpen } from './useTeamsOpen';

type Who = 'team' | 'individual';
type Props = {
  widgetId: number;
  listingId: string;
  bookLabel: string;
  hint: string;
  /** A tournament or league: an individual is one person. */
  onePerson: boolean;
  onBook: () => void;
};

/**
 * The foot of Book Now's details: Book Now, or (Camps & Tournaments, Leagues & Social Clubs) first who's entering. A team
 * applies on its own page (Enter A Team) once the organizer has set up its divisions; an individual books here.
 */
export default function DetailsFooter({ widgetId, listingId, bookLabel, hint, onePerson, onBook }: Props) {
  const router = useRouter();
  const [who, setWho] = useState<Who | null>(null);
  const { teams, terms } = useTeamsOpen(widgetId, listingId);
  if (teams === 'none') {
    return (
      <div className={modal.footer}>
        <button type="button" className={modal.primary} onClick={onBook}>
          {bookLabel}
        </button>
        <span className={modal.hint}>{hint}</span>
      </div>
    );
  }
  // Team is always offered here; until the organizer adds its divisions, it says so and can't be chosen.
  const teamClosed = teams === 'notSetUp';
  // With a tournament set up, one person enters what the organizer turned on: the free-agent pool or individual events.
  const ownEntry = Boolean(terms?.freeAgents) || (terms?.individualEvents?.length ?? 0) > 0;
  const noIndividuals = Boolean(terms) && !ownEntry;
  const options: [Who, string, string][] = [
    ['team', 'Team', teams === 'checking' ? 'Checking team entries…' : teams === 'inviteOnly' ? 'By invitation only. Use the link from your invite.' : teamClosed ? 'Team entries aren’t open yet. The organizer adds the divisions first.' : 'Enter a team. The organizer reviews it, nothing is charged until approved.'],
    ['individual', 'Individual', noIndividuals ? 'This one takes teams only.' : ownEntry ? 'Join as a free agent, or enter an individual event.' : onePerson ? 'One person, yourself or your child.' : 'Book a spot for yourself or your family.'],
  ];
  const go = () => (who === 'team' ? router.push(enterTeamHref(widgetId, listingId)) : ownEntry ? router.push(`${enterTeamHref(widgetId, listingId)}&as=individual`) : onBook());
  return (
    <div className={modal.footer}>
      <span className={s.label} id="entry-who">
        Who&rsquo;s Entering?
      </span>
      <div className={s.choices} role="radiogroup" aria-labelledby="entry-who">
        {options.map(([id, title, line]) => (
          <button key={id} type="button" role="radio" aria-checked={who === id} disabled={(id === 'team' && teams !== 'open') || (id === 'individual' && noIndividuals)} className={s.choice} onClick={() => setWho(id)}>
            <span className={s.dot} aria-hidden />
            <span>
              <strong>{title}</strong>
              <span className={s.line}>{line}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className={modal.primary} disabled={!who} onClick={go}>
        {who === 'team' ? 'Enter a Team' : who === 'individual' ? bookLabel : 'Book Now'}
      </button>
      <span className={modal.hint}>{who === 'team' ? 'Each division shows its price. Nothing is charged until approved.' : hint}</span>
      {terms && !terms.inviteOnly && (
        <Link className={modal.hint} href={`/tournament/?widget=${widgetId}&listing=${encodeURIComponent(listingId)}`}>
          See Teams And Schedule
        </Link>
      )}
    </div>
  );
}
