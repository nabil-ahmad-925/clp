import { useState } from 'react';
import type { ClubTeam } from '@/content/teamEntry';
import { blankPlayer } from './entryRules';
import PlayerFields from './PlayerFields';
import type { useClubTeamEdits } from './useClubTeamEdits';
import s from './steps.module.css';

type Edits = ReturnType<typeof useClubTeamEdits>;

/** A new team for the partner, saved to their Teams: its name and coaches (players are added next). */
export function CreateTeamForm({ edits, onCreated, onCancel }: { edits: Edits; onCreated: (team: ClubTeam) => void; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [coaches, setCoaches] = useState('');
  const create = async () => {
    const team = await edits.createTeam(name, coaches);
    if (team) onCreated(team);
  };
  return (
    <div className={s.panel}>
      <span className={s.label}>Create a New Team</span>
      <div className={s.fields}>
        <label className={s.field}>
          Team name
          <input className={s.input} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={s.field}>
          Coaches
          <input className={s.input} maxLength={600} placeholder="Coach Priya Shah, Coach Kim Tran" value={coaches} onChange={(e) => setCoaches(e.target.value)} />
        </label>
      </div>
      <span className={s.hint}>It&rsquo;s saved to your Teams on CLP. Add its players next.</span>
      <div className={s.actions}>
        <button type="button" className={`${s.small} ${s.smallDark}`} disabled={edits.busy} onClick={create}>
          {edits.busy ? 'Saving…' : 'Create Team'}
        </button>
        {onCancel && (
          <button type="button" className={s.small} disabled={edits.busy} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/** A player added to one of the partner's teams, saved to it at once. */
export function AddPlayerForm({ team, edits, onDone }: { team: ClubTeam; edits: Edits; onDone: () => void }) {
  const [player, setPlayer] = useState(blankPlayer('new'));
  const add = async () => {
    if (await edits.addPlayer(team.id, player)) onDone();
  };
  return (
    <>
      <PlayerFields label={`New Player on ${team.name}`} value={player} onChange={setPlayer} />
      <div className={s.actions}>
        <button type="button" className={`${s.small} ${s.smallDark}`} disabled={edits.busy} onClick={add}>
          {edits.busy ? 'Saving…' : 'Add to Team'}
        </button>
        <button type="button" className={s.small} disabled={edits.busy} onClick={onDone}>
          Cancel
        </button>
      </div>
    </>
  );
}
