import Link from 'next/link';
import type { PostNavLink } from '@/content/types';
import styles from './PostNav.module.css';

/** Full-width "Previous Post / Next Post" band with the neighbouring posts' photos (Salient fullwidth next/prev). */
export default function PostNav({ previous, next }: { previous?: PostNavLink; next?: PostNavLink }) {
  const items = [previous && { ...previous, kind: 'previous' as const }, next && { ...next, kind: 'next' as const }].filter(Boolean);
  if (!items.length) return null;
  return (
    <nav className={styles.nav} aria-label="Posts" data-header-tone="light">
      <ul className={styles.controls}>
        {items.map((item) =>
          item ? (
            <li key={item.kind} className={`${styles.item} ${styles[item.kind]} ${items.length === 1 ? styles.only : ''}`}>
              {item.image && <div className={styles.bg} style={{ backgroundImage: `url("${item.image}")` }} />}
              <Link href={item.href} className={styles.cover} aria-label={item.title} />
              <h3 className={styles.heading}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.text}>
                  {item.title}
                  <svg className={styles.arrow} aria-hidden viewBox="0 0 39 12">
                    <line className={styles.top} x1="23" y1="-0.5" x2="29.5" y2="6.5" />
                    <line className={styles.bottom} x1="23" y1="12.5" x2="29.5" y2="5.5" />
                  </svg>
                  <span className={styles.line} />
                </span>
              </h3>
            </li>
          ) : null,
        )}
      </ul>
    </nav>
  );
}
