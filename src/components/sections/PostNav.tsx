import Link from 'next/link';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import type { PostNavLink } from '@/content/types';
import styles from './PostNav.module.css';

/**
 * The previous and next articles under an article: two halves over their photos, each with its direction ("← PREVIOUS
 * ARTICLE", "NEXT ARTICLE →") and the article's title. One alone spans the width.
 */
export default function PostNav({ previous, next }: { previous?: PostNavLink; next?: PostNavLink }) {
  const items = [previous && { ...previous, kind: 'previous' as const }, next && { ...next, kind: 'next' as const }].filter(
    (item): item is PostNavLink & { kind: 'previous' | 'next' } => Boolean(item),
  );
  if (!items.length) return null;
  return (
    <nav className={styles.nav} aria-label="More articles" data-header-tone="light">
      {items.map((item) => (
        <Link key={item.kind} href={item.href} className={`${styles.item} ${styles[item.kind]} ${items.length === 1 ? styles.only : ''}`}>
          {item.image && <span className={styles.bg} style={{ backgroundImage: `url("${item.image}")` }} aria-hidden />}
          <span className={styles.text}>
            <span className={styles.label}>
              {item.kind === 'previous' && <LuArrowLeft className={styles.arrow} aria-hidden />}
              {item.kind === 'previous' ? 'PREVIOUS ARTICLE' : 'NEXT ARTICLE'}
              {item.kind === 'next' && <LuArrowRight className={styles.arrow} aria-hidden />}
            </span>
            <span className={styles.title}>{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
