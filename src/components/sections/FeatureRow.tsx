import { Fragment } from 'react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import styles from './FeatureRow.module.css';

export type FeatureRowData = {
  title: string;
  text: string;
  image: string;
  cta: { label: string; href: string; newTab?: boolean };
};

/** Full-width photo band with a gold gradient heading and a call-to-action. */
export default function FeatureRow({ title, text, image, cta }: FeatureRowData) {
  return (
    <section className={styles.row} data-header-tone="light">
      <div className={styles.bg} style={{ backgroundImage: `url(${image})` }} aria-hidden />
      <div className={styles.overlay} aria-hidden />
      <Reveal className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>
          {text.split('\n').map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>
        <Button href={cta.href} newTab={cta.newTab} compactOnMobile>
          {cta.label}
        </Button>
      </Reveal>
    </section>
  );
}
