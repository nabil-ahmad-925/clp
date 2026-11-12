import Link from 'next/link';
import type { BulkRequest, RequestAction, RequestActionInput } from '@/content/bulk';
import { BOX_WORDS } from '@/content/track';
import st from './requestStage.module.css';
import w from './wholesale.module.css';

type Act = (action: RequestAction, input: RequestActionInput) => void;
const TRACK_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  DHL: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?tracking-id=',
};
// A date alone (the arrival date) is read at midday, so it never shows as the day before.
const day = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** It shipped and hasn't arrived: they can tell us it did (clp-api shared/bulk-shipping.mjs). */
export const awaitingDelivery = (r: BulkRequest) => r.status === 'shipped' && Boolean(r.shipping) && !r.shipping?.deliveredAt;

/**
 * Their shipment on Quote Requests: each box with its carrier, tracking number, its step (in transit, out for delivery,
 * delivered) and Track link, when it should arrive (and any delay), once it's there when, and their tracking page.
 * While it's on its way, We Got It tells CLP it arrived.
 */
export default function RequestShipping({ r, busy, act }: { r: BulkRequest; busy: string; act: Act }) {
  const s = r.shipping;
  if (!s) return null;
  const n = s.boxes.length;
  return (
    <div className={w.reqTrackBox}>
      <strong>{s.deliveredAt ? 'DELIVERED' : 'TRACKING'}</strong>
      {s.boxes.map((b, i) => (
        <div key={`${b.number}-${i}`}>
          <strong>
            Box {i + 1} of {n}
          </strong>
          <span>
            {b.carrier} · {b.number}
            <span>{b.status === 'delivered' && b.deliveredAt ? `Delivered ${day(b.deliveredAt)}` : b.status === 'out' ? 'Out for delivery' : `${BOX_WORDS.shipped} · shipped ${day(s.shippedAt)}`}</span>
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
      {s.deliveredAt ? (
        <span style={{ color: '#1E7A45', fontWeight: 700, fontSize: 14 }}>{`✓ Delivered ${day(s.deliveredAt)}${s.deliveredBy === 'client' ? ', you told us it arrived' : ''}`}</span>
      ) : (
        s.eta && <span style={{ fontSize: 14, ...(s.delayedAt ? { color: '#8A2A20', fontWeight: 700 } : {}) }}>{s.delayedAt && s.etaWas ? `Running late: now arrives by ${day(s.eta)} (was ${day(s.etaWas)})` : `Arrives by ${day(s.eta)}`}</span>
      )}
      {r.trackKey && (
        <Link href={`/track/?id=${encodeURIComponent(r.id)}&k=${encodeURIComponent(r.trackKey)}`} style={{ fontSize: 14 }}>
          Open Your Tracking Page →
        </Link>
      )}
      {awaitingDelivery(r) && (
        <span className={st.acts} style={{ alignItems: 'center' }}>
          <button type="button" className={st.dark} disabled={Boolean(busy)} onClick={() => act('confirm-delivered', {})}>
            {busy === 'confirm-delivered' ? 'Saving…' : 'We Got It'}
          </button>
          <span className={w.fine}>Got every box? Let us know. Something wrong with it? Contact us.</span>
        </span>
      )}
      {s.trackingAt && !s.deliveredAt && <span className={w.fine}>{`Tracking updated ${day(s.trackingAt)}.`}</span>}
    </div>
  );
}
