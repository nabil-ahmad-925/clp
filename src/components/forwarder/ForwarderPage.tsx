'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchForwarder, sendQuote, sendTracking, type ForwarderShipment, type ForwarderState } from '@/content/forwarder';
import { trackDay } from '@/content/track';
import s from '../track/track.module.css';
import { QuoteForm, TrackingForm } from './ForwarderForms';
import f from './forwarder.module.css';

const CLP_EMAIL = 'hello@competelikepros.com';
type State = ForwarderState | { status: 'loading' } | { status: 'error'; message: string };
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

/**
 * A forwarder's link from Compete Like Pros (no account): the shipment to move, their quote, and once CLP books them the
 * full address and the tracking. Never the client's name or the other forwarders' prices.
 */
export default function ForwarderPage() {
  const params = useSearchParams();
  const link = useMemo(() => ({ id: params.get('id') ?? '', q: params.get('q') ?? '', k: params.get('k') ?? '' }), [params]);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const load = useCallback(async () => {
    try {
      setState(await fetchForwarder(link));
    } catch (err) {
      setState({ status: 'error', message: message(err) });
    }
  }, [link]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the link's shipment on open
    void load();
  }, [load]);
  const send = async (fn: () => Promise<ForwarderShipment>, ok: string) => {
    setBusy(true);
    setError('');
    try {
      setState({ status: 'ready', shipment: await fn() });
      setDone(ok);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={s.page} data-header-tone="dark">
      <div className={s.wrap}>
        <span className={s.kicker}>FREIGHT QUOTE</span>
        <h1 className={s.title}>Compete Like Pros Shipment</h1>
        {state.status === 'loading' && <p className={s.sub}>Loading the shipment…</p>}
        {state.status === 'invalid' && <p className={s.note}>This link doesn’t work any more. Ask Compete Like Pros for a new one.</p>}
        {state.status === 'error' && (
          <p className={s.note} role="alert">
            {state.message}{' '}
            <button type="button" className={f.link} onClick={() => void load()}>
              Try Again
            </button>
          </p>
        )}
        {state.status === 'ready' && <Shipment sh={state.shipment} busy={busy} error={error} done={done} onQuote={(input) => void send(() => sendQuote(link, input), 'Thanks, your quote is sent. We’ll e-mail you if we book you.')} onTracking={(input) => void send(() => sendTracking(link, input), 'Thanks, the tracking is sent.')} />}
        <p className={s.help}>
          Questions? Email <a href={`mailto:${CLP_EMAIL}`}>{CLP_EMAIL}</a> with the reference.
        </p>
      </div>
    </div>
  );
}

function Shipment({ sh, busy, error, done, onQuote, onTracking }: { sh: ForwarderShipment; busy: boolean; error: string; done: string; onQuote: Parameters<typeof QuoteForm>[0]['onSend']; onTracking: Parameters<typeof TrackingForm>[0]['onSend'] }) {
  const d = sh.details;
  const rows: [string, string][] = [
    ['Reference', sh.ref],
    ['How it travels', sh.modeLabel],
    ['From', d.from],
    [sh.booked ? 'Deliver to' : 'To (area)', d.to],
    ['Cartons', `${d.cartons}${d.weightKg ? ` · ${d.weightKg} kg` : ''}`],
    ...(d.hs ? ([['HS code', d.hs]] as [string, string][]) : []),
    ...(d.value ? ([['Goods value', money(d.value)]] as [string, string][]) : []),
    ...(d.readyBy ? ([['Ready by', trackDay(d.readyBy)]] as [string, string][]) : []),
  ];
  return (
    <>
      <p className={s.sub}>{`Hi ${sh.quote.forwarder}, ${sh.booked ? 'you’re booked for this shipment.' : 'can you quote this shipment?'}`}</p>
      <dl className={f.rows}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {done && <p className={f.done} role="status">{done}</p>}
      {sh.shipped ? (
        <p className={s.note}>It has shipped. Nothing more to send. Thank you.</p>
      ) : sh.closed ? (
        <p className={s.note}>Another forwarder was booked for this one. Thanks for quoting.</p>
      ) : sh.booked ? (
        <TrackingForm s={sh} busy={busy} error={error} onSend={onTracking} />
      ) : (
        <QuoteForm s={sh} busy={busy} error={error} onSend={onQuote} />
      )}
    </>
  );
}
