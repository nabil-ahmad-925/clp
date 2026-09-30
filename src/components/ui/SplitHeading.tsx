'use client';

import { Fragment, useEffect, useRef, useState, type ElementType } from 'react';
import styles from './SplitHeading.module.css';

type Props = {
  children: string;
  as?: ElementType;
  className?: string;
};

/** Heading whose words rise into view together when scrolled to (Salient "line reveal by space"). */
export default function SplitHeading({ children, as: Tag = 'h2', className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={[styles.heading, shown && styles.shown, className].filter(Boolean).join(' ')} aria-label={children}>
      {children.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className={styles.word} aria-hidden>
            <span className={styles.inner}>{word}</span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
