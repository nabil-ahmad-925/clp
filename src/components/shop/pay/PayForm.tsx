'use client';

import { useState } from 'react';
import type { BulkRequest, PayKind, PayMethod, RequestActionInput } from '@/content/bulk';
import { money } from './PaySummary';
import p from './pay.module.css';

const OPTION_WORDS: Record<PayKind, [string, string]> = {
  deposit: ['50% deposit', 'Starts production once your proof is approved. The rest is due before shipping.'],
  full: ['Pay in full', 'Nothing more to pay later.'],
  balance: ['Balance', 'What’s left. Your order ships once it’s confirmed.'],
};
const METHODS: [PayMethod | 'card', string][] = [
  ['bank', 'Bank transfer'],
  ['zelle', 'Zelle'],
  ['check', 'Check'],
  ['card', 'Card'],
];

/**
 * How much (the deposit or all of it, later the balance), how (bank transfer, Zelle or check, with CLP's details), and
 * the transfer's reference. Card waits for the payment provider. Sending it tells CLP, who confirms it.
 */
export default function PayForm({ r, busy, error, onSend }: { r: BulkRequest; busy: boolean; error: string; onSend: (input: RequestActionInput) => void }) {
  const opts = r.payOptions ?? [];
  const [kind, setKind] = useState<PayKind>(opts[0]!.kind);
  const [method, setMethod] = useState<PayMethod | 'card'>('bank');
  const [reference, setReference] = useState('');
  const [sentOn, setSentOn] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const to = r.payTo;
  const amount = opts.find((o) => o.kind === kind)?.amount ?? 0;
  const missing = method === 'card' ? '' : !reference.trim() ? (method === 'check' ? 'Enter the check number.' : 'Enter the transfer or Zelle confirmation number.') : '';
  const send = () => (missing ? setTried(true) : method !== 'card' && onSend({ kind, method, reference: reference.trim(), sentOn, note: note.trim() }));
  const details = method === 'bank' ? to?.bank : method === 'zelle' ? to?.zelle : method === 'check' ? to?.checks : '';
  return (
    <section className={p.card} aria-label="Pay">
      <span className={p.kicker}>WHAT YOU PAY NOW</span>
      <div className={p.options} role="radiogroup" aria-label="What you pay now">
        {opts.map((o) => (
          <button key={o.kind} type="button" role="radio" aria-checked={kind === o.kind} className={p.option} onClick={() => setKind(o.kind)}>
            <b>
              {OPTION_WORDS[o.kind][0]} · {money(o.amount)}
            </b>
            <span>{OPTION_WORDS[o.kind][1]}</span>
          </button>
        ))}
      </div>
      <span className={p.kicker}>HOW YOU PAY</span>
      <div className={p.tabs} role="tablist" aria-label="How you pay">
        {METHODS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={method === id} className={p.tab} onClick={() => setMethod(id)}>
            {label}
          </button>
        ))}
      </div>
      {method === 'card' ? (
        <p className={p.note}>Card payments are coming soon. Pay by bank transfer, Zelle or check for now.</p>
      ) : (
        <>
          <div className={p.details}>
            <span className={p.mut}>Send {money(amount)} to {to?.payee || 'Compete Like Pros'}</span>
            <pre>{details || 'Our details are on their way. Reply to your quote e-mail and we’ll send them.'}</pre>
            <span className={p.mut}>Put {r.ref} on the payment so we can match it.{to?.note ? ` ${to.note}` : ''}</span>
          </div>
          <div className={p.fields}>
            <label>
              {method === 'check' ? 'Check number' : 'Transfer or Zelle confirmation number'}
              <input value={reference} maxLength={120} aria-invalid={tried && Boolean(missing)} onChange={(e) => setReference(e.target.value)} />
            </label>
            <label>
              {method === 'check' ? 'Date mailed' : 'Date sent'} (optional)
              <input type="date" value={sentOn} onChange={(e) => setSentOn(e.target.value)} />
            </label>
          </div>
          <label className={p.full}>
            Note for our team (optional)
            <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {(tried && missing) || error ? (
            <span className={p.error} role="alert">
              {tried && missing ? missing : error}
            </span>
          ) : null}
          <button type="button" className={p.pay} disabled={busy} onClick={send}>
            {busy ? 'Sending…' : `I’ve Sent ${money(amount)}`}
          </button>
          <span className={p.mut}>We confirm it once it’s in our account, usually within 1 business day, and e-mail you a receipt.</span>
        </>
      )}
    </section>
  );
}
