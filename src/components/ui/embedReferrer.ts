/**
 * The site sends no referrer (the root layout's `referrer: 'no-referrer'`, so competelikepros.com's hotlink protection
 * serves its images). Video players need one: YouTube refuses to play without it ("Video player configuration error",
 * Error 153). So every embedded player gets the browsers' usual policy, which sends only our origin.
 */
export const EMBED_REFERRER = 'strict-origin-when-cross-origin';

/** The iframes in stored HTML (articles, partner pages) with the players' referrer policy, unless they set their own. */
export const withEmbedReferrer = (html: string) => html.replace(/<iframe\b(?![^>]*\breferrerpolicy=)/gi, `<iframe referrerpolicy="${EMBED_REFERRER}"`);
