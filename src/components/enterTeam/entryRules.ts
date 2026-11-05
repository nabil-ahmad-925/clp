import type { ClubPlayer, EntryDivision, EntryTerms, PayBy, TypedPlayer } from '@/content/teamEntry';

/** Enter A Team's rules, pure (the API checks them all again): the five steps, who fits, what it costs. */
export const STEPS = ['Division', 'Team & Roster', 'Documents', 'Add-Ons & Payment', 'Review & Apply'] as const;
export type Tone = 'green' | 'amber' | 'red' | 'gray';
export type Tag = { label: string; tone: Tone };

const ADULT_AGE = 18;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const thisYear = () => new Date().getFullYear();
export const isMinor = (born: number) => thisYear() - born < ADULT_AGE;

/** A player row being typed (text, as in the inputs). */
export type PlayerDraft = { key: string; name: string; born: string; number: string; guardian: string; guardianEmail: string };
export const blankPlayer = (key: string): PlayerDraft => ({ key, name: '', born: '', number: '', guardian: '', guardianEmail: '' });

export type Draft = {
  divisionId: string;
  /** A partner's own team (by id), or '' for a new team typed in. */
  teamId: string;
  leftOut: string[];
  teamName: string;
  coaches: string;
  players: PlayerDraft[];
  insurance: string;
  paysBy: PayBy;
  contact: { name: string; email: string; phone: string };
  notes: string;
  agreed: boolean;
  website: string;
};

/** A division's tag: spots left, or the waitlist when full. */
export function divisionTag(d: EntryDivision): Tag {
  if (d.left === null) return { label: 'Open', tone: 'green' };
  if (d.left <= 0) return { label: 'Waitlist', tone: 'red' };
  return { label: `${d.left} Spot${d.left === 1 ? '' : 's'}`, tone: d.left <= 2 ? 'amber' : 'green' };
}

export const bornRange = (d: Pick<EntryDivision, 'bornFrom' | 'bornTo'>) =>
  d.bornFrom && d.bornTo ? `Born ${d.bornFrom}–${d.bornTo}` : d.bornFrom ? `Born ${d.bornFrom} or later` : d.bornTo ? `Born ${d.bornTo} or earlier` : 'All ages';

export const divisionLine = (d: EntryDivision) => `${bornRange(d)} · ${d.minPlayers === d.maxPlayers ? d.maxPlayers : `${d.minPlayers} to ${d.maxPlayers}`} players`;

/** Whether a player fits the division by birth year. */
export function eligibility(born: number, d?: Pick<EntryDivision, 'bornFrom' | 'bornTo'>): Tag {
  if (d?.bornFrom && born < d.bornFrom) return { label: 'Too Old', tone: 'red' };
  if (d?.bornTo && born > d.bornTo) return { label: 'Too Young', tone: 'red' };
  return { label: 'Eligible', tone: 'green' };
}

/** A club team's players going (less those left out) and who falls outside the division. */
export function clubRoster(players: ClubPlayer[], leftOut: string[], d?: EntryDivision) {
  const going = players.filter((p) => !leftOut.includes(p.id));
  return { going, outside: going.filter((p) => eligibility(p.born, d).tone === 'red') };
}

export const coachList = (text: string) => [...new Set(text.split(/[,\n]/).map((c) => c.trim()).filter(Boolean))];

/** What's wrong with a typed player, or ''. */
export function playerProblem(p: PlayerDraft): string {
  const who = p.name.trim() || 'Each player';
  if (!p.name.trim()) return 'Enter each player’s name.';
  const born = Number(p.born);
  if (!/^\d{4}$/.test(p.born.trim()) || born < 1950 || born > thisYear()) return `Enter ${who}’s birth year.`;
  if (isMinor(born) && !p.guardian.trim()) return `${who} is under 18. Add a parent or guardian.`;
  if (p.guardianEmail.trim() && !EMAIL.test(p.guardianEmail.trim())) return `Check the guardian’s e-mail for ${who}.`;
  return '';
}

