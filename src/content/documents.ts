/**
 * Waivers & Documents (/waivers-documents/, the footer's page; the Current Designs board): every waiver, release,
 * policy, form and safety guide in one list. A document opens where it lives (`read`: its page on the site, or CLP's
 * waiver), and downloads as a PDF once there is one (`pdf`). One with neither shows "Available soon": CLP adds its
 * file here.
 */
export const WAIVER_URL = 'https://www.soxcessful.com/waiver-release';

export const DOCUMENT_KINDS = [
  { id: 'waivers', label: 'Waivers & releases' },
  { id: 'policies', label: 'Policies' },
  { id: 'forms', label: 'Forms' },
  { id: 'guides', label: 'Safety guides' },
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]['id'] | 'help';

export type SiteDocument = {
  id: string;
  title: string;
  /** Its tag: Required, Required for youth, Policy, Recommended, Guide, Checklist, Help. */
  tag: string;
  /** A required one's tag is red; a recommended one's gold; the rest grey. */
  tone: 'required' | 'recommended' | 'plain';
  kind: DocumentKind;
  about: string;
  /** Its small line: when it was updated, how long, how it's signed. */
  meta?: string;
  /** Where to read it (a page of the site, or CLP's waiver). */
  read?: string;
  /** Its PDF. */
  pdf?: string;
  /** A page rather than a document: "Open page". */
  page?: boolean;
};

export const SITE_DOCUMENTS: SiteDocument[] = [
  {
    id: 'waiver',
    title: 'CLP Waiver & Release',
    tag: 'Required',
    tone: 'required',
    kind: 'waivers',
    about: 'Signed by every player before their first session. Parents sign for players under 18.',
    meta: 'Signed at checkout or check-in',
    read: WAIVER_URL,
  },
  {
    id: 'guardian',
    title: 'Parent / guardian consent',
    tag: 'Required for youth',
    tone: 'required',
    kind: 'waivers',
    about: 'For players under 18: consent to take part, emergency treatment and pickup rules.',
    meta: 'Signed with the waiver when kids are booked',
  },
  {
    id: 'media',
    title: 'Photo & media release',
    tag: 'Required',
    tone: 'required',
    kind: 'waivers',
    about: 'By signing and attending, you give CLP and its partners the right to use photos and video taken at events.',
    meta: 'Accepted with the waiver at checkout or check-in',
  },
  {
    id: 'expectations',
    title: 'Expectations & Commitment',
    tag: 'Required',
    tone: 'required',
    kind: 'policies',
    about: 'How players, families, hosts and partners treat each other on CLP.',
    read: '/our-expectations/',
    page: true,
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    tag: 'Required',
    tone: 'required',
    kind: 'policies',
    about: 'How bookings, payments, refunds and using the site work.',
    read: '/terms-conditions/',
    page: true,
  },
  {
    id: 'privacy',
    title: 'Privacy & Cookies',
    tag: 'Policy',
    tone: 'plain',
    kind: 'policies',
    about: 'What information CLP keeps, how it is used and the cookies the site sets.',
    read: '/privacy-cookies/',
    page: true,
  },
  {
    id: 'refunds',
    title: 'Shipping, returns & refunds',
    tag: 'Policy',
    tone: 'plain',
    kind: 'policies',
    about: 'Cancelling an order, returns, refunds and how shop orders ship.',
    read: '/shipping-returns/',
    page: true,
  },
  {
    id: 'medical',
    title: 'Medical & emergency info form',
    tag: 'Recommended',
    tone: 'recommended',
    kind: 'forms',
    about: 'Allergies, conditions and an emergency contact, shared only with the host on the day.',
  },
  {
    id: 'heat',
    title: 'Heat & hydration guide',
    tag: 'Guide',
    tone: 'plain',
    kind: 'guides',
    about: 'Breaks, what to drink and warning signs to watch for.',
  },
  {
    id: 'concussion',
    title: 'Concussion basics for families',
    tag: 'Guide',
    tone: 'plain',
    kind: 'guides',
    about: 'Signs to watch for and the return-to-play steps CLP hosts follow.',
  },
  {
    id: 'travel',
    title: 'Tournament travel checklist',
    tag: 'Checklist',
    tone: 'plain',
    kind: 'guides',
    about: 'Packing, documents and what to know before a team trip.',
  },
  {
    id: 'faq',
    title: 'FAQ',
    tag: 'Help',
    tone: 'plain',
    kind: 'help',
    about: 'Bookings, refunds, check-in, photos and the shop.',
    read: '/faq/',
    page: true,
  },
];
