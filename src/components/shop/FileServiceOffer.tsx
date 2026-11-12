import type { BulkRequest, FileKey, RequestAction, RequestActionInput } from '@/content/bulk';
import st from './requestStage.module.css';

type Act = (action: RequestAction, input: RequestActionInput) => void;
const price = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/**
 * A paid artwork service we offered on this file (the client's rules): what and how much, with Accept (added to their
 * order, we make the file) or I'll Send My Own; once answered, what they chose.
 */
export default function FileServiceOffer({ r, k, busy, act }: { r: BulkRequest; k: FileKey; busy: string; act: Act }) {
  const list = (r.services ?? []).filter((s) => s.fileKey === k && s.status !== 'cancelled');
  const offer = list.find((s) => s.status === 'offered');
  const accepted = list.filter((s) => s.status === 'accepted');
  if (!offer && !accepted.length) return null;
  return (
    <span style={{ display: 'grid', gap: 6, fontSize: 13 }}>
      {accepted.map((s) => (
        <span key={s.id}>
          {s.askedBy === 'client' ? 'You asked us to make it: ' : 'Service accepted: '}
          <b>{s.label}</b> ({price(s.price)}, added to your order).
        </span>
      ))}
      {offer && (
        <>
          <span>
            We can do this for you: <b>{offer.label}</b> for <b>{price(offer.price)}</b>, added to your order.{offer.note ? ` ${offer.note}.` : ''}
          </span>
          <span className={st.acts}>
            <button type="button" className={st.dark} disabled={Boolean(busy)} onClick={() => act('accept-service', { serviceId: offer.id })}>
              {busy === 'accept-service' ? 'Accepting…' : `Accept · ${price(offer.price)}`}
            </button>
            <button type="button" className={st.light} disabled={Boolean(busy)} onClick={() => act('decline-service', { serviceId: offer.id })}>
              {busy === 'decline-service' ? 'Sending…' : 'I’ll Send My Own'}
            </button>
          </span>
        </>
      )}
    </span>
  );
}
