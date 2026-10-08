import type { CSSProperties } from 'react';
import { DirectorySearchProvider, DirectorySearchSlot } from '@/components/sections/DirectorySearch';
import PageHero from '@/components/sections/PageHero';
import { articleSearchPlaceholder } from '@/content/articles';
import { searchPlaceholder } from '@/content/listings';
import { Container } from '@/components/ui/Section';
import type { BuilderPage, BuilderRow } from '@/content/types';
import BuilderBlock from './BuilderBlock';
import PortfolioNav from './PortfolioNav';
import styles from './BuilderPageView.module.css';

/**
 * Template for pages rebuilt from the original page-builder layout: the title header followed by
 * rows of columns, each holding blocks (text, spacers, directories, forms, galleries...).
 */
export default function BuilderPageView({ page }: { page: BuilderPage }) {
  // A directory or article list page (the list in the first row, under a heading) gets the search bar on the heading's
  // edge (words and location for both).
  const directory = page.hero ? page.rows[0]?.columns.flatMap((col) => col.blocks).find((b) => b.type === 'team' || b.type === 'postFilter') : undefined;
  const search = Boolean(directory);
  const articles = directory?.type === 'postFilter';
  const body = (
    <>
      {page.hero && <PageHero {...page.hero} compact={search} />}
      <div className={styles.content} data-header-tone="dark">
        {!page.hero && <div className={styles.headerSpace} style={{ paddingTop: page.topSpacing }} aria-hidden />}
        {search && <DirectorySearchSlot />}
        {page.rows.map((row, i) => (
          <Row key={i} row={row} />
        ))}
      </div>
      {page.portfolioNav && <PortfolioNav links={page.portfolioNav} />}
    </>
  );
  // The search field names the page's category ("Search Advancement & Workshops…", "Search Strategy and Insights articles…").
  const placeholder =
    directory?.type === 'postFilter' ? articleSearchPlaceholder(directory.source) : searchPlaceholder(directory?.type === 'team' ? directory.widgetId : undefined, page.hero?.title.join(' '));
  return search ? (
    <DirectorySearchProvider placeholder={placeholder} label={articles ? 'Search articles' : undefined}>
      {body}
    </DirectorySearchProvider>
  ) : (
    body
  );
}

function Row({ row }: { row: BuilderRow }) {
  const style = {
    paddingTop: row.paddingTop,
    paddingBottom: row.paddingBottom,
    paddingLeft: row.paddingSides,
    paddingRight: row.paddingSides,
    background: row.background,
  } as CSSProperties;
  const columns = row.columns.map((col, i) => (
    <div
      key={i}
      className={styles.column}
      style={{ '--col-span': col.width ?? '12', textAlign: col.centered ? 'center' : undefined } as CSSProperties}
    >
      {col.blocks
        .filter((block) => !(block.type === 'divider'))
        .map((block, j) => (
          <BuilderBlock key={j} block={block} />
        ))}
    </div>
  ));
  return (
    <section
      id={row.id}
      className={[styles.row, (row.fullWidth || row.flush) && styles.fullWidth, row.tone === 'light' && styles.light]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {row.fullWidth ? <div className={styles.columns}>{columns}</div> : <Container className={styles.columns}>{columns}</Container>}
    </section>
  );
}
