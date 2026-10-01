import 'server-only';
import { pageStore } from './data';
import partners from './data/partners.json';

/**
 * The partner directory (WP Speedo "Team" plugin): /clp-partners/ and its pages (/clp-partners/page/2/ …),
 * and one profile per partner (/clp-partners/<slug>/), from the original site.
 */
export type PartnerImage = { src: string; width?: number; height?: number; alt: string };
export type PartnerSocial = { network: string; href: string };

export type PartnerProfile = {
  path: string;
  kind: 'single';
  meta: { title: string; description: string };
  title: string;
  /** Line under the name (the plugin's "designation"). */
  designation?: string;
  image?: PartnerImage;
  /** The member-info table ("Group:", "Language:" …); some rows have no label on the original. */
  info: { label: string; text: string }[];
  /** Sanitized HTML description. */
  html: string;
  socials: PartnerSocial[];
};

export type PartnerArchive = {
  path: string;
  kind: 'archive';
  meta: { title: string; description: string };
  title: string;
  cards: { title: string; designation?: string; href: string; image?: PartnerImage; excerpt: string; socials: PartnerSocial[] }[];
  /** Page links; the current page has no href. */
  pagination: { label: string; href?: string }[];
};

export type PartnerPage = PartnerProfile | PartnerArchive;

const store = pageStore<PartnerPage>(partners as unknown as Record<string, Omit<PartnerPage, 'path'>>);

export const getPartnerPage = store.get;

/** Paths below /clp-partners/ as catch-all segments (the archive's first page is /clp-partners/ itself). */
export const partnerParams = () =>
  store.paths.filter((p) => p !== '/clp-partners/').map((p) => ({ path: p.split('/').filter(Boolean).slice(1) }));
