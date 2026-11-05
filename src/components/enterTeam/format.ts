/** Enter A Team's words for money and days (days are "YYYY-MM-DD", shown as they are, with no time zone shift). */
export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

const parts = (day: string) => new Date(`${day}T00:00:00Z`);
/** "Nov 7" */
export const shortDay = (day: string) => parts(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "Nov 7–8", "Nov 30 – Dec 1", or one day. */
export function dayRange(start?: string, end?: string) {
  if (!start) return '';
  if (!end || end === start) return shortDay(start);
  const [a, b] = [parts(start), parts(end)];
  if (a.getUTCMonth() === b.getUTCMonth()) return `${shortDay(start)}–${b.getUTCDate()}`;
  return `${shortDay(start)} – ${shortDay(end)}`;
}
