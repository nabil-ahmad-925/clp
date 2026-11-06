import options from './data/listingKinds.json';
import { send } from './teamEntry';

/**
 * Reserve on a Trips & Retreats listing (clp-api src/shared/events-trip-site.mjs, GET/POST /events/trip): its plan, and a
 * reservation that holds a spot until the deposit is in. A listing with no plan yet books as usual.
 */
export type TripPlan = {
  organizerName: string;
  style: 'trip' | 'retreat';
  destination: string;
  international?: boolean;
  total: number;
  deposit: number;
  depositDays: number;
  installments: { dueDate: string; amount: number }[];
  left: number;
  /** Why it isn't taking reservations. */
  closed?: string;
  closesOn?: string;
  meetingPoint?: string;
  included: string[];
  notIncluded: string[];
  itinerary: { date?: string; time?: string; title: string; place?: string; details?: string }[];
  documents: string[];
};
export type ReservationInput = { widgetId: string; listingId: string; name: string; born: number; email: string; phone?: string; emergencyName: string; emergencyPhone: string; note?: string; guardianName?: string; guardianEmail?: string; agreed: boolean; website: string };
export type Reservation = { id: string; status: 'reserved' | 'waitlist'; depositDue?: string; name: string; email: string; emailed: boolean };

const KIND_BY_WIDGET: Record<string, string | undefined> = options.kindByWidget;
/** Whether a listing runs as a trip: its own kind, else its category's. */
export const isTrip = (widgetId: number | string, kind?: string) => (kind ?? KIND_BY_WIDGET[String(widgetId)]) === 'trip';

export const fetchTripPlan = (widgetId: string, id: string) =>
  send<{ trip: TripPlan | null }>(`/events/trip?widget=${encodeURIComponent(widgetId)}&listing=${encodeURIComponent(id)}`).then((r) => r.trip);

export const reserveTrip = (input: ReservationInput) =>
  send<{ reservation: Reservation }>('/events/trip', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }).then((r) => r.reservation);

/** The words a trip or a retreat uses. */
export const tripWords = (style: TripPlan['style']) => (style === 'retreat' ? { plan: 'SCHEDULE', one: 'retreat' } : { plan: 'ITINERARY', one: 'trip' });
