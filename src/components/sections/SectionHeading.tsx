import SplitHeading from '@/components/ui/SplitHeading';
import { Container } from '@/components/ui/Section';
import styles from './SectionHeading.module.css';

type Props = {
  title: string;
  /** Optional paragraph under the heading (service pages). */
  text?: string;
  /** Top spacing above the heading. */
  spaced?: boolean;
  /** Half-width column (the original's 3 / 6 / 3 layout) instead of two thirds. */
  narrow?: boolean;
};

/** Centred section title (Montserrat 50px) that reveals its words on scroll. */
export default function SectionHeading({ title, text, spaced, narrow }: Props) {
  return (
    <section className={`${styles.section} ${spaced ? styles.spaced : ''}`} data-header-tone="dark">
      <Container>
        <div className={`${styles.inner} ${narrow ? styles.narrow : ''}`}>
          <SplitHeading className={styles.title}>{title}</SplitHeading>
          {text && <p className={styles.text}>{text}</p>}
        </div>
      </Container>
    </section>
  );
}
