'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { enterTeamHref } from '@/content/teamEntry';
import EntryHero from './EntryHero';
import EntryWizard from './EntryWizard';
import IndividualEntry from './IndividualEntry';
import { useEntryData } from './useEntryData';
import s from './enterTeam.module.css';

/**
 * Enter A Team (/enter-team/?widget=47&listing=<id>; Book Now › Team on a Camps & Tournaments or Leagues & Social
 * Clubs listing). A static export knows the listing only in the browser.
 */
export default function EnterTeamPage() {
  const params = useSearchParams();
  const widgetId = params.get('widget') ?? '';
  const listingId = params.get('listing') ?? '';
  const invite = params.get('invite') ?? undefined;
  const individual = params.get('as') === 'individual';
  const { state, user, club, keepTeam, reload } = useEntryData(widgetId, listingId, invite);
  const signInHref = `/sign-in/?next=${encodeURIComponent(enterTeamHref(widgetId, listingId))}`;

  if (state.status !== 'ready') {
    return (
      <div className={s.page}>
        <div className={s.headerSpace} aria-hidden />
        <div className={s.status} role="status" data-header-tone="dark">
          {state.status === 'loading' && <p>Loading…</p>}
          {state.status === 'none' && (
            <>
              <h1>Teams Can&rsquo;t Apply Here</h1>
              <p>
                This listing doesn&rsquo;t take team applications. <Link href="/">Browse Experiences</Link>
              </p>
            </>
          )}
          {state.status === 'error' && (
            <>
              <h1>Something Went Wrong</h1>
              <p>{state.message}</p>
              <button type="button" className={s.back} onClick={reload}>
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  const { terms, listing } = state;
  return (
    <div className={s.page}>
      <EntryHero terms={terms} host={listing?.subtitle} />
      {individual ? (
        <IndividualEntry widgetId={widgetId} listingId={listingId} terms={terms} invite={invite} />
      ) : terms.closedReason ? (
        <div className={s.status}>
          <h1>Applications Are Closed</h1>
          <p>{terms.closedReason}</p>
        </div>
      ) : (
        <EntryWizard widgetId={widgetId} listingId={listingId} terms={terms} club={club} user={user} keepTeam={keepTeam} signInHref={signInHref} invite={invite} />
      )}
    </div>
  );
}
