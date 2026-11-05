'use client';

import { useEffect, useState } from 'react';
import { fetchEntryTerms, takesTeams } from '@/content/teamEntry';

/** Whether Book Now offers Team: its category takes teams and the organizer has set up its tournament. */
export function useTeamsOpen(widgetId: number, listingId: string) {
  const takes = takesTeams(widgetId);
  const [setUp, setSetUp] = useState(true);
  useEffect(() => {
    if (!takes) return;
    let active = true;
    // If it can't be read, Team stays offered: its page says what's wrong.
    fetchEntryTerms(String(widgetId), listingId).then(
      (terms) => active && setSetUp(Boolean(terms)),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [takes, widgetId, listingId]);
  return takes && setUp;
}
