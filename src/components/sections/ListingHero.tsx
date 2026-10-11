import Link from 'next/link';
import styles from './ListingHero.module.css';

type Props = {
  /** The page heading's lines ("Fútbol (Soccer) Advancement", "& Workshops Nearby"), shown as one title. */
  title: string[];
  blurb?: string;
  /** The page it belongs to, above the title ("← Updates & News"): an article list's breadcrumb, with its larger title. */
  back?: { label: string; href: string };
};

/**
 * A listing page's heading (the new design): the title and the category's line, centred on black. The search bar
 * (DirectorySearchSlot) sits on its bottom edge, so it keeps room for the bar's top half.
 */
export default function ListingHero({ title, blurb, back }: Props) {
  return (
    <section className={`${styles.hero} ${back ? styles.withBack : ''}`} data-header-tone="light" data-page-hero>
      <div className={styles.inner}>
        {back && (
          <Link href={back.href} className={styles.back}>
            <span className="glyph" aria-hidden>←</span> {back.label}
          </Link>
        )}
        <h1 className={styles.title}>{title.join(' ')}</h1>
        {blurb && <p className={styles.blurb}>{blurb}</p>}
      </div>
    </section>
  );
}
