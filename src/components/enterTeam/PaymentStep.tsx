import type { EntryTerms, PayBy } from '@/content/teamEntry';
import { entryCosts, priceLine, priceOf, splitShare } from './entryRules';
import { money } from './format';
import { RowText, Tag } from './parts';
import type { EntryDraftState } from './useEntryDraft';
import s from './steps.module.css';

/** Step 4: add-ons (offered once accepted) and who pays. Nothing is charged here. */
export default function PaymentStep({ terms, entry }: { terms: EntryTerms; entry: EntryDraftState }) {
  const { draft, update, playerCount } = entry;
  const price = priceOf(terms, entry.division);
  const costs = entryCosts(price, playerCount);
  const { unit } = price;
  const plural = (n: number) => `${n} ${n === 1 ? unit : unit === 'person' ? 'people' : `${unit}s`}`;
  const feeLine = costs.perPlayer ? `${priceLine(price, money)} × ${plural(costs.players)}` : priceLine(price, money);
  const dueLine = costs.isDeposit ? `${money(costs.dueOnAccept)} deposit if accepted, ${money(costs.balance)} balance later` : 'Due once your team is accepted';
  const options: [PayBy, string][] = [
    ['club', entry.club ? 'Our club pays (club card on file)' : 'Our club pays'],
    ['split', costs.fee > 0 && playerCount > 0 ? `Split between families (${money(splitShare(costs.fee, playerCount))} each for ${playerCount})` : 'Split between families'],
    ['coach', 'I’ll pay personally'],
  ];
  return (
    <>
      <h2 className={s.heading}>Add-Ons and Payment</h2>
      <div className={s.list}>
        <div className={s.row}>
          <RowText title="Entry fee" sub={costs.fee > 0 ? `${feeLine} · ${dueLine}` : price.fee > 0 ? `${feeLine} · add your players first` : 'No fee for this one'} />
          <strong>{costs.fee > 0 ? money(costs.fee) : price.fee > 0 ? '—' : 'Free'}</strong>
        </div>
        <div className={s.row}>
          <RowText title="Team add-ons" sub="Team tees, photo packages and parking are offered once your team is accepted" />
          <Tag tag={{ label: 'After Acceptance', tone: 'gray' }} />
        </div>
      </div>
      <fieldset className={s.fieldset}>
        <legend className={s.legend}>Who Pays</legend>
        {options.map(([id, label]) => (
          <label key={id} className={s.radio}>
            <input type="radio" name="paysBy" className={s.check} checked={draft.paysBy === id} onChange={() => update({ paysBy: id })} />
            {label}
          </label>
        ))}
      </fieldset>
      <span className={s.hint}>Nothing is charged today. The organizer tells you how to pay once your team is accepted.</span>
    </>
  );
}
