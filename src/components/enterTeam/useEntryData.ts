'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSiteUser } from '@/components/account/useSiteUser';
import { fetchMyPartnerPage, type PartnerUser } from '@/content/partnerSession';
import { fetchClubPeople, fetchClubTeams, fetchEntryListing, fetchEntryTerms, type ClubPerson, type ClubTeam, type EntryListing, type EntryTerms } from '@/content/teamEntry';

/** A CLP Partner (or their teammate) signed in on the site: they enter their own teams. */
export const isPartnerUser = (u: PartnerUser | null) => u?.access?.kind === 'owner' || u?.access?.kind === 'team';

export type ClubData = { teams: ClubTeam[]; people: ClubPerson[]; verified: boolean; name: string };
type State =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'error'; message: string }
  | { status: 'ready'; listing: EntryListing | null; terms: EntryTerms };

/** The partner's teams and what's on file; null when it can't be read (they then type a new team, as anyone). */
async function clubData(): Promise<ClubData | null> {
  try {
    const [teams, people, page] = await Promise.all([fetchClubTeams(), fetchClubPeople().catch(() => []), fetchMyPartnerPage().catch(() => null)]);
    return { teams, people, verified: Boolean(page?.verified), name: page?.name ?? '' };
  } catch {
    return null;
  }
}

/** What the Enter A Team page shows: the listing, what Team applies to, and the signed-in partner's teams. */
export function useEntryData(widgetId: string, listingId: string) {
  const user = useSiteUser();
  const partner = isPartnerUser(user);
  const [state, setState] = useState<State>({ status: 'loading' });
  // undefined while a partner's teams load; null when there are none to show (signed out, or they couldn't load).
  const [club, setClub] = useState<ClubData | null | undefined>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    if (!widgetId || !listingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no listing named in the link
      setState({ status: 'none' });
      return;
    }
    setState({ status: 'loading' });
    Promise.all([fetchEntryTerms(widgetId, listingId), fetchEntryListing(widgetId, listingId).catch(() => null)])
      .then(([terms, listing]) => active && setState(terms ? { status: 'ready', terms, listing } : { status: 'none' }))
      .catch((err: Error) => active && setState({ status: 'error', message: err.message }));
    return () => {
      active = false;
    };
  }, [widgetId, listingId, tick]);

  useEffect(() => {
    let active = true;
    if (!partner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- signed out: nothing of theirs to show
      setClub(null);
      return;
    }
    setClub(undefined);
    clubData().then((c) => active && setClub(c));
    return () => {
      active = false;
    };
  }, [partner]);

  /** A team the partner just created or added a player to, in place. */
  const keepTeam = useCallback((team: ClubTeam) => setClub((c) => (c ? { ...c, teams: [...c.teams.filter((t) => t.id !== team.id), team] } : c)), []);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { state, user, partner, club, keepTeam, reload };
}
