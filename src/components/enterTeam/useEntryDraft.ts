'use client';

import { useState } from 'react';
import type { PartnerUser } from '@/content/partnerSession';
import { applyClubTeam, applyNewTeam, type ClubTeam, type EntryTerms, type SentApplication } from '@/content/teamEntry';
import { STEPS, blankPlayer, clubRoster, coachList, stepProblem, typedPlayer, typedRows, type Draft } from './entryRules';

type Args = { widgetId: string; listingId: string; terms: EntryTerms; teams: ClubTeam[] | null; user: PartnerUser | null };

const firstDraft = (terms: EntryTerms, user: PartnerUser | null): Draft => ({
  // One division: nothing to pick.
  divisionId: terms.divisions.length === 1 ? terms.divisions[0].id : '',
  teamId: '',
  leftOut: [],
  teamName: '',
  coaches: '',
  players: [blankPlayer('p1'), blankPlayer('p2')],
  insurance: '',
  paysBy: 'club',
  contact: { name: user?.name ?? '', email: user?.email ?? '', phone: '' },
  notes: '',
  agreed: false,
  website: '',
});

/** The five steps' answers, how far they've got, and sending the application (the partner's own team, or a new one). */
export function useEntryDraft({ widgetId, listingId, terms, teams, user }: Args) {
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => firstDraft(terms, user));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<SentApplication | null>(null);

  const club = teams !== null;
  const division = terms.divisions.find((d) => d.id === draft.divisionId);
  const team = teams?.find((t) => t.id === draft.teamId);
  const roster = clubRoster(team?.players ?? [], draft.leftOut, division);
  const playerCount = club ? roster.going.length : typedRows(draft).length;
  const teamName = club ? (team?.name ?? '') : draft.teamName.trim();
  const problem = stepProblem(step, draft, { division, club, goingCount: roster.going.length });

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError('');
  };
  const goTo = (n: number) => {
    if (n <= reached) setStep(n);
  };
  const back = () => setStep((n) => Math.max(0, n - 1));
  const next = () => {
    if (problem || step >= STEPS.length - 1) return;
    setStep(step + 1);
    setReached((r) => Math.max(r, step + 1));
  };

  const submit = async () => {
    if (problem || sending || !division) return;
    setSending(true);
    setError('');
    try {
      const shared = { tournamentId: terms.tournamentId, divisionId: division.id, paysBy: draft.paysBy, insurance: draft.insurance.trim() || undefined };
      setSent(
        club
          ? await applyClubTeam({ ...shared, listing: { widgetId, id: listingId }, teamId: draft.teamId, leaveOut: draft.leftOut })
          : await applyNewTeam({
              ...shared,
              widgetId,
              listingId,
              teamName: draft.teamName.trim(),
              coaches: coachList(draft.coaches),
              players: typedRows(draft).map(typedPlayer),
              contact: { name: draft.contact.name.trim(), email: draft.contact.email.trim(), phone: draft.contact.phone.trim() || undefined },
              notes: draft.notes.trim() || undefined,
              agreed: draft.agreed,
              website: draft.website,
            }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your application. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return { step, reached, draft, update, goTo, back, next, submit, sending, error, sent, club, division, team, roster, playerCount, teamName, problem };
}

export type EntryDraftState = ReturnType<typeof useEntryDraft>;
