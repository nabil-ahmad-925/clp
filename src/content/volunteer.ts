import { send } from './teamEntry';

/**
 * Register on a Volunteering listing (clp-api src/shared/events-volunteer-site.mjs, GET/POST /events/volunteer): its shifts,
 * and a request its organizer approves under Volunteers › Requests. Open play in the same category books as usual.
 */
export type VolunteerShift = { id: string; title: string; date: string; startTime: string; endTime: string; place: string; left: number; youthFacing?: boolean; notes?: string };
export type Opportunity = { organizerName: string; shifts: VolunteerShift[] };
export type VolunteerRequestInput = { widgetId: string; listingId: string; shiftId?: string; name: string; email: string; phone?: string; note?: string; under18: boolean; guardianName?: string; guardianEmail?: string; agreed: boolean; website: string };

export const fetchOpportunity = (widgetId: string, id: string) =>
  send<{ opportunity: Opportunity | null }>(`/events/volunteer?widget=${encodeURIComponent(widgetId)}&listing=${encodeURIComponent(id)}`).then((r) => r.opportunity);

export const sendVolunteerRequest = (request: VolunteerRequestInput) =>
  send<{ request: { id: string; status: string; email: string } }>('/events/volunteer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) }).then((r) => r.request);

/** The tag on a Volunteering & Open Play card, from its Experience filter (the design's "VOLUNTEER · MENTORING"). */
const OPPORTUNITIES: Record<string, [string, boolean]> = {
  'community-service': ['VOLUNTEER · COMMUNITY SERVICE', false],
  mentoring: ['VOLUNTEER · MENTORING', false],
  'travel-volunteer': ['VOLUNTEER · TRAVEL & VOLUNTEER', false],
  'free-open-play': ['OPEN PLAY · FREE PLAY', true],
  'paid-drop-in': ['OPEN PLAY · PAID DROP-IN', true],
};
export const opportunityTag = (tags: string[]) => {
  const found = tags.find((t) => t in OPPORTUNITIES);
  return found ? { label: OPPORTUNITIES[found][0], open: OPPORTUNITIES[found][1] } : undefined;
};
