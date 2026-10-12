import Link from 'next/link';
import { footerLinks } from '@/content/site';
import styles from './UpdatesHub.module.css';

/** Updates & News' heading (new design): the title and its line, centred on black. */
export function UpdatesHero() {
  return (
    <section className={styles.hero} data-header-tone="light" data-page-hero>
      <div className={styles.heroInner}>
        <h1 className={styles.heroTitle}>Updates &amp; News</h1>
        <p className={styles.heroSub}>Field reports from CLP, plus advice from the coaches, dietitians and specialists we work with.</p>
      </div>
    </section>
  );
}

/** Where the newsletter panel sends readers: the site's SMS & Email Alerts sign-up (as in the footer). */
const ALERTS = footerLinks.flat().find((l) => /alerts/i.test(l.label));

/**
 * "Write for CLP" (contributors apply through the partnerships page) and the newsletter panel (the alerts sign-up),
 * at the end of Updates & News.
 */
export function UpdatesJoin() {
  return (
    <section className={styles.join}>
      <div className={styles.write}>
        <span className={styles.eyebrowGold}>WRITE FOR CLP</span>
        <h2 className={styles.writeTitle}>Coaches, Dietitians, Trainers and Specialists: Share What You Know</h2>
        <p className={styles.writeText}>Get a verified contributor profile, a byline on every article and a link to your practice or programs on CLP.</p>
        <Link className={styles.writeCta} href="/partnerships/">
          Apply to Contribute
        </Link>
      </div>
      <div className={styles.newsletter}>
        <span className={styles.eyebrowDark}>NEWSLETTER</span>
        <span className={styles.newsTitle}>The Weekly CLP Rundown</span>
        <span className={styles.newsText}>New stories, events and expert tips. One email a week.</span>
        {ALERTS && (
          <a className={styles.newsCta} href={ALERTS.href} target="_blank" rel="noopener">
            Subscribe ↗
          </a>
        )}
      </div>
    </section>
  );
}
