'use client';

import { useId, useState } from 'react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import RichText from '@/components/ui/RichText';
import { Container } from '@/components/ui/Section';
import type { FaqData } from '@/content/types';
import styles from './Faq.module.css';

type Props = FaqData & {
  /** "minimal" = FAQ style (large titles, centred column); "shadow" = policy pages (full width, soft shadow when open). */
  variant?: 'minimal' | 'shadow';
  /** Optional rich-text intro shown above the list. */
  introHtml?: string;
  /** Use the full container width instead of the centred two-thirds column. */
  wide?: boolean;
  /** Only the accordion, for placing inside a page-builder column. */
  bare?: boolean;
  /** Smaller (22px) questions, as on the sport FAQ pages. */
  compact?: boolean;
  /** Space above the "View all" button (the service pages' button row has no top margin of its own). */
  viewAllGap?: number;
};

/**
 * Heading + accordion (one item open at a time) + optional "View all" button.
 * The first item starts open, as the original's accordion script does on load.
 */
export default function Faq({ title, items, viewAll, variant = 'minimal', introHtml, wide, bare, compact, viewAllGap }: Props) {
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null);
  const id = useId();

  const list = (
    <div className={`${styles.list} ${compact ? styles.compact : ''}`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
            <h3 className={styles.question}>
              <button
                type="button"
                id={`${id}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <i className={styles.icon} aria-hidden />
                {item.question}
              </button>
            </h3>
            <div id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} className={styles.answer}>
              <div className={styles.answerInner}>
                {item.html ? <RichText html={item.html} className={styles.answerText} /> : item.answer ? <p className={styles.answerPlain}>{item.answer}</p> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (bare) return <div className={styles[variant]}>{list}</div>;

  return (
    <section className={`${styles.section} ${styles[variant]}`} data-header-tone="dark">
      <Container>
        {variant === 'minimal' ? (
          <Reveal className={wide ? undefined : styles.inner}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {list}
          </Reveal>
        ) : (
          <>
            {introHtml && <RichText html={introHtml} className={styles.intro} />}
            {list}
          </>
        )}
        {viewAll && (
          <div className={styles.viewAll} style={viewAllGap === undefined ? undefined : { marginTop: viewAllGap }}>
            <Button href={viewAll.href} newTab={viewAll.newTab} color="dark">
              {viewAll.label}
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
