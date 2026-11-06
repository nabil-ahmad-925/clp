import { useState } from 'react';
import type { ClubTeam } from '@/content/teamEntry';
import { AddPlayerForm, CreateTeamForm } from './ClubTeamForms';
import { eligibility } from './entryRules';
import { RowText, Tag } from './parts';
import { useClubTeamEdits } from './useClubTeamEdits';
import type { EntryDraftState } from './useEntryDraft';
import ExceptionAsk from './ExceptionAsk';
import s from './steps.module.css';

const NEW = '__new';

type Props = { entry: EntryDraftState; teams: ClubTeam[]; verified: boolean; keepTeam: (team: ClubTeam) => void; most: number };

/** A signed-in partner's own teams: pick one and untick anyone not going, add a player to it, or create a new team. */
export default function ClubTeamPicker({ entry, teams, verified, keepTeam, most }: Props) {
  const { draft, update, division, team, roster } = entry;
  const edits = useClubTeamEdits(keepTeam);
  const [creating, setCreating] = useState(teams.length === 0);
  const [adding, setAdding] = useState(false);
  const pick = (id: string) => {
    edits.clearError();
    setAdding(false);
    setCreating(id === NEW);
    update({ teamId: id === NEW ? '' : id, leftOut: [] });
  };
  const toggle = (id: string, going: boolean) => update({ leftOut: going ? draft.leftOut.filter((x) => x !== id) : [...draft.leftOut, id] });
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <label className={s.field}>
        Team
        <select className={s.input} value={creating ? NEW : draft.teamId} onChange={(e) => pick(e.target.value)}>
          {!creating && !draft.teamId && <option value="">Choose a team…</option>}
          {sorted.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.players.length} player{t.players.length === 1 ? '' : 's'})
            </option>
          ))}
          <option value={NEW}>Create a new team…</option>
        </select>
      </label>
      {creating && <CreateTeamForm edits={edits} onCreated={(made) => pick(made.id)} onCancel={teams.length ? () => pick('') : undefined} />}
      {team && (
        <>
          <span className={s.intro}>Players come from your team on CLP. Untick anyone not going.</span>
          <div className={s.list}>
            {team.players.length === 0 && <div className={s.rowFoot}>This team has no players yet. Add them below.</div>}
            {team.players.map((p) => {
              const going = !draft.leftOut.includes(p.id);
              const tag = eligibility(p.born, division);
              return (
                <label key={p.id} className={`${s.row} ${tag.tone === 'red' ? s.rowOut : ''}`}>
                  <input type="checkbox" className={s.check} checked={going} onChange={(e) => toggle(p.id, e.target.checked)} />
                  <RowText title={p.name} sub={[`Born ${p.born}`, p.number && `#${p.number}`, p.guardian && `guardian ${p.guardian}`].filter(Boolean).join(' · ')} />
                  <Tag tag={tag} />
                </label>
              );
            })}
          </div>
          {roster.outside.map((p) => (
            <ExceptionAsk key={p.id} name={p.name} born={p.born} divisionName={division?.name} most={most} value={draft.exceptions[p.id] ?? ''} onChange={(reason) => entry.update({ exceptions: { ...draft.exceptions, [p.id]: reason } })} />
          ))}
          {adding ? (
            <AddPlayerForm team={team} edits={edits} onDone={() => setAdding(false)} />
          ) : (
            <div className={s.actions}>
              <button type="button" className={s.small} onClick={() => setAdding(true)}>
                + Add Player
              </button>
            </div>
          )}
          {team.coaches.length > 0 && (
            <div className={s.chips} aria-label="Coaches">
              {team.coaches.map((c) => (
                <span key={c} className={s.chip}>
                  {c}
                </span>
              ))}
              {verified && (
                <span className={s.chip}>
                  Your club · <span className={s.verified}>CLP Verified</span>
                </span>
              )}
            </div>
          )}
        </>
      )}
      {edits.error && (
        <p className={s.alert} role="alert">
          {edits.error}
        </p>
      )}
    </>
  );
}
