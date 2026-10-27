import type { ContactTopic, TopicId } from './contactTopics';
import c from './contact.module.css';

/** Step 1: "What's this about?", the six topics as cards. */
export default function ContactTopicStep({ topics, short, onPick }: { topics: ContactTopic[]; short: string; onPick: (id: TopicId) => void }) {
  return (
    <div className={c.body}>
      <strong className={c.question}>What’s this about?</strong>
      <div className={c.grid}>
        {topics.map((t) => (
          <button key={t.id} type="button" className={c.card} onClick={() => onPick(t.id)}>
            <span className={c.cardText}>
              <strong>{t.label}</strong>
              <span>{t.line}</span>
            </span>
            <svg className={c.chevron} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        ))}
      </div>
      <span className={c.note}>Picking a topic sends your message to the right person at {short}, so you get a faster answer.</span>
    </div>
  );
}
