import styles from './ListingHero.module.css';

type Props = {
  /** The page heading's lines ("Fútbol (Soccer) Advancement", "& Workshops Nearby"), shown as one title. */
  title: string[];
  blurb?: string;
  /** The photo pages' larger title (72px) and no search bar on its edge. */
  large?: boolean;
};

/**
 * A listing page's heading (the new design): the title and the category's line, centred on black. The search bar
 * (DirectorySearchSlot) sits on its bottom edge, so it keeps room for the bar's top half.
 */
export default function ListingHero({ title, blurb, large }: Props) {
  return (
    <section className={`${styles.hero} ${large ? styles.large : ''}`} data-header-tone="light" data-page-hero>
      <div className={styles.inner}>
        <h1 className={styles.title}>{title.join(' ')}</h1>
        {blurb && <p className={styles.blurb}>{blurb}</p>}
      </div>
    </section>
  );
}
