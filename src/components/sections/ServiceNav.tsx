import Link from 'next/link';
import type { ServiceNavLink } from '@/content/types';
import styles from './ServiceNav.module.css';

/** Full-width gold "Previous Service / Next Service" band at the bottom of /services/<slug>/ pages. */
export default function ServiceNav({ previous, next }: { previous?: ServiceNavLink; next?: ServiceNavLink }) {
  if (!previous && !next) return null;
  return (
    <nav className={styles.nav} aria-label="Services" data-header-tone="light">
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
        <span className={styles.arrow} aria-hidden>
          &#8594;
        </span>
        <span className={styles.label}>{link.label}</span>
        <span className={styles.title}>
          {link.title.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      </h3>
    </li>
  );
}
