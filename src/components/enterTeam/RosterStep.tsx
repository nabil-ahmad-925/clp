import type { ClubTeam } from '@/content/teamEntry';
import ClubTeamPicker from './ClubTeamPicker';
import { divisionLine, rosterRule, rosterSizeProblem } from './entryRules';
import NewTeamFields from './NewTeamFields';
import { Tag } from './parts';
import type { ClubData } from './useEntryData';
import type { EntryDraftState } from './useEntryDraft';
import s from './steps.module.css';

type Props = { entry: EntryDraftState; club: ClubData | null | undefined; keepTeam: (team: ClubTeam) => void; signInHref: string; most: number };

/** Step 2: the team. A signed-in partner's own (or a new one saved to their Teams), else a new team typed in here. */
export default function RosterStep({ entry, club, keepTeam, signInHref, most }: Props) {
  const { division, playerCount } = entry;
  const size = rosterSizeProblem(division, playerCount);
  return (
    <>
      <div className={s.headRow}>
        <h2 className={s.heading}>Team and Roster</h2>
        {division && (
          <span className={s.hint}>
            {division.name} · {divisionLine(division)}
          </span>
        )}
      </div>
      {division && (
        <div className={s.row} role="status" aria-label="Roster size">
          <span className={s.rowText}>
            <span className={s.rowTitle}>{rosterRule(division)}</span>
            <span className={s.rowSub}>The team can apply once it fits. You have {playerCount} so far.</span>
          </span>
          <Tag tag={size ? { label: playerCount > division.maxPlayers ? 'Too Many' : 'Add Players', tone: 'amber' } : { label: 'Roster Fits', tone: 'green' }} />
        </div>
      )}
      {club === undefined ? (
        <p className={s.intro} role="status">
          Loading your teams…
        </p>
      ) : club ? (
        <ClubTeamPicker entry={entry} teams={club.teams} verified={club.verified} keepTeam={keepTeam} most={most} />
      ) : (
        <NewTeamFields entry={entry} signInHref={signInHref} most={most} />
      )}
    </>
  );
}
