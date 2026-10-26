'use client';
/* eslint-disable @next/next/no-img-element -- a request's mockup, as it was sent. */

import { useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { designAction, guestRequestAction, uploadGuestImage, type BulkRequest, type RequestAction, type RequestActionInput } from '@/content/bulk';
import { uploadImage } from '@/content/partnerSession';
import { money, wsItem } from '@/content/wholesale';
import { imageDataUrl } from './useStudio';
import type { Wholesale } from './wholesaleStore';
import WsMock from './WsMock';
import w from './wholesale.module.css';

const CLP_EMAIL = 'hello@competelikepros.com';
const TRACK = ['Submitted', 'Artwork check', 'Quote / proof', 'In production', 'Shipped'];
const TRACK_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  DHL: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?tracking-id=',
};
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const expired = (r: BulkRequest) => r.status === 'quoted' && Boolean(r.quote) && new Date(r.quote!.validUntil).getTime() < Date.now();
/** What needs the requester: a quote to approve, or new artwork to send. */
export const needsYou = (r: BulkRequest) => r.status === 'changes' || (r.status === 'quoted' && Boolean(r.quote) && !expired(r));

/** Where a request is (the board's chips and its 5-step tracker). */
function statusOf(r: BulkRequest): [string, string, string, number] {
  if (r.status === 'changes') return ['Changes requested', '#FBEAE8', '#B03A2E', 1];
  if (r.status === 'art') return ['Artwork in review', '#FBF3E2', '#8A6F33', 1];
  if (r.status === 'quoted') return expired(r) ? ['Quote expired', '#F2F1ED', '#666666', 2] : ['Quote ready', '#111111', '#FFFFFF', 2];
  if (r.status === 'in-production') return ['In production', '#E7F3EC', '#1E7A45', 3];
  if (r.status === 'shipped') return ['Shipped', '#E7F3EC', '#1E7A45', 4];
  if (r.status === 'closed') return [r.reply?.kind === 'declined' ? 'Declined' : 'Closed', '#F2F1ED', '#666666', 0];
  return [r.reply?.kind === 'changes' ? 'Updating your quote' : 'Preparing your quote', '#F2F1ED', '#444444', 2];
}

/** The note on a request: who it's from and what it says. */
function noteOf(r: BulkRequest): [string, string, string] | null {
  const q = r.quote;
  if (r.status === 'quoted' && q)
    return [
      'QUOTE FROM THE CLP TEAM',
      `${money(q.unitPrice)} each · ${q.qty} pieces · ${money(q.total)} total${q.lead ? ` · ready in ${q.lead}` : ''}. ${expired(r) ? `Expired ${day(q.validUntil)}. Ask for changes and we’ll send an updated one.` : `Valid until ${day(q.validUntil)}. Approving starts production.`}`,
      '#F7F6F3',
    ];
  if (r.status === 'quoted') return ['QUOTE FROM THE CLP TEAM', 'We e-mailed you your quote. Reply to that e-mail to approve it or ask for changes.', '#F7F6F3'];
  if (r.status === 'changes') return ['FROM THE CLP TEAM', r.art?.note || 'Your artwork needs a change before production.', '#FBEAE8'];
  if (r.reply?.kind === 'changes' && r.status !== 'closed') return ['YOUR REQUEST', `You asked for changes ${day(r.reply.at)}: “${r.reply.note}”. We’ll send an updated quote.`, '#F7F6F3'];
  if (r.art?.state === 'resubmitted' && ['art', 'quote', 'maker', 'maker-in'].includes(r.status)) return ['YOUR UPDATE', `New file sent ${day(r.art.at)}. Our team is checking it with your quote.`, '#F7F6F3'];
  if (r.status === 'in-production') return ['UPDATE', `Approved${r.approvedAt ? ` ${day(r.approvedAt)}` : ''}${q ? ` · ${money(q.total)}` : ''}. It’s being made${q?.lead ? `, ready in ${q.lead}` : ''}. We’ll e-mail you the tracking when it ships.`, '#F7F6F3'];
  if (r.status === 'closed' && r.reply?.kind === 'declined') return ['YOUR REQUEST', `You declined this quote ${day(r.reply.at)}.`, '#F7F6F3'];
  if (['quote', 'maker', 'maker-in', 'new', 'art'].includes(r.status)) return ['UPDATE', 'We’re preparing your quote. Expect it within 2 business days.', '#F7F6F3'];
  return null;
}

