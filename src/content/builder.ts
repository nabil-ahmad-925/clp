import 'server-only';
import type { BuilderPage, DirectorySportPage } from './types';
import { pageStore } from './data';
import { SPORT_FILTER, listingTypeOf } from './listings';
import directories from './data/directories.json';

/** Pages rebuilt from the original page-builder layouts (directories, listings, forms, galleries...). */
const store = pageStore<BuilderPage>(directories as Record<string, Omit<BuilderPage, 'path'>>);

/** Builder page for a site path such as "/basketball-coaches-nearby/". */
export const getBuilderPage = store.get;

/** All builder page paths (for static generation and the sitemap). */
export const builderPaths = store.paths;

/**
 * The sport pages of a Resources directory (its Sport filter goes from one to another), in the filter's order; undefined
 * for other directories (their Sport stays the page's).
 */
export const sportPagesOf = (widgetId: number | undefined): DirectorySportPage[] | undefined => {
  if (widgetId == null || listingTypeOf(widgetId) !== 'resources') return undefined;
  const pages = new Map<string, string>();
  let order: string[] = [];
  for (const path of builderPaths) {
    for (const block of getBuilderPage(path)!.rows.flatMap((row) => row.columns.flatMap((col) => col.blocks))) {
      if (block.type !== 'team' || block.widgetId !== widgetId) continue;
      const sport = block.filters.find((f) => f.key === SPORT_FILTER);
      if (sport?.preset && !pages.has(sport.preset)) pages.set(sport.preset, path);
      if (sport) order = sport.options.map((o) => o.value);
    }
  }
  return order.filter((value) => pages.has(value)).map((value) => ({ value, path: pages.get(value)! }));
};

/**
 * The listings a directory page shows, for showing them elsewhere: its directory widget and the filter groups its
 * page applies (its sport preset), or undefined when the page has no directory.
 */
export const directorySource = (path: string): { widgetId: number; groups: string[][] } | undefined => {
  const block = getBuilderPage(path)
    ?.rows.flatMap((row) => row.columns.flatMap((col) => col.blocks))
    .find((b) => b.type === 'team');
  if (block?.type !== 'team' || block.widgetId == null) return undefined;
  return { widgetId: block.widgetId, groups: block.filters.map((f) => (f.preset ? [f.preset] : [])) };
};
