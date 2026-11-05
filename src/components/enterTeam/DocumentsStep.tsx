import { documentRows } from './documentRows';
import { RowText, Tag } from './parts';
import type { ClubData } from './useEntryData';
import type { EntryDraftState } from './useEntryDraft';
import s from './steps.module.css';

/** Step 3: what's already on CLP is reused, and only what's missing is asked for. */
export default function DocumentsStep({ entry, club }: { entry: EntryDraftState; club: ClubData | null | undefined }) {
  const { draft, update, roster, playerCount } = entry;
  const rows = club
    ? documentRows({ club: true, verified: club.verified, clubName: club.name, going: roster.going, people: club.people, insurance: draft.insurance })
    : documentRows({ club: false, playerCount, insurance: draft.insurance });
  return (
    <>
      <h2 className={s.heading}>Documents</h2>
      <p className={s.intro}>{club ? 'Most of this is already on CLP. We’ll only ask for what’s missing.' : 'We’ll only ask for what’s missing. The organizer checks the rest.'}</p>
      <div className={s.list}>
        {rows.map((r) => (
          <div key={r.key} className={s.row}>
            <RowText title={r.name} sub={r.detail} />
            <Tag tag={r.tag} />
          </div>
        ))}
      </div>
      <label className={s.field}>
        Insurance certificate (optional)
        <input className={s.input} maxLength={200} placeholder="Carrier and policy number" value={draft.insurance} onChange={(e) => update({ insurance: e.target.value })} />
      </label>
    </>
  );
}