/**
 * Quote Requests (the Wholesale board's page): every quote request and order with its status, where it is, the CLP
 * team's note (the quote, an artwork change, the approval), tracking once it ships, and what to do next: approve the
 * quote, ask for changes, decline, send new artwork, or contact us.
 */
export default function WholesaleRequests({ items, partner, ws, onChange, onSaved }: { items: BulkRequest[]; partner: boolean; ws: Wholesale; onChange: (r: BulkRequest) => void; onSaved?: () => void }) {
  const [contact, setContact] = useState<BulkRequest | 'general' | null>(null);
  const list = items.filter((r) => r.kind !== 'saved');
  const saved = items.length - list.length;
  const waiting = list.filter(needsYou).length;
  return (
    <section className={w.reqPage}>
      <div className={w.reqPageHead}>
        <span>
          <h2>Quote Requests</h2>
          <span>Artwork approvals, quotes and orders in one place.</span>
        </span>
        <span className={w.reqPageRight}>
          <span>{waiting ? `${waiting} ${waiting === 1 ? 'needs' : 'need'} your attention` : 'Nothing needs you right now'}</span>
          {partner && saved > 0 && onSaved && (
            <button type="button" className={w.pillBtn} onClick={onSaved}>
              Saved designs ({saved})
            </button>
          )}
          <button type="button" className={w.pillBtn} onClick={() => setContact('general')}>
            Contact Us
          </button>
        </span>
      </div>
      {list.length === 0 && (
        <div className={w.empty}>
          <strong>No quote requests yet</strong>
          <span>Open any item, add your logo and quantities, and request a quote. It shows here with every update.</span>
        </div>
      )}
      {list.map((r) => (
        <RequestCard key={r.id} r={r} partner={partner} ws={ws} onChange={onChange} onContact={() => setContact(r)} />
      ))}
      {contact && <ContactModal r={contact === 'general' ? null : contact} onClose={() => setContact(null)} />}
    </section>
  );
}

