'use client';

import { useEffect, useState } from 'react';
import { fetchEntryTerms, takesTeams } from '@/content/teamEntry';

/**
 * Whether Book Now offers Team, and whether a team can enter yet. Camps & Tournaments and Leagues & Social Clubs always
 * show Team; it's open once the organizer has set up the listing's tournament (its divisions and entry dates).
 * `checking` until that's known; if it can't be read, Team stays open and its page says what's wrong.
 */
export type TeamEntry = 'none' | 'checking' | 'open' | 'notSetUp';

export function useTeamsOpen(widgetId: number, listingId: string): TeamEntry {
  const takes = takesTeams(widgetId);
  const [state, setState] = useState<{ key: string; open: boolean } | null>(null);
  const key = `${widgetId}/${listingId}`;
  useEffect(() => {
    if (!takes) return;
    let active = true;
    fetchEntryTerms(String(widgetId), listingId).then(
      (terms) => active && setState({ key, open: Boolean(terms) }),
      () => active && setState({ key, open: true }),
    );
    return () => {
      active = false;
    };
  }, [takes, widgetId, listingId, key]);
  if (!takes) return 'none';
  if (state?.key !== key) return 'checking';
  return state.open ? 'open' : 'notSetUp';
}
