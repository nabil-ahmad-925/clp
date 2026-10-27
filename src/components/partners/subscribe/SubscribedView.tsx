import c from '../contact/contact.module.css';
import { summaryOf } from './subscribeForm';
import type { SavedSubscription } from './subscriptionStore';
import u from './subscribe.module.css';

type Props = { short: string; sub: SavedSubscription; busy: boolean; error: string; onDone: () => void; onUnsubscribe: () => void };

/** 5. The confirmation (also what "✓ Subscribed" reopens): what they'll get, Done and Unsubscribe. */
export default function SubscribedView({ short, sub, busy, error, onDone, onUnsubscribe }: Props) {
  return (
    <div className={c.sent}>
      <span className={c.check}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#fff" strokeWidth="3.5" aria-hidden>
          <path d="M7 16.5l6 6L25 10" />
        </svg>
      </span>
      <strong className={c.sentTitle}>You’re subscribed to {short}</strong>
      <p className={c.after}>{summaryOf(sub.topics, sub.channels, sub.childName, short)}</p>
      <p className={u.note}>Change topics or unsubscribe anytime in your CLP account. Texts: reply STOP to cancel.</p>
      {error && <span className={c.error}>{error}</span>}
      <div className={u.actions}>
        <button type="button" className={c.done} onClick={onDone}>
          Done
        </button>
        <button type="button" className={u.unsubscribe} disabled={busy} onClick={onUnsubscribe}>
          {busy ? 'Unsubscribing…' : 'Unsubscribe'}
        </button>
      </div>
    </div>
  );
}
