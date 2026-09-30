import Image from 'next/image';
import Section from '@/components/ui/Section';
import styles from './HomeBands.module.css';

/** Gold band under the hero with the brand statement. */
export function IntroBand({ statement, supporting }: { statement: string; supporting: string }) {
  return (
    <Section tone="light" background="var(--gold)" className={styles.intro} innerClassName={styles.padded}>
      <h3 className={styles.statement}>{statement}</h3>
      <h3 className={styles.supporting}>{supporting}</h3>
    </Section>
  );
}

/** Black band with the hashtag and a pointer triangle into the next section. */
export function HashtagBand({ text }: { text: string }) {
  return (
    <Section tone="light" background="var(--black)" className={styles.hashtag} innerClassName={styles.padded}>
      <h3 className={styles.hashtagText}>{text}</h3>
    </Section>
  );
}

export type Logo = { src: string; width: number; height: number; alt: string };

/** "Trusted by" row of greyscale partner logos. */
export function TrustedBy({ title, logos }: { title: string; logos: Logo[] }) {
  return (
    <Section className={styles.trusted}>
      <h3 className={styles.trustedTitle}>{title}</h3>
      <ul className={styles.logos}>
        {logos.map((logo) => (
          <li key={logo.src}>
            <Image src={logo.src} width={logo.width} height={logo.height} alt={logo.alt} sizes="(max-width: 690px) 45vw, (max-width: 999px) 30vw, 180px" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
