import Link from 'next/link';
import type { ContactTopic } from './contactTopics';
import c from './contact.module.css';

/** Step 3: sent, the topic, what happens next, and the conversation (its private link, also kept on this device). */
export default function ContactSentStep({ short, topic, path, onDone }: { short: string; topic: ContactTopic; path: string; onDone: () => void }) {
  return (
    <div className={c.sent}>
      <span className={c.check}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#fff" strokeWidth="3.5" aria-hidden>
          <path d="M7 16.5l6 6L25 10" />
        </svg>
      </span>
      <strong className={c.sentTitle}>Sent to {short}</strong>
      <span className={c.tag}>{topic.label}</span>
      <p className={c.after}>{topic.after}</p>
      <Link className={c.open} href={path}>
        Open the Conversation
      </Link>
      <button type="button" className={c.done} onClick={onDone}>
        Done
      </button>
    </div>
  );
}
