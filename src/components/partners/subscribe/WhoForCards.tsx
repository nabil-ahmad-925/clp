import c from '../contact/contact.module.css';
import type { Who } from './subscribeForm';
import u from './subscribe.module.css';

const CHOICES: { id: Who; title: string; line: string }[] = [
  { id: 'self', title: 'Myself', line: 'I’m 18 or older' },
  { id: 'child', title: 'My child or a minor in my care', line: 'I’m their parent or legal guardian' },
];

/** 0. Who is this for? (the child option only when picked; its updates come to the parent). */
export default function WhoForCards({ who, onWho }: { who: Who; onWho: (w: Who) => void }) {
  return (
    <fieldset className={u.section}>
      <legend className={u.legend}>
        Who is this for?
      </legend>
      <div className={u.choices}>
        {CHOICES.map((x) => (
          <label key={x.id} className={u.choice}>
            <input type="radio" name="who" checked={who === x.id} onChange={() => onWho(x.id)} />
            <span className={u.choiceText}>
              <strong>{x.title}</strong>
              <span>{x.line}</span>
            </span>
          </label>
        ))}
      </div>
      <span className={c.note}>
        {who === 'child' ? 'Updates come to you, never to the child. We only ask for their first name.' : 'Under 18? Ask a parent or guardian to sign up for you.'}
      </span>
    </fieldset>
  );
}
