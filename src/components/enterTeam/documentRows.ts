import type { ClubPerson } from '@/content/teamEntry';
import type { Tag } from './entryRules';

export type DocRow = { key: string; name: string; detail: string; tag: Tag };

type Going = { id: string; name: string };
type Input =
  /** A partner's own team: what's on CLP is reused. */
  | { club: true; verified: boolean; clubName: string; going: Going[]; people: ClubPerson[]; insurance: string }
  /** A new team typed in: the organizer checks it. */
  | { club: false; playerCount: number; insurance: string };

const onFile: Tag = { label: 'On File', tone: 'green' };
const checks: Tag = { label: 'Organizer Checks', tone: 'gray' };
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** The Documents step's rows: what's on file, what the organizer checks, and what's still missing (design board 5). */
export function documentRows(input: Input): DocRow[] {
  const insurance: DocRow = input.insurance.trim()
    ? { key: 'insurance', name: 'Club insurance certificate', detail: input.insurance.trim(), tag: { label: 'Added', tone: 'green' } }
    : { key: 'insurance', name: 'Club insurance certificate', detail: 'Add it below, or send it to the organizer later', tag: { label: 'Optional', tone: 'gray' } };
  const coaches: DocRow = { key: 'coaches', name: 'Coach background and SafeSport', detail: 'The organizer checks your coaches before game day', tag: checks };
  if (!input.club) {
    return [
      { key: 'club', name: 'Club verification', detail: 'Your team isn’t on CLP yet, so the organizer reviews it', tag: checks },
      coaches,
      insurance,
      { key: 'waiver', name: 'Tournament waiver', detail: `The organizer asks the guardians of ${plural(input.playerCount, 'player')} to sign it`, tag: { label: 'After You Apply', tone: 'gray' } },
    ];
  }
  const missing = input.going.flatMap((p) => {
    const person = input.people.find((x) => x.playerId === p.id);
    return (person?.documents ?? []).filter((d) => d.state !== 'signed').map((d) => ({ player: p, ask: d.ask, expired: d.state === 'expired' }));
  });
  const name = input.clubName || 'Your club';
  return [
    input.verified
      ? { key: 'club', name: 'Club verification', detail: `${name} is CLP Verified`, tag: onFile }
      : { key: 'club', name: 'Club verification', detail: `${name} isn’t CLP Verified yet, so the organizer reviews it`, tag: checks },
    coaches,
    insurance,
    { key: 'waiver', name: 'Tournament waiver', detail: `Guardians of ${plural(input.going.length, 'player')} are asked to sign it`, tag: { label: 'After You Apply', tone: 'gray' } },
    ...missing.map((m) => ({
      key: `${m.player.id}-${m.ask}`,
      name: `${m.player.name} · ${m.ask}`,
      detail: m.expired ? 'Expired. Their guardian is asked to renew it' : 'Their guardian is asked to finish it',
      tag: { label: m.expired ? 'Expired' : 'Missing', tone: 'amber' as const },
    })),
  ];
}
