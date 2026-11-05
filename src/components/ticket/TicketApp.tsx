'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { fetchTicket, ticketHref, type Ticket } from '@/content/ticket';
import AdultsScreen from './AdultsScreen';
import CodeScreen from './CodeScreen';
import { PoweredBy, type ScreenProps, type View } from './parts';
import PlayAgainScreen from './PlayAgainScreen';
import StartScreen from './StartScreen';
import TicketScreen from './TicketScreen';
import styles from './ticket.module.css';
import UpdatesScreen from './UpdatesScreen';

const VIEWS: View[] = ['start', 'code', 'ticket', 'adults', 'next', 'updates'];
/** Read again while open, so a host's check-in, pick-up or reply shows without a reload. */
const REFRESH_MS = 30_000;

type State = { status: 'loading' } | { status: 'invalid' } | { status: 'error'; message: string } | { status: 'ready'; ticket: Ticket };

function Message({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className={styles.body}>
        <h1 className={styles.title}>Your Ticket</h1>
        {children}
      </main>
      <PoweredBy />
    </>
  );
}

/**
 * The guest's ticket on their phone (design board 8, parent phone), from the link in their booking e-mails: Start,
 * field code check-in, the ticket, approved adults, play again, updates and messages. No app and no account needed.
 */
export default function TicketApp() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';
  const asked = params.get('v') as View | null;
  const view: View = asked && VIEWS.includes(asked) ? asked : 'start';
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!id || !token) return;
    let live = true;
    const read = () =>
      fetchTicket(id, token).then(
        (ticket) => live && setState(ticket ? { status: 'ready', ticket } : { status: 'invalid' }),
        (err) => live && setState((s) => (s.status === 'ready' ? s : { status: 'error', message: (err as Error).message })),
      );
    void read();
    const timer = setInterval(() => document.visibilityState === 'visible' && void read(), REFRESH_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [id, token]);

  const onChange = useCallback((ticket: Ticket) => setState({ status: 'ready', ticket }), []);
  const href = useCallback((v: View) => ticketHref(id, token, v === 'start' ? '' : v), [id, token]);

  let screen: React.ReactNode;
  if (!id || !token || state.status === 'invalid') screen = <Message><p className={styles.error}>This ticket link isn’t valid. Open the link in your latest booking e-mail.</p></Message>;
  else if (state.status === 'loading') screen = <Message><p className={styles.muted}>Loading your ticket…</p></Message>;
  else if (state.status === 'error') screen = <Message><p className={styles.error}>{state.message}</p></Message>;
  else {
    const props: ScreenProps = { ticket: state.ticket, id, token, href, onChange };
    screen = { start: <StartScreen {...props} />, code: <CodeScreen {...props} />, ticket: <TicketScreen {...props} />, adults: <AdultsScreen {...props} />, next: <PlayAgainScreen {...props} />, updates: <UpdatesScreen {...props} /> }[view];
  }
  return (
    <div className={styles.layer}>
      <div className={styles.app}>{screen}</div>
    </div>
  );
}
