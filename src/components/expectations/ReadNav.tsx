import styles from './expectations.module.css';

type Props = {
  prev: { title: string } | null;
  next: { title: string } | null;
  progress: string;
  onPrev: () => void;
  onNext: () => void;
};

/** The end of a section: ← the previous one, how many are read, Next: the following one (or on to the agreement). */
export default function ReadNav({ prev, next, progress, onPrev, onNext }: Props) {
  return (
    <div className={styles.readNav}>
      {prev ? (
        <button type="button" className={styles.back} onClick={onPrev}>
          <span aria-hidden>←</span> {prev.title}
        </button>
      ) : (
        <span />
      )}
      <span className={styles.progress} role="status">
        {progress}
      </span>
      <button type="button" className={styles.next} onClick={onNext}>
        {next ? `Next: ${next.title}` : 'Done Reading'} <span aria-hidden>→</span>
      </button>
    </div>
  );
}
