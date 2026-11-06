import { EntryError, send } from './teamEntry';

/**
 * A tournament's public side (clp-api shared/events-tournament-page.mjs, events-individual-entry.mjs, events-spot-offers.mjs):
 * its page, one person entering, and a waitlisted team answering an offer. Never rosters or player names.
 */
export type PageGame = { round: number; stage?: string; pool?: string; date?: string; time?: string; field?: string; home?: string; away?: string; score?: { home: number; away: number }; status: string };
export type PageTable = { pool?: string; rows: { name: string; played: number; won: number; drawn: number; lost: number; points: number; diff: number }[] };
export type PageDivision = { id: string; name: string; teams: { name: string; club?: string }[]; schedule?: { format: string; games: PageGame[]; standings: PageTable[] } };
export type TournamentPage = { name: string; format: string; venue?: string; startDate: string; endDate: string; organizerName: string; divisions: PageDivision[] };

const query = (o: Record<string, string | undefined>) => new URLSearchParams(Object.entries(o).filter((e): e is [string, string] => Boolean(e[1]))).toString();

export const fetchTournamentPage = (widget: string, listing: string, invite?: string) => send<{ page: TournamentPage | null }>(`/events/team-entry?${query({ widget, listing, invite, page: '1' })}`).then((r) => r.page);

export type IndividualEntry = { individual: 'freeAgent' | 'event'; widgetId: string; listingId: string; tournamentId: string; divisionId?: string; eventId?: string; name: string; born: number; email: string; phone?: string; guardianName?: string; guardianEmail?: string; invite?: string; agreed: boolean; website: string };
export type EnteredIndividual = { id: string; kind: 'freeAgent' | 'event'; name: string; divisionName?: string; eventName?: string; emailed: boolean };
export const enterIndividual = (entry: IndividualEntry) => send<{ entry: EnteredIndividual }>('/events/team-entry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry) }).then((r) => r.entry);

export type SpotOffer = { teamName: string; tournamentName: string; divisionName: string; organizerName: string; expiresAt: string; deposit: number; startDate: string };
export const fetchOffer = (offer: string, owner: string, token: string) => send<{ offer: SpotOffer }>(`/events/team-entry?${query({ offer, owner, token })}`).then((r) => r.offer);
export const answerOffer = (id: string, owner: string, token: string, answer: 'accept' | 'decline') =>
  send<{ offer: { status: string } }>('/events/team-entry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ offer: { id, owner, token, answer } }) }).then((r) => r.offer);

export const messageOf = (err: unknown, fallback: string) => (err instanceof EntryError || err instanceof Error ? err.message : fallback);
