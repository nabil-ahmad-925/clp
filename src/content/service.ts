import options from './data/listingKinds.json';
import { send } from './teamEntry';

/**
 * Book Now on a coach's service listing (clp-api src/shared/events-service-site.mjs, GET/POST /events/service): what's
 * bookable, then a booking that lands on the coach's Appointments (a 1:1 at one of their open times, a seat in a small
 * group's session) or Clients' Packs (a pack, paid to the coach). A listing with no service books as usual.
 */
type Base = { name: string; price: number; providerName: string; freeCancelHours: number };
export type ServicePlan =
  | (Base & { kind: 'session'; minutes: number; online: boolean; aheadWeeks: number; days: { date: string; times: string[] }[]; closed?: string })
  | (Base & { kind: 'group'; minutes: number; sessions: { classId: string; sessionId: string; date: string; time: string; left: number; minAge?: number }[] })
  | (Base & { kind: 'pack'; sessions: number; validMonths: number });

export type ServiceBookingInput = {
  widgetId: string;
  listingId: string;
  date?: string;
  time?: string;
  classId?: string;
  sessionId?: string;
  name: string;
  born: number;
  email: string;
  phone?: string;
  guardianName?: string;
  note?: string;
  agreed: boolean;
  website: string;
};
export type ServiceBooking = { kind: ServicePlan['kind']; id: string; name: string; email: string; service: string; when: string; emailed: boolean };

const KIND_BY_WIDGET: Record<string, string | undefined> = options.kindByWidget;
/**
 * Whether a listing may be a coach's bookable service: run as a Service (Groups & Private Lessons). A Services area's
 * card has its own button (a request form or its details), so it isn't booked here.
 */
export const mayBeService = (widgetId: number | string, kind?: string) => (kind ?? KIND_BY_WIDGET[String(widgetId)]) === 'service';

export const fetchServicePlan = (widgetId: string, id: string) =>
  send<{ service: ServicePlan | null }>(`/events/service?widget=${encodeURIComponent(widgetId)}&listing=${encodeURIComponent(id)}`).then((r) => r.service);

/** A failure on CLP's side says so in words, and that nothing was booked. */
export const bookService = (input: ServiceBookingInput) =>
  send<{ booking: ServiceBooking }>('/events/service', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }).then(
    (r) => r.booking,
    (err: { code?: string }) => {
      if (err?.code === 'INTERNAL') throw new Error('Something went wrong on our side, so nothing was booked. Please try again in a minute.');
      throw err;
    },
  );
