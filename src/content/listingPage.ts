import 'server-only';
import { categoryBlurb, categoryName, isFacilitiesWidget, isListingWidget, listingTypeOf, type ListingSetup, type SpotlightPartner } from './listings';
import { getPartnerPage } from './partners';
import { getServicePage } from './services';
import { updatesTopics } from './updates';

/** What a listing page (an Experiences or Resources category) shows around its directory, in the new design. */
export type ListingPage = ListingSetup & { blurb?: string };

/** How many partners the spotlight shows (one row). */
const SPOTLIGHT_SIZE = 4;

/** The first partners of the partner directory, for the spotlight. */
function spotlightPartners(): SpotlightPartner[] {
  const archive = getPartnerPage('/clp-partners/');
  if (archive?.kind !== 'archive') return [];
  return archive.cards.slice(0, SPOTLIGHT_SIZE).map((c) => ({ name: c.title, href: c.href, image: c.image?.src, excerpt: c.excerpt }));
}

/**
 * A builder page's listing-page setup, when its directory is an Experiences or Resources category, or a sport's
 * facilities (the Volunteering & Open Play design: no partner spotlight).
 */
export function listingPageOf(widgetId: number | undefined): ListingPage | undefined {
  if (isFacilitiesWidget(widgetId)) {
    return { kind: 'facilities', section: 'facilities', category: categoryName(widgetId) ?? '', blurb: categoryBlurb(widgetId), partners: [] };
  }
  if (!isListingWidget(widgetId)) return undefined;
  return {
    kind: 'listing',
    section: listingTypeOf(widgetId) as ListingPage['section'],
    category: categoryName(widgetId) ?? '',
    blurb: categoryBlurb(widgetId),
    partners: spotlightPartners(),
  };
}

/**
 * An article list's heading extras (new design's topic page): the page it belongs to ("← Updates & News", or a
 * service's own page for its articles at /<service>/articles/) and, for an Updates & News topic, its line.
 */
export function articleListOf(path: string, source: string | undefined): { back: { label: string; href: string }; blurb?: string } {
  const service = path.match(/^\/([a-z0-9-]+)\/articles\/$/)?.[1];
  const page = service ? getServicePage(service) : undefined;
  if (page) return { back: { label: page.hero.title.join(' '), href: `/${service}/` } };
  const top = source?.split('/')[0] ?? '';
  return { back: { label: 'Updates & News', href: '/updates/' }, blurb: updatesTopics[top]?.desc };
}
