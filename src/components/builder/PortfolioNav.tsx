import { Fragment } from 'react';
import Link from 'next/link';
import type { PortfolioNavLink } from '@/content/types';
import styles from './PortfolioNav.module.css';

/**
 * Salient's portfolio navigation ("after project" style): gold halves linking to the previous and next
 * project, each a small label over the project title. A lone link spans the full width.
 */
export default function PortfolioNav({ links }: { links: PortfolioNavLink[] }) {
  return (
    <nav className={styles.nav} aria-label="Partnerships">
      <ul>
        {links.map((l) => (
          <li key={l.kind} className={`${styles[l.kind]} ${links.length === 1 ? styles.only : ''}`}>
            <Link href={l.href} className={styles.cover} aria-label={`${l.label}: ${l.title.join(' ')}`} />
            <h3>
              <span className={styles.label}>{l.label}</span>
              <span className={styles.text}>
                {l.title.map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </Fragment>
                ))}
                <span className={styles.line} aria-hidden />
              </span>
            </h3>
          </li>
        ))}
      </ul>
    </nav>
  );
}
