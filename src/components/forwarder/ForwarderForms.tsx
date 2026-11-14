'use client';

import { useState } from 'react';
import { FORWARDER_MODES, quoteProblem, type ForwarderMode, type ForwarderShipment } from '@/content/forwarder';
import f from './forwarder.module.css';

type Busy = { busy: boolean; error: string };

/** Their price, days in transit, how it travels and a note; sent again to change it until CLP books one. */
export function QuoteForm({ s, busy, error, onSend }: Busy & { s: ForwarderShipment; onSend: (input: { price: number; transitDays: number; mode: ForwarderMode; note: string }) => void }) {
  const q = s.quote;
  const [form, setForm] = useState({ price: q.price ? String(q.price) : '', days: q.transitDays ? String(q.transitDays) : '', mode: q.mode, note: q.note });
  const [tried, setTried] = useState(false);
  const problem = quoteProblem(form);
  const send = () => (problem ? setTried(true) : onSend({ price: Number(form.price.replace(/[$,]/g, '')), transitDays: Number(form.days), mode: form.mode, note: form.note.trim() }));
  return (
    <div className={f.box}>
      <strong className={f.label}>{q.status === 'quoted' ? 'YOUR QUOTE (YOU CAN CHANGE IT)' : 'YOUR QUOTE'}</strong>
      <div className={f.grid}>
        <label className={f.field}>
          Price, $ (door to door)
          <input inputMode="decimal" value={form.price} placeholder="e.g. 455" aria-invalid={tried && problem.startsWith('Enter your price')} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label className={f.field}>
          Days in transit
          <input inputMode="numeric" value={form.days} placeholder="e.g. 26" aria-invalid={tried && problem.startsWith('Enter the days')} onChange={(e) => setForm({ ...form, days: e.target.value })} />
        </label>
        <label className={f.field}>
          How it travels
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as ForwarderMode })}>
            {FORWARDER_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={f.field}>
        Note (optional)
        <textarea rows={2} maxLength={300} value={form.note} placeholder="e.g. LCL, port to door, duties not included" onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
      {tried && problem && <p className={f.error}>{problem}</p>}
      {error && <p className={f.error} role="alert">{error}</p>}
      <button type="button" className={f.dark} disabled={busy} onClick={send}>
        {busy ? 'Sending…' : q.status === 'quoted' ? 'Update Quote' : 'Send Quote'}
      </button>
    </div>
  );
}

/** Once booked: the booking, bill of lading or tracking number and when it arrives. */
export function TrackingForm({ s, busy, error, onSend }: Busy & { s: ForwarderShipment; onSend: (input: { number: string; eta: string }) => void }) {
  const t = s.quote.tracking;
  const [number, setNumber] = useState(t?.number ?? '');
  const [eta, setEta] = useState(t?.eta ?? '');
  const [tried, setTried] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const problem = !number.trim() ? 'Enter the booking, bill of lading or tracking number.' : eta && eta < today ? 'The arrival date can’t be before today.' : '';
  return (
    <div className={f.box}>
      <strong className={f.label}>TRACKING</strong>
      <p className={f.text}>{t ? `Sent: ${t.number}. Compete Like Pros ships the order with it once it’s ready.` : 'Send the booking, bill of lading or tracking number once it’s on its way.'}</p>
      <div className={f.grid}>
        <label className={f.field}>
          Booking, B/L or tracking number
          <input value={number} maxLength={40} aria-invalid={tried && !number.trim()} onChange={(e) => setNumber(e.target.value)} />
        </label>
        <label className={f.field}>
          Arrives by (optional)
          <input type="date" min={today} value={eta} onChange={(e) => setEta(e.target.value)} />
        </label>
      </div>
      {tried && problem && <p className={f.error}>{problem}</p>}
      {error && <p className={f.error} role="alert">{error}</p>}
      <button type="button" className={f.dark} disabled={busy} onClick={() => (problem ? setTried(true) : onSend({ number: number.trim(), eta }))}>
        {busy ? 'Sending…' : t ? 'Update Tracking' : 'Send Tracking'}
      </button>
    </div>
  );
}
