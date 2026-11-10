import { AUDIENCES, roleCopy, type Audience } from '@/content/expectationsRoles';
import styles from './expectations.module.css';

/** "I'm a" Player | Parent or Guardian | Partner or Host: the white card on the heading's edge (where the FAQ's search sits). */
export default function AudienceSwitch({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className={styles.switchSlot}>
      <div className={styles.switchCard}>
        <span className={styles.switchLabel}>I’m a</span>
        <div className={styles.switchGroup} role="group" aria-label="Who is this for">
          {AUDIENCES.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={a === value}
              className={`${styles.switchOption} ${a === value ? styles.switchOn : ''}`}
              onClick={() => onChange(a)}
            >
              {roleCopy[a].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
