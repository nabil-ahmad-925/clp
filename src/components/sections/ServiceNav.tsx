import Link from 'next/link';
import type { ServiceNavLink } from '@/content/types';
import styles from './ServiceNav.module.css';

/**
 * Full-width gold "Previous … / Next …" band at the bottom of the /services/<slug>/ pages and the partnership
 * (portfolio) pages: each half darkens and shows an arrow on hover.
 */
export default function ServiceNav({ previous, next, label = 'Services' }: { previous?: ServiceNavLink; next?: ServiceNavLink; label?: string }) {
  if (!previous && !next) return null;
  return (
    <nav className={styles.nav} aria-label={label} data-header-tone="light">
      <ul className={styles.controls}>
        {previous && <Item link={previous} className={styles.previous} />}
        {next && <Item link={next} className={styles.next} />}
      </ul>
    </nav>
  );
}

function Item({ link, className }: { link: ServiceNavLink; className: string }) {
  return (
    <li className={`${styles.item} ${className}`}>
      <Link href={link.href} className={styles.cover} aria-label={`${link.label}: ${link.title.join(' ')}`} />
      <h3 className={styles.heading}>
        <span className={styles.label}>{link.label}</span>
        <span className={styles.title}>
          {link.title.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
          {/* Beside the title (just past its outer edge), so a long title never runs under it. */}
          <span className={styles.arrow} aria-hidden>
            &#8594;
          </span>
        </span>
      </h3>
    </li>
  );
}
