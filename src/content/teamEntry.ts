import options from './data/listingKinds.json';
import { partnerCall } from './partnerSession';

/**
 * Book Now › Team (design board 5, "Enter your team"): a team applies to the tournament or league behind a listing in
 * Camps & Tournaments or Leagues & Social Clubs (clp-api src/events.mjs, GET/POST /events/team-entry). A CLP Partner
 * signed in on the site enters one of its own teams (their Teams in the admin: pick one, add players, or create one);
 * anyone else types a new team. Either way it's an application the organizer reviews.
 */
const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

/** The categories whose Book Now offers Team (listingKinds.json, shared with the admin and the API). */
export const TEAM_ENTRY_WIDGETS: string[] = options.teamEntryWidgets;
export const takesTeams = (widgetId: number | string) => TEAM_ENTRY_WIDGETS.includes(String(widgetId));
const KIND_BY_WIDGET: Record<string, string | undefined> = options.kindByWidget;
/** A tournament or league (the listing's kind, else its category's): an individual is one person, a group enters as a team. */
export const onePersonOnly = (widgetId: number | string, kind?: string) => ['tournament', 'league'].includes(kind ?? KIND_BY_WIDGET[String(widgetId)] ?? '');
export const enterTeamHref = (widgetId: number | string, listingId: string) => `/enter-team/?widget=${encodeURIComponent(String(widgetId))}&listing=${encodeURIComponent(listingId)}`;

/** A division as the site sees it: `left` is its spots left, null when it has no set limit. */
export type EntryDivision = { id: string; name: string; bornFrom?: number; bornTo?: number; minPlayers: number; maxPlayers: number; left: number | null; /** Its own price, when it has one. */ fee?: number; deposit?: number; feePer?: 'team' | 'player' };
export type EntryTerms = {
  tournamentId: string;
  organizerName: string;
  format: 'tournament' | 'league';
  name: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  /** The first and last entry dates. Past the last (`late`) a team can still apply, onto the waitlist. */
  opensOn?: string;
  closesOn?: string;
  late?: boolean;
  /** The fee (and deposit) is once per team, or for each player listed (`unit`: the word it's shown with). */
  fee: number;
  deposit: number;
  feePer: 'team' | 'player';
  unit: string;
  balanceDue?: string;
  rosterLocksOn?: string;
  /** No tournament set up for it yet: the listing itself, as one Open Division. */
  fromListing?: boolean;
  /** Why a team can't apply now. */
  closedReason?: string;
  divisions: EntryDivision[];
};
export type EntryListing = { id: string; title: string; subtitle: string; image: string; startDate?: string; endDate?: string };

export type PayBy = 'club' | 'split' | 'coach';
/** A player typed in: a guardian for anyone under 18 (as a club's own players). */
export type TypedPlayer = { name: string; born: number; number?: string; guardian?: string; guardianEmail?: string };
export type NewTeamApplication = {
  widgetId: string;
  listingId: string;
  tournamentId: string;
  divisionId: string;
  teamName: string;
  coaches: string[];
  players: TypedPlayer[];
  contact: { name: string; email: string; phone?: string };
  paysBy: PayBy;
  insurance?: string;
  notes?: string;
  agreed: boolean;
  website: string;
};
export type SentApplication = { id: string; status: string; teamName: string; divisionName: string; tournamentName: string; contactEmail?: string; emailed?: boolean };

/** A partner's own team and what's on file for its players (their Teams and Documents & Waivers). */
export type ClubPlayer = { id: string; name: string; born: number; number?: string; guardian?: string };
export type ClubTeam = { id: string; name: string; coaches: string[]; players: ClubPlayer[] };
export type ClubPerson = { playerId?: string; teamId?: string; documents?: { ask: string; state: 'needed' | 'signed' | 'expired' }[] };

export class EntryError extends Error {
  constructor(message: string, readonly code = '') {
    super(message);
  }
}

export async function send<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new EntryError('This isn’t available right now.');
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000), ...init });
  } catch {
    throw new EntryError('Could not reach CLP. Check your connection and try again.', 'OFFLINE');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new EntryError(body.error || (res.status === 429 ? 'Too many requests. Please try again in a minute.' : 'Something went wrong. Please try again.'), body.code ?? '');
  return body as T;
}

/** The listing (its photo and title), or null when it isn't published. */
export const fetchEntryListing = (widgetId: string, id: string) =>
  send<{ item: EntryListing }>(`/listings/${encodeURIComponent(widgetId)}/${encodeURIComponent(id)}`)
    .then((r) => r.item)
    .catch((err) => {
      if (err instanceof EntryError && err.code === 'NOT_FOUND') return null;
      throw err;
    });

/** What Team applies to on this listing, or null when it takes no teams. */
export const fetchEntryTerms = (widgetId: string, id: string) =>
  send<{ entry: EntryTerms | null }>(`/events/team-entry?widget=${encodeURIComponent(widgetId)}&listing=${encodeURIComponent(id)}`).then((r) => r.entry);

export const applyNewTeam = (application: NewTeamApplication) =>
  send<{ application: SentApplication }>('/events/team-entry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(application) }).then((r) => r.application);

// --- A partner signed in on the site: their own teams (the admin's Teams, same API) -----------------------------------

const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

export const fetchClubTeams = () => partnerCall<{ items: ClubTeam[] }>('/my/events/teams').then((r) => r.items);
export const fetchClubPeople = () => partnerCall<{ items: ClubPerson[] }>('/my/events/people').then((r) => r.items);
export const createClubTeam = (name: string, coaches: string[]) => partnerCall<{ item: ClubTeam }>('/my/events/teams', json({ name, coaches })).then((r) => r.item);
export const addClubPlayer = (teamId: string, player: TypedPlayer) =>
  partnerCall<{ item: ClubTeam }>(`/my/events/teams/${encodeURIComponent(teamId)}/addPlayer`, json(player)).then((r) => r.item);

export type ClubApplication = { listing: { widgetId: string; id: string }; tournamentId: string; divisionId: string; teamId: string; leaveOut: string[]; paysBy: PayBy; insurance?: string };
export const applyClubTeam = (application: ClubApplication) =>
  partnerCall<{ item: SentApplication & { teamName: string } }>('/my/events/registrations', json(application)).then((r) => r.item);
