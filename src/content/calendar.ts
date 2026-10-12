/**
 * A calendar file (.ics) for one event: Apple Calendar, Outlook and Google Calendar open it. Times are the listing's
 * local times ("floating": no time zone), so the event shows at the time the guest was told wherever their calendar is.
 */
export type CalendarEvent = {
  /** A stable id (the booking's), so adding it twice updates the same event. */
  uid: string;
  title: string;
  /** "YYYY-MM-DD"; "HH:MM" times (none: all day; a start alone lasts an hour). */
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  url?: string;
};

/** Escapes a text value (RFC 5545: backslash, comma, semicolon and new lines). */
const text = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
const day = (d: string) => d.replace(/-/g, '');
const nextDay = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
/** Long lines folded at 74 characters, as calendars expect. */
const fold = (line: string) => line.match(/.{1,74}/g)!.join('\r\n ');

export function calendarFile(e: CalendarEvent): string {
  const at = (t: string) => `${day(e.date)}T${t.replace(':', '')}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const when = e.startTime
    ? [`DTSTART:${at(e.startTime)}`, e.endTime ? `DTEND:${at(e.endTime)}` : 'DURATION:PT1H']
    : [`DTSTART;VALUE=DATE:${day(e.date)}`, `DTEND;VALUE=DATE:${day(nextDay(e.date))}`];
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Compete Like Pros//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@competelikepros.com`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${text(e.title)}`,
    ...(e.location ? [`LOCATION:${text(e.location)}`] : []),
    ...(e.description ? [`DESCRIPTION:${text(e.description)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n');
}

/** Saves the event as a .ics file (the browser opens it with the calendar app, or downloads it). */
export function downloadCalendarFile(e: CalendarEvent, name: string) {
  const url = URL.createObjectURL(new Blob([calendarFile(e)], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'booking'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
