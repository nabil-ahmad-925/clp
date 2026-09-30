import 'server-only';
import type { BuilderPage } from './types';
import { pageStore } from './data';
import photos from './data/photos.json';

/**
 * The sport photo albums under /experiences/ (e.g. /experiences/baseball/photos/) and their galleries
 * (…/photos/nggallery/album/<gallery>/), rebuilt from the original NextGEN album and mosaic pages.
 */
const store = pageStore<BuilderPage>(photos as Record<string, Omit<BuilderPage, 'path'>>);

/** Photo page for a site path such as "/experiences/baseball/photos/". */
export const getPhotoPage = store.get;

/** All photo page paths (for static generation and the sitemap). */
export const photoPaths = store.paths;
