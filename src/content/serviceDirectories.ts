import type { DirectoryFilter } from './types';
import data from './data/serviceDirectories.json';

/**
 * The home page's service areas as listing directories (type "services"): each area's widget id, its /services/<slug>/
 * page (all its listings) and service page (the first four), and its filter (its four services). Also read by the
 * admin's scripts/sync-widgets.mjs and clp-api's scripts/import-services.mjs.
 */
export type ServiceArea = { widgetId: number; name: string; slug: string; path: string; servicePage: string; filters: DirectoryFilter[] };

export const serviceAreas = data.areas as ServiceArea[];

/** The service area of a /services/<slug>/ page or of a service page ("/brand-product-development/"). */
export const serviceArea = (path: string) => serviceAreas.find((a) => a.path === path || a.servicePage === path);

/** A built-in card's service (its filter option), by the card's subtitle and title ("BRANDING" "Services"). */
export const serviceTag = (area: ServiceArea, card: { subtitle: string; title: string }) => {
  const value = `${card.subtitle} ${card.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return area.filters[0].options.some((o) => o.value === value) ? [value] : [];
};
