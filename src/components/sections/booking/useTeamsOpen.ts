'use client';

import { useEffect, useState } from 'react';
import { fetchEntryTerms, takesTeams, type EntryTerms } from '@/content/teamEntry';

/**
 * Whether Book Now offers Team, and whether a team can enter yet. Camps & Tournaments and Leagues & Social Clubs always
 * show Team; it's open once the organizer has set up the listing's tournament (its divisions and entry dates).
 * `checking` until that's known; if it can't be read, Team stays open and its page says what's wrong.
 */
export type TeamEntry = 'none' | 'checking' | 'open' | 'notSetUp' | 'inviteOnly';

export function useTeamsOpen(widgetId: number, listingId: string): { teams: TeamEntry; terms: EntryTerms | null } {
  const takes = takesTeams(widgetId);
  const [state, setState] = useState<{ key: string; open: boolean; terms: EntryTerms | null } | null>(null);
  const key = `${widgetId}/${listingId}`;
  useEffect(() => {
    if (!takes) return;
    let active = true;
    fetchEntryTerms(String(widgetId), listingId).then(
      (terms) => active && setState({ key, open: Boolean(terms), terms }),
      () => active && setState({ key, open: true, terms: null }),
    );
    return () => {
      active = false;
    };
  }, [takes, widgetId, listingId, key]);
  if (!takes) return { teams: 'none', terms: null };
  if (state?.key !== key) return { teams: 'checking', terms: null };
  if (!state.open) return { teams: 'notSetUp', terms: null };
  return { teams: state.terms?.inviteOnly ? 'inviteOnly' : 'open', terms: state.terms };
}