export const typedPlayer = (p: PlayerDraft): TypedPlayer => ({
  name: p.name.trim(),
  born: Number(p.born),
  number: p.number.trim() || undefined,
  guardian: p.guardian.trim() || undefined,
  guardianEmail: p.guardianEmail.trim() || undefined,
});

/** The players a typed team has so far (rows left blank don't count). */
export const typedRows = (draft: Draft) => draft.players.filter((p) => p.name.trim() || p.born.trim() || p.guardian.trim());

const players = (n: number) => `${n} player${n === 1 ? '' : 's'}`;
/** What the division asks of a roster: "U12 Girls takes 12 to 18 players." */
export const rosterRule = (d: EntryDivision) => `${d.name} takes ${d.minPlayers === d.maxPlayers ? d.maxPlayers : `${d.minPlayers} to ${d.maxPlayers}`} players.`;
/** Why this many players can't apply to the division, or ''. As the API's check. */
export function rosterSizeProblem(d: EntryDivision | undefined, count: number) {
  if (!d) return '';
  if (count < d.minPlayers) return `${d.name} needs at least ${players(d.minPlayers)}. You have ${count}.`;
  if (count > d.maxPlayers) return `${d.name} takes at most ${players(d.maxPlayers)}. You have ${count}.`;
  return '';
}

/** Why a step can't go on yet, or ''. `club`: entering one of the partner's own teams. */
export function stepProblem(step: number, draft: Draft, ctx: { division?: EntryDivision; club: boolean; goingCount: number }): string {
  const { division } = ctx;
  if (step === 0) return division ? '' : 'Pick a division.';
  if (step === 1) {
    if (ctx.club) return !draft.teamId ? 'Pick a team, or create one.' : ctx.goingCount < 1 ? 'Tick at least one player going.' : rosterSizeProblem(division, ctx.goingCount);
    if (!draft.teamName.trim()) return 'Enter your team’s name.';
    if (!coachList(draft.coaches).length) return 'Add at least one coach.';
    const rows = typedRows(draft);
    if (!rows.length) return 'Add at least one player.';
    return rows.map(playerProblem).find(Boolean) ?? rosterSizeProblem(division, rows.length);
  }
  if (step === 4) {
    if (!ctx.club && !draft.contact.name.trim()) return 'Enter your name.';
    if (!ctx.club && !EMAIL.test(draft.contact.email.trim())) return 'Enter a valid e-mail address.';
    if (!draft.agreed) return 'Agree to the waiver and expectations to apply.';
  }
  return '';
}

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * What an entry comes to for this many players: once per team, or the price times the players (as the API works it
 * out). Nothing is charged here: the deposit (or the whole fee) is due once accepted.
 */
export function entryCosts(t: Pick<EntryTerms, 'fee' | 'deposit' | 'feePer'>, players: number) {
  const perPlayer = t.feePer === 'player';
  const times = perPlayer ? players : 1;
  const fee = cents(t.fee * times);
  const deposit = cents(t.deposit * times);
  return { perPlayer, each: t.fee, players: times, fee, deposit, dueOnAccept: deposit > 0 ? deposit : fee, isDeposit: deposit > 0, balance: deposit > 0 ? Math.max(cents(fee - deposit), 0) : 0 };
}

/** A division's price, else the tournament's. */
export function priceOf(t: Pick<EntryTerms, 'fee' | 'deposit' | 'feePer' | 'unit'>, d?: EntryDivision) {
  const feePer = d?.feePer ?? t.feePer;
  return { fee: d?.fee ?? t.fee, deposit: d?.deposit ?? t.deposit, feePer, unit: feePer === 'team' ? 'team' : t.unit && t.unit !== 'team' ? t.unit : 'player' };
}

/** The price as listed: "$40 per player", "$650 per team", or no fee. */
export const priceLine = (t: Pick<EntryTerms, 'fee' | 'feePer' | 'unit'>, money: (n: number) => string) =>
  t.fee > 0 ? `${money(t.fee)} per ${t.feePer === 'player' ? t.unit || 'player' : 'team'}` : 'No entry fee';

/** Each family's share when the fee is split. */
export const splitShare = (fee: number, players: number) => (players > 0 ? Math.ceil(fee / players) : 0);
