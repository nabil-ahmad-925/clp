'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { fetchTracking, trackDay, type Tracking } from '@/content/track';
import { shopHref } from '@/content/storefront';
import { TrackBoxes, TrackSteps } from './TrackParts';
import s from './track.module.css';

const CLP_EMAIL = 'hello@competelikepros.com';
/** Read again while open, so a box out for delivery or delivered shows without a reload. */
const REFRESH_MS = 60_000;
type State = { status: 'loading' } | { status: 'invalid' } | { status: 'error'; message: string } | { status: 'ready'; order: Tracking };

/**
 * An order's CLP-branded tracking page (the client's answers: "WeSupply-like, simpler"), from the link in its shipping
 * e-mails: where it is, the five steps, when it arrives (and any delay), and each box with its carrier link.
 */
export default function TrackPage() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const key = params.get('k') ?? '';
  const [state, setState] = useState<State>({ status: 'loading' });
  const load = useCallback(async () => {
    try {
      const order = await fetchTracking(id, key);
      setState(order ? { status: 'ready', order } : { status: 'invalid' });
    } catch (err) {
      setState((was) => (was.status === 'ready' ? was : { status: 'error', message: err instanceof Error ? err.message : 'Could not load your order.' }));
    }
  }, [id, key]);
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className={s.page} data-header-tone="dark">
      <div className={s.wrap}>
        <span className={s.kicker}>ORDER TRACKING</span>
        <h1 className={s.title}>Track Your Order</h1>
        {state.status === 'loading' && <p className={s.sub}>Loading your order…</p>}
        {state.status === 'invalid' && <p className={s.note}>We couldn’t find that order. Open the link from your e-mail again, or contact us.</p>}
        {state.status === 'error' && (
          <p className={s.note} role="alert">
            {state.message}{' '}
            <button type="button" onClick={() => void load()} style={{ font: 'inherit', fontWeight: 700, background: 'none', border: 0, textDecoration: 'underline', cursor: 'pointer' }}>
              Try Again
            </button>
          </p>
        )}
        {state.status === 'ready' && <Order o={state.order} />}
        <p className={s.help}>
          Questions about your delivery? Email <a href={`mailto:${CLP_EMAIL}`}>{CLP_EMAIL}</a> with your reference, or see everything about your order in <Link href={shopHref({ view: 'bulk', requests: '1' })}>Quote Requests</Link>.
        </p>
      </div>
    </div>
  );
}

function Order({ o }: { o: Tracking }) {
  const done = o.status === 'Delivered';
  return (
    <>
      <div className={s.head}>
        <p className={s.sub}>{`${o.ref} · ${o.qty} × ${o.itemName}`}</p>
        <span className={s.chip} data-tone={done ? '' : 'transit'}>
          {o.status}
        </span>
      </div>
      {o.delayedAt && o.eta && !done && <p className={`${s.note} ${s.late}`}>{`Running late. It was due ${o.etaWas ? trackDay(o.etaWas) : 'earlier'} and now arrives by ${trackDay(o.eta)}. We’re sorry for the wait.`}</p>}
      {o.eta && !done && !o.delayedAt && <p className={s.note}>{`Arrives by ${trackDay(o.eta)}`}</p>}
      {done && <p className={s.note}>Every box was delivered. Anything wrong with your order? Email us and we’ll make it right.</p>}
      <TrackSteps steps={o.steps} />
      {o.boxes.length > 0 && <TrackBoxes boxes={o.boxes} />}
    </>
  );
}
