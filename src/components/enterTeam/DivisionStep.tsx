import type { EntryTerms } from '@/content/teamEntry';
import { divisionLine, divisionTag, priceLine, priceOf } from './entryRules';
import { money } from './format';
import { Tag } from './parts';
import type { EntryDraftState } from './useEntryDraft';
import s from './steps.module.css';

/** Step 1: the division, with its birth years, roster size, fee and spots left. */
export default function DivisionStep({ terms, entry }: { terms: EntryTerms; entry: EntryDraftState }) {
  const full = terms.divisions.some((d) => d.left === 0);
  return (
    <>
      <h2 className={s.heading}>Pick a Division</h2>
      {terms.fromListing && <p className={s.intro}>Teams apply as listed. The organizer may set divisions after reviewing.</p>}
      <div className={s.divisions} role="radiogroup" aria-label="Division">
        {terms.divisions.map((d) => (
          <button key={d.id} type="button" role="radio" aria-checked={entry.draft.divisionId === d.id} className={s.division} onClick={() => entry.update({ divisionId: d.id, leftOut: [] })}>
            <span className={s.divisionTop}>
              <strong>{d.name}</strong>
              <Tag tag={divisionTag(d)} />
            </span>
            <span className={s.divisionLine}>{divisionLine(d)}</span>
            <span className={s.divisionFee}>
              {priceLine(priceOf(terms, d), money)}
              {priceOf(terms, d).deposit > 0 ? ` · ${money(priceOf(terms, d).deposit)} deposit` : ''}
            </span>
          </button>
        ))}
      </div>
      {full && <span className={s.hint}>Full divisions still take applications for the waitlist.</span>}
    </>
  );
}
