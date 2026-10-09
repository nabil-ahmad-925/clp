import { Suspense, type CSSProperties } from 'react';
import PhotoExplorer from '@/components/photos/PhotoExplorer';
import PhotoExplorerRoute from '@/components/photos/PhotoExplorerRoute';
import { DirectorySearchProvider, DirectorySearchSlot } from '@/components/sections/DirectorySearch';
import ListingHero from '@/components/sections/ListingHero';
import { HostCta, ProgramPlans } from '@/components/sections/ListingSections';
import PageHero from '@/components/sections/PageHero';
import { articleSearchPlaceholder } from '@/content/articles';
import { listingPageOf } from '@/content/listingPage';
import { photoSectionOf } from '@/content/photos';
import { searchPlaceholder, type ListingSetup } from '@/content/listings';
import { Container } from '@/components/ui/Section';
import type { BuilderPage, BuilderRow } from '@/content/types';
import BuilderBlock from './BuilderBlock';
import PortfolioNav from './PortfolioNav';
import styles from './BuilderPageView.module.css';

/**
 * Template for pages rebuilt from the original page-builder layout: the title header followed by
 * rows of columns, each holding blocks (text, spacers, directories, forms, galleries...).
 * An Experiences or Resources category (a listing page) has the new design's heading, search bar (on the heading's
 * edge, as on the other directories), results and "Run a program?" section around the same blocks; a sport's
 * facilities the same on white, ending with "Bring more people to the field" (Volunteering & Open Play design).
 * A photo page (a sport's photos, or one of its albums) is the new design's photo experience (PhotoExplorer).
 */
export default function BuilderPageView({ page }: { page: BuilderPage }) {
  const photos = photoSectionOf(page);
  if (photos) {
    // The sport's page reads its view (category, gate) from the address, known only in the browser: the home meanwhile.
    return photos.album ? (
      <PhotoExplorer {...photos} view={{ kind: 'album' }} />
    ) : (
      <Suspense fallback={<PhotoExplorer {...photos} view={{ kind: 'home' }} />}>
        <PhotoExplorerRoute {...photos} />
      </Suspense>
    );
  }
  // A directory or article list page (the list in the first row, under a heading) gets the search bar on the heading's
  // edge (words and location for both).
  const directory = page.hero ? page.rows[0]?.columns.flatMap((col) => col.blocks).find((b) => b.type === 'team' || b.type === 'postFilter') : undefined;
  const search = Boolean(directory);
  const articles = directory?.type === 'postFilter';
  const listing = directory?.type === 'team' ? listingPageOf(directory.widgetId) : undefined;
  const setup: ListingSetup | undefined = listing && { kind: listing.kind, section: listing.section, category: listing.category, partners: listing.partners };
  const body = (
    <>
      {page.hero &&
        (listing ? <ListingHero title={page.hero.title} blurb={listing.blurb} /> : <PageHero {...page.hero} compact={search} />)}
      <div className={`${styles.content} ${listing?.kind === 'listing' ? styles.listing : ''}`} data-header-tone="dark" data-listing={listing ? '' : undefined}>
        {!page.hero && <div className={styles.headerSpace} style={{ paddingTop: page.topSpacing }} aria-hidden />}
        {search && <DirectorySearchSlot />}
        {page.rows.map((row, i) => (
          <Row key={i} row={row} listing={setup} />
        ))}
        {listing && (listing.kind === 'facilities' ? <HostCta /> : <ProgramPlans />)}
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

function Row({ row, listing }: { row: BuilderRow; listing?: ListingSetup }) {
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
          <BuilderBlock key={j} block={block} listing={listing} />
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
