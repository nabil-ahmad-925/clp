import 'server-only';
import type { BuilderPage } from './types';
import { pageStore } from './data';
import directories from './data/directories.json';

/** Pages rebuilt from the original page-builder layouts (directories, listings, forms, galleries...). */
const store = pageStore<BuilderPage>(directories as Record<string, Omit<BuilderPage, 'path'>>);

/** Builder page for a site path such as "/basketball-coaches-nearby/". */
export const getBuilderPage = store.get;

/** All builder page paths (for static generation and the sitemap). */
export const builderPaths = store.paths;

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
