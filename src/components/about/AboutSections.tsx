import { Container } from '@/components/ui/Section';
import Reveal from '@/components/ui/Reveal';
import ParallaxBand from '@/components/ui/ParallaxBand';
import type { AboutBlock } from '@/content/about';
import styles from './AboutSections.module.css';

/** Centred title + bold paragraphs ("Who we are", "Our mission", "Our vision"). */
export function TextBlock({ title, paragraphs, fullWidth }: AboutBlock & { fullWidth?: boolean }) {
  const body = (
    <>
      <h2 className={styles.blockTitle}>{title}</h2>
      {paragraphs.map((p, i) => (
        <p key={i} className={styles.blockText}>
          {p}
        </p>
      ))}
    </>
  );
  return (
    <section className={`${styles.block} ${fullWidth ? styles.blockFull : ''}`} data-header-tone="dark">
      {fullWidth ? <div className={styles.fullInner}>{body}</div> : <Container>{body}</Container>}
    </section>
  );
}

/** Short centred rule between blocks. */
export function Divider() {
  return (
    <div className={styles.divider} aria-hidden>
      <Container>
        <span />
      </Container>
    </div>
  );
}

/** Gold "How we work" band with three steps. */
export function HowWeWork({ title, steps }: { title: string; steps: { title: string; text: string }[] }) {
  return (
    <section className={styles.how} data-header-tone="light">
      <Container>
        <h2 className={`${styles.blockTitle} ${styles.howTitle}`}>{title}</h2>
      </Container>
      <div className={styles.steps}>
        {steps.map((step) => (
          <Reveal key={step.title} className={styles.step}>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Black band with an oval outline link that morphs into a square on hover. */
export function MorphingCta({ label, href }: { label: string[]; href: string }) {
  return (
    <section className={styles.cta} data-header-tone="light">
      <div className={styles.morph}>
        <a href={href} target="_blank" rel="noopener" className={styles.morphInner}>
          <span className={styles.morphText}>
            {label[0]}
            <br />
            {label[1]}
          </span>
        </a>
      </div>
    </section>
  );
}

export function ImageBand({ image }: { image: string }) {
  return <ParallaxBand image={image} className={styles.imageBand} />;
}
