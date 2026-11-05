import Link from 'next/link';
import { blankPlayer } from './entryRules';
import PlayerFields from './PlayerFields';
import type { EntryDraftState } from './useEntryDraft';
import s from './steps.module.css';

/** Anyone not signed in as a CLP Partner: a new team typed in, its coaches and every player. */
export default function NewTeamFields({ entry, signInHref }: { entry: EntryDraftState; signInHref: string }) {
  const { draft, update, division } = entry;
  // No more rows than the division takes.
  const full = draft.players.length >= (division?.maxPlayers ?? 60);
  const setPlayer = (key: string, next: typeof draft.players[number]) => update({ players: draft.players.map((p) => (p.key === key ? next : p)) });
  const addRow = () => update({ players: [...draft.players, blankPlayer(`p${Date.now()}`)] });
  return (
    <>
      <p className={s.intro}>
        Create your team for this application. Club on CLP? <Link href={signInHref}>Sign In</Link> to use the teams you already have.
      </p>
      <div className={s.fields}>
        <label className={s.field}>
          Team name
          <input className={s.input} maxLength={120} placeholder="Lions U12 Girls" value={draft.teamName} onChange={(e) => update({ teamName: e.target.value })} />
        </label>
        <label className={s.field}>
          Coaches
          <input className={s.input} maxLength={600} placeholder="Coach Kim Tran, Coach Ali Shah" value={draft.coaches} onChange={(e) => update({ coaches: e.target.value })} />
        </label>
      </div>
      <span className={s.hint}>Separate coaches with commas. Players under 18 need a parent or guardian.</span>
      {draft.players.map((p, i) => (
        <PlayerFields key={p.key} label={`Player ${i + 1}`} value={p} onChange={(next) => setPlayer(p.key, next)} onRemove={draft.players.length > 1 ? () => update({ players: draft.players.filter((x) => x.key !== p.key) }) : undefined} />
      ))}
      <div className={s.actions}>
        <button type="button" className={s.small} disabled={full} onClick={addRow}>
          + Add Player
        </button>
        {full && division && <span className={s.hint}>{division.name} takes at most {division.maxPlayers} players.</span>}
      </div>
    </>
  );
}
