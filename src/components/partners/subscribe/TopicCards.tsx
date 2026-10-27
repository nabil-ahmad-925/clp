import { TOPICS } from './subscribeForm';
import u from './subscribe.module.css';

/** 1. What do you want to hear about? (checkbox cards; the first two start checked). */
export default function TopicCards({ topics, onTopics }: { topics: string[]; onTopics: (t: string[]) => void }) {
  const flip = (id: string) => onTopics(topics.includes(id) ? topics.filter((t) => t !== id) : [...topics, id]);
  return (
    <fieldset className={u.section}>
      <legend className={u.legend}>
        What do you want to hear about?
      </legend>
      <div className={u.choices}>
        {TOPICS.map((t) => (
          <label key={t.id} className={u.choice}>
            <input type="checkbox" checked={topics.includes(t.id)} onChange={() => flip(t.id)} />
            <span className={u.choiceText}>
              <strong>{t.title}</strong>
              <span>{t.line}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
