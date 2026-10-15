import { Suspense, type CSSProperties } from 'react';
import PhotoExplorer from '@/components/photos/PhotoExplorer';
import PhotoExplorerRoute from '@/components/photos/PhotoExplorerRoute';
import PartnerDirectory from '@/components/partners/PartnerDirectory';
import { DirectorySearchProvider, DirectorySearchSlot } from '@/components/sections/DirectorySearch';
import ListingHero from '@/components/sections/ListingHero';
import { HostCta, ProgramPlans } from '@/components/sections/ListingSections';
import PageHero from '@/components/sections/PageHero';
import { articleSearchPlaceholder } from '@/content/articles';
import { articleListOf, listingPageOf } from '@/content/listingPage';
import { PARTNER_CATEGORIES, PARTNER_SPORTS } from '@/content/partnerPages';
import { photoSectionOf } from '@/content/photos';
import { SPORT_FILTER, listingTitleLines, searchPlaceholder, type ListingSetup } from '@/content/listings';
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
 * A photo page (a sport's photos, or one of its albums) is the new design's photo experience (PhotoExplorer). A partner
 * category (/portfolio/<category>-partners/, its directory's preset) lists its CLP Partners in the listing design.
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
  const partners = directory?.type === 'team' ? PARTNER_CATEGORIES.find((c) => directory.filters.some((f) => f.preset === c.id)) : undefined;
  if (partners) {
    return (
      <DirectorySearchProvider placeholder={`Search ${partners.label} partners…`} label="Partner name">
        <ListingHero title={partnerTitleLines(partners.label)} blurb={partners.blurb} />
        <div className={`${styles.content} ${styles.listing}`} data-header-tone="dark" data-listing="">
          <DirectorySearchSlot />
          <section className={styles.partnerListing}>
            <PartnerDirectory category={partners.id} label={partners.label} />
          </section>
        </div>
        {page.portfolioNav && <PortfolioNav links={page.portfolioNav} />}
      </DirectorySearchProvider>
    );
  }
  const search = Boolean(directory);
  const articles = directory?.type === 'postFilter';
  const listing = directory?.type === 'team' ? listingPageOf(directory.widgetId) : undefined;
  // An article list (an Updates & News topic, or a service's articles): the new design's topic heading with its breadcrumb.
  const articleList = directory?.type === 'postFilter' ? articleListOf(page.path, directory.source) : undefined;
  // The page's sport (its directory's Sport preset, as partners name it): the spotlight's partners play it.
  const preset = directory?.type === 'team' ? directory.filters.find((f) => f.key === SPORT_FILTER)?.preset : undefined;
  const sport = preset && PARTNER_SPORTS.find((sp) => sp.id === (SPORT_ALIASES[preset] ?? preset))?.id;
  const setup: ListingSetup | undefined = listing && {
    kind: listing.kind,
    section: listing.section,
    category: listing.category,
    partnerCategory: listing.partnerCategory,
    sport,
  };
  const body = (
    <>
      {page.hero &&
        (listing ? (
          // A service's heading keeps its own two lines ("Brand & Product" / "Development Services").
          <ListingHero title={listing.section === 'services' ? page.hero.title : listingTitleLines(page.hero.title)} blurb={listing.blurb} />
        ) : articleList ? (
          <ListingHero title={[page.hero.title.join(' ')]} blurb={articleList.blurb} back={articleList.back} />
        ) : (
          <PageHero {...page.hero} compact={search} />
        ))}
      <div className={`${styles.content} ${listing?.kind === 'listing' ? styles.listing : ''}`} data-header-tone="dark" data-listing={listing ? '' : undefined}>
        {!page.hero && <div className={styles.headerSpace} style={{ paddingTop: page.topSpacing }} aria-hidden />}
        {search && <DirectorySearchSlot />}
        {page.rows.map((row, i) => (
          <Row key={i} row={row} listing={setup} />
        ))}
        {listing &&
          (listing.kind === 'facilities' ? <HostCta /> : <ProgramPlans category={listing.category} section={listing.section === 'facilities' ? 'experiences' : listing.section} />)}
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

/** The listings' Sport options named otherwise than partners' sports. */
const SPORT_ALIASES: Record<string, string> = { golfing: 'golf' };

/** A partner category's title as the listing pages' (the line breaks after the "&"): "Clubs &" / "Teams Partners". */
const partnerTitleLines = (label: string) => {
  const amp = label.indexOf(' & ');
  return amp >= 0 ? [`${label.slice(0, amp)} &`, `${label.slice(amp + 3)} Partners`] : [`${label} Partners`];
};

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
