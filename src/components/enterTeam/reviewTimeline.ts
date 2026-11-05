import type { EntryDivision, EntryTerms } from '@/content/teamEntry';
import { entryCosts, priceOf } from './entryRules';
import { money, shortDay } from './format';

/** What happens after applying, in order, from this tournament's own dates and fees (design board 5's last step). */
export function reviewTimeline(terms: EntryTerms, club: boolean, players: number, division?: EntryDivision) {
  const costs = entryCosts(priceOf(terms, division), players);
  const onWaitlist = terms.late || division?.left === 0;
  const steps: { what: string; detail: string }[] = [
    { what: 'Application sent', detail: club ? 'Nothing is charged. The organizer asks for any missing waivers.' : 'Nothing is charged. We e-mail you a copy.' },
    onWaitlist
      ? { what: 'On the waitlist', detail: `${terms.organizerName} offers a spot if one opens. You’ll get ${club ? 'a message on CLP' : 'an e-mail'}.` }
      : { what: 'Organizer reviews', detail: `${terms.organizerName} may ask for changes. You’ll get ${club ? 'a message on CLP' : 'an e-mail'}.` },
    { what: 'Accepted', detail: costs.dueOnAccept > 0 ? `${money(costs.dueOnAccept)} ${costs.isDeposit ? 'deposit' : 'entry fee'} due. Add-ons are offered.` : 'Your team is in. Add-ons are offered.' },
  ];
  if (costs.balance > 0 && terms.balanceDue) steps.push({ what: `Balance due ${shortDay(terms.balanceDue)}`, detail: `${money(costs.balance)}. Reminders go out before it’s due.` });
  if (terms.rosterLocksOn) steps.push({ what: `Roster locks ${shortDay(terms.rosterLocksOn)}`, detail: 'Swaps after that go through the organizer.' });
  if (terms.startDate) steps.push({ what: `${terms.format === 'league' ? 'First game' : 'Game day'} ${shortDay(terms.startDate)}`, detail: 'The team manager checks the team in on arrival.' });
  return steps;
}
