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