function RequestCard({ r, partner, ws, onChange, onContact }: { r: BulkRequest; partner: boolean; ws: Wholesale; onChange: (r: BulkRequest) => void; onContact: () => void }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState<'' | 'changes' | 'decline'>('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const it = wsItem(String((r.design as { wholesaleItem?: string } | null)?.wholesaleItem ?? ''));
  const [chip, bg, fg, step] = statusOf(r);
  const n = noteOf(r);
  const q = r.quote;
  const act = async (action: RequestAction, input: RequestActionInput = {}) => {
    setBusy(action);
    setError('');
    try {
      onChange(await (partner ? designAction : guestRequestAction)(r.id, action, input));
      setOpen('');
      setNote('');
      setLink('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t go through. Please try again.');
    } finally {
      setBusy('');
    }
  };
  const sendFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('new-artwork');
    setError('');
    try {
      const logo = partner ? await uploadImage(file) : await uploadGuestImage(await imageDataUrl(file, 1500));
      await act('new-artwork', { logo });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file didn’t upload. Try a PNG or JPG.');
      setBusy('');
    }
  };
  return (
    <div className={w.reqCard} data-on={needsYou(r)}>
      <span className={w.reqThumbBig}>
        {r.mockup ? <img src={r.mockup} alt="" /> : it ? <WsMock item={it} asset={ws.asset(ws.lg)} color={ws.ic} className={w.cardSvgFull} /> : <span className={w.reqThumbNone}>{r.itemName.slice(0, 1)}</span>}
      </span>
      <div className={w.reqBody}>
        <div className={w.reqTop}>
          <span>
            <strong>{it?.name ?? r.itemName}</strong>
            <span>{[r.ref, `${r.qty} ${r.qty === 1 ? 'piece' : 'pieces'}`, `Sent ${day(r.createdAt)}`, q ? money(q.total) : ''].filter(Boolean).join(' · ')}</span>
          </span>
          <span className={w.reqChip} style={{ background: bg, color: fg }}>
            {chip}
          </span>
        </div>
        {r.status !== 'closed' && (
          <div className={w.reqTrack}>
            {TRACK.map((label, i) => (
              <span key={label} data-on={i <= step} data-now={i === step}>
                <i />
                {label}
              </span>
            ))}
          </div>
        )}
        {n && (
          <div className={w.reqNoteBox} style={{ background: n[2] }}>
            <strong>{n[0]}</strong>
            <span>{n[1]}</span>
          </div>
        )}
        {r.status === 'shipped' && r.shipping && (
          <div className={w.reqTrackBox}>
            <strong>TRACKING</strong>
            {r.shipping.boxes.map((b, i) => (
              <div key={i}>
                <strong>
                  Box {i + 1} of {r.shipping!.boxes.length}
                </strong>
                <span>
                  {b.carrier} · {b.number}
                  <span>Shipped {day(r.shipping!.shippedAt)}</span>
                </span>
                {TRACK_URLS[b.carrier] ? (
                  <a href={TRACK_URLS[b.carrier] + encodeURIComponent(b.number)} target="_blank" rel="noopener noreferrer">
                    Track ↗
                  </a>
                ) : (
                  <span />
                )}
              </div>
            ))}
            <span className={w.fine}>We e-mail you when each box ships, with its tracking link.</span>
          </div>
        )}
        {r.status === 'changes' && (
          <div className={w.reqFile}>
            <span>
              <span className={w.kicker}>NEW ARTWORK</span>
              <strong>Send an updated file</strong>
              <span>A PNG or JPG upload, or a link to a vector file (AI, EPS, SVG, PDF).</span>
            </span>
            <span className={w.reqFileRow}>
              <button type="button" className={w.darkSm} disabled={Boolean(busy)} onClick={() => fileRef.current?.click()}>
                {busy === 'new-artwork' ? 'Sending…' : 'Upload New File'}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={sendFile} />
              <input className={w.reqLink} type="url" placeholder="https://" value={link} maxLength={490} aria-label="Link to your file" onChange={(e) => setLink(e.target.value)} />
              <button type="button" className={w.lightSm} disabled={Boolean(busy) || !link.trim()} onClick={() => act('new-artwork', { link: link.trim() })}>
                Send Link
              </button>
            </span>
          </div>
        )}
        {open && (
          <div className={w.reqAsk}>
            <label className={w.field}>
              {open === 'changes' ? 'What should we change? Quantity, sizes, price, timing…' : 'Why are you declining? (optional)'}
              <textarea className={w.textarea} rows={3} maxLength={1000} value={note} autoFocus onChange={(e) => setNote(e.target.value)} />
            </label>
            <span className={w.reqActs}>
              <button type="button" className={w.darkSm} disabled={Boolean(busy) || (open === 'changes' && !note.trim())} onClick={() => act(open === 'changes' ? 'ask-changes' : 'decline', { note: note.trim() })}>
                {busy ? 'Sending…' : open === 'changes' ? 'Send to Our Team' : 'Decline Quote'}
              </button>
              <button type="button" className={w.textBtn} onClick={() => setOpen('')}>
                Cancel
              </button>
            </span>
          </div>
        )}
        {error && (
          <span className={w.error} role="alert">
            {error}
          </span>
        )}
        <div className={w.reqFoot}>
          <span>{it ? `Handled by ${it.src === 'direct' ? 'a CLP maker partner' : 'the CLP team'}` : 'Handled by the CLP team'}</span>
          <span className={w.reqActs}>
            {r.status === 'quoted' && q && !expired(r) && (
              <button type="button" className={w.darkMd} disabled={Boolean(busy)} onClick={() => act('approve-quote')}>
                {busy === 'approve-quote' ? 'Approving…' : `Approve quote · ${money(q.total)}`}
              </button>
            )}
            {r.status === 'quoted' && (
              <>
                <button type="button" className={w.lightMd} aria-expanded={open === 'changes'} disabled={Boolean(busy)} onClick={() => setOpen(open === 'changes' ? '' : 'changes')}>
                  Ask for Changes
                </button>
                <button type="button" className={w.textBtn} aria-expanded={open === 'decline'} disabled={Boolean(busy)} onClick={() => setOpen(open === 'decline' ? '' : 'decline')}>
                  Decline
                </button>
              </>
            )}
            <button type="button" className={w.lightMd} onClick={onContact}>
              Contact Us
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

const TOPICS: [string, string, string, string, [string, string, string][]][] = [
  ['order', '📦', 'About this order', 'Status, proof, sizes or anything on this request', []],
  ['add', '➕', 'Add more items or quantities', 'More pieces, matching items or another size run', [
    ['what', 'What do you want to add?', 'e.g. 24 more hoodies or matching caps'],
    ['qty', 'How many?', 'e.g. 24'],
  ]],
  ['art', '🎨', 'Change the artwork or design', 'Placement, colors, names or a new file', [['chg', 'What should change?', 'e.g. bigger logo on the back, add names']]],
  ['ship', '🚚', 'Shipping or a deadline', 'Delivery date, address or an event date', [
    ['by', 'Need it by', ''],
    ['to', 'Ship to (city or ZIP)', 'e.g. Worcester, MA'],
  ]],
  ['pay', '💳', 'Billing, invoice or payment', 'PO, invoice, tax exempt or receipts', [['po', 'PO or invoice number (if you have one)', 'e.g. PO-2026-0418']]],
  ['other', '💬', 'Something else', 'Anything we can help with', []],
];

/** Contact Us (the board's): pick a topic, add the details and a message, and it opens as an e-mail to the CLP team. */
function ContactModal({ r, onClose }: { r: BulkRequest | null; onClose: () => void }) {
  const [topic, setTopic] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [reach, setReach] = useState('Email');
  const [sent, setSent] = useState(false);
  const t = TOPICS.find((x) => x[0] === topic);
  const ref = r ? `${r.ref ?? ''} · ${wsItem(String((r.design as { wholesaleItem?: string } | null)?.wholesaleItem ?? ''))?.name ?? r.itemName}` : 'General question';
  const send = () => {
    const lines = [...(t?.[4] ?? []).filter(([k]) => fields[k]).map(([k, label]) => `${label} ${fields[k]}`), msg.trim(), `Best way to reach me: ${reach}`].filter(Boolean);
    const subject = `${r?.ref ? `${r.ref} · ` : ''}${t?.[2] ?? 'Question'}`;
    window.location.assign(`mailto:${CLP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n\n'))}`);
    setSent(true);
  };
  return createPortal(
    <div className={w.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={w.contactBox} role="dialog" aria-modal="true" aria-label="Contact Us">
        <div className={w.saveHead}>
          <span>
            <strong>Contact Us</strong>
            <span>{ref}</span>
          </span>
          <button type="button" className={w.panelClose} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {sent ? (
          <div className={w.contactSent}>
            <span className={w.doneMark}>✓</span>
            <strong>Your e-mail is ready</strong>
            <span>Your e-mail app opened with your message to the CLP team ({CLP_EMAIL}). Send it from there, and we reply within 1 business day.</span>
            <button type="button" className={w.doneDark} onClick={onClose}>
              Done
            </button>
          </div>
        ) : !t ? (
          <div className={w.topics}>
            <strong>What can we help with?</strong>
            {TOPICS.filter(([id]) => r || id !== 'order').map(([id, icon, label, sub]) => (
              <button key={id} type="button" onClick={() => setTopic(id)}>
                <span>{icon}</span>
                <span>
                  <strong>{label}</strong>
                  <span>{sub}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className={w.contactForm}>
            <span className={w.contactTopic}>
              <strong>
                {t[1]} {t[2]}
              </strong>
              <button type="button" className={w.textBtn} onClick={() => setTopic('')}>
                Change Topic
              </button>
            </span>
            {t[4].map(([k, label, ph]) => (
              <label key={k} className={w.field}>
                {label}
                <input type={k === 'by' ? 'date' : 'text'} value={fields[k] ?? ''} placeholder={ph} onChange={(e) => setFields({ ...fields, [k]: e.target.value })} />
              </label>
            ))}
            <label className={w.field}>
              Message
              <textarea className={w.textarea} rows={4} value={msg} placeholder={t[0] === 'order' && r ? `What would you like to know about ${r.ref ?? 'your order'}?` : 'Tell us a little more…'} onChange={(e) => setMsg(e.target.value)} />
            </label>
            <span className={w.field}>
              Best way to reach you
              <span className={w.pills}>
                {['Email', 'Text', 'Call'].map((x) => (
                  <button key={x} type="button" className={w.pill} aria-pressed={reach === x} onClick={() => setReach(x)}>
                    {x}
                  </button>
                ))}
              </span>
            </span>
            <button type="button" className={w.doneDark} onClick={send}>
              Send to the CLP Team
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
