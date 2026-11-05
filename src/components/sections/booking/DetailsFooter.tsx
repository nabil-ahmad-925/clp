'use client';

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
  const teams = useTeamsOpen(widgetId, listingId);
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
  const options: [Who, string, string][] = [
    ['team', 'Team', teams === 'checking' ? 'Checking team entries…' : teamClosed ? 'Team entries aren’t open yet. The organizer adds the divisions first.' : 'Enter a team. The organizer reviews it, nothing is charged until approved.'],
    ['individual', 'Individual', onePerson ? 'One person, yourself or your child.' : 'Book a spot for yourself or your family.'],
  ];
  const go = () => (who === 'team' ? router.push(enterTeamHref(widgetId, listingId)) : onBook());
  return (
    <div className={modal.footer}>
      <span className={s.label} id="entry-who">
        Who&rsquo;s Entering?
      </span>
      <div className={s.choices} role="radiogroup" aria-labelledby="entry-who">
        {options.map(([id, title, line]) => (
          <button key={id} type="button" role="radio" aria-checked={who === id} disabled={id === 'team' && teams !== 'open'} className={s.choice} onClick={() => setWho(id)}>
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
    </div>
  );
}
