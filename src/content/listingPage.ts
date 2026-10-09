import 'server-only';
import { categoryBlurb, categoryName, isListingWidget, listingTypeOf, type ListingSetup, type SpotlightPartner } from './listings';
import { getPartnerPage } from './partners';

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

/** A builder page's listing-page setup, when its directory is an Experiences or Resources category. */
export function listingPageOf(widgetId: number | undefined): ListingPage | undefined {
  if (!isListingWidget(widgetId)) return undefined;
  return {
    section: listingTypeOf(widgetId) as ListingPage['section'],
    category: categoryName(widgetId) ?? '',
    blurb: categoryBlurb(widgetId),
    partners: spotlightPartners(),
  };
}
