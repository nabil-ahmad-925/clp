import Link from 'next/link';
import type { Ticket } from '@/content/ticket';
import styles from './ticket.module.css';

/** The screens of the ticket app, by the address (?v=…), so the phone's back button works. */
export type View = 'start' | 'code' | 'ticket' | 'adults' | 'next' | 'updates';
export type ScreenProps = { ticket: Ticket; id: string; token: string; href: (v: View) => string; onChange: (t: Ticket) => void };

export const dayLine = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
export const clock = (t?: string) => {
  if (!t) return '';
  const [h = 0, m = 0] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const timeOf = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '');
export const partyOf = (t: Pick<Ticket, 'adults' | 'kids'>) =>
  [t.adults ? `${t.adults} adult${t.adults === 1 ? '' : 's'}` : '', t.kids ? `${t.kids} kid${t.kids === 1 ? '' : 's'}` : ''].filter(Boolean).join(' + ');
export const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

export function Back({ href, label }: { href: string; label: string }) {
  return <Link href={href} className={styles.back}>← {label}</Link>;
}

/** On every app screen, host and player (design board 8). */
export function PoweredBy() {
  return (
    <footer className={styles.powered}>
      <strong>Powered by Compete Like Pros™</strong> · No app needed · secure by CLP
    </footer>
  );
}
