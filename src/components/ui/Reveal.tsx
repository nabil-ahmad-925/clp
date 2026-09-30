'use client';

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import styles from './Reveal.module.css';

export type RevealAnimation = 'fade-in-from-bottom' | 'fade-in-from-right' | 'fade-in-from-left' | 'fade-in' | 'none';

type Props = {
  children: ReactNode;
  animation?: RevealAnimation;
  /** Delay in ms, as set per column in the original page builder. */
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

/** Scroll-triggered entrance animation (Salient: 100px rise + fade, 650ms linear). */
export default function Reveal({ children, animation = 'fade-in-from-bottom', delay = 0, as: Tag = 'div', className, style }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(animation === 'none');

  useEffect(() => {
    const el = ref.current;
    if (!el || animation === 'none') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animation]);

  return (
    <Tag
      ref={ref}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      data-animation={animation}
      data-shown={shown || undefined}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
