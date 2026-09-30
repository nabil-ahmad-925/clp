import Reveal from '@/components/ui/Reveal';
import { Container } from '@/components/ui/Section';
import styles from './StatementBand.module.css';

type Props = {
  text: string;
  /** "gold" = service pages (gold band); "plain" = white band with black text. */
  variant?: 'gold' | 'plain';
};

/** Band with a large Playfair statement. */
export default function StatementBand({ text, variant = 'gold' }: Props) {
  return (
    <section className={`${styles.band} ${styles[variant]}`} data-header-tone={variant === 'gold' ? 'light' : 'dark'}>
      {variant === 'gold' ? (
        <Container>
          <Reveal>
            <h2 className={styles.text}>{text}</h2>
          </Reveal>
        </Container>
      ) : (
        <h2 className={styles.text}>{text}</h2>
      )}
    </section>
  );
}
