/**
 * A partner's own analytics on their page (Add-ons & integrations in the admin: their Google Analytics 4 and Meta
 * Pixel IDs, sent with the public page as `analytics`). Loaded only on that partner's page and switched off when the
 * visitor leaves it, so their tools never see CLP's other pages; skipped for visitors whose browser asks not to be
 * tracked (Global Privacy Control or Do Not Track). IDs are checked again here: nothing else reaches a script tag.
 */
export type PartnerAnalytics = { ga4: string; pixel: string };

const GA4 = /^G-[A-Z0-9]{4,16}$/;
const PIXEL = /^\d{6,20}$/;

type TagWindow = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; disablePushState?: boolean; callMethod?: (...a: unknown[]) => void; push?: unknown };
  _fbq?: unknown;
  [key: string]: unknown;
};

/** The visitor asked not to be tracked. */
export function optedOut(nav: Navigator & { globalPrivacyControl?: boolean } = navigator, win: { doNotTrack?: string } = window as never) {
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || win.doNotTrack === '1';
}

function addScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Google Analytics 4: a page view now; the returned function stops it (GA's own opt-out flag for that ID). */
export function startGa(id: string): () => void {
  if (!GA4.test(id)) return () => {};
  const w = window as unknown as TagWindow;
  w[`ga-disable-${id}`] = false;
  w.dataLayer = w.dataLayer ?? [];
  // gtag reads the arguments object itself, as Google's snippet sends it.
  // eslint-disable-next-line prefer-rest-params
  w.gtag = w.gtag ?? function gtag() { w.dataLayer!.push(arguments); };
  addScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
  w.gtag('js', new Date());
  w.gtag('config', id, { send_page_view: true });
  return () => {
    w[`ga-disable-${id}`] = true;
  };
}

/** The Meta Pixel: a page view for this pixel only (trackSingle), never on later address changes. */
export function startPixel(id: string): () => void {
  if (!PIXEL.test(id)) return () => {};
  const w = window as unknown as TagWindow;
  if (!w.fbq) {
    const q = function (...args: unknown[]) {
      if (q.callMethod) q.callMethod(...args);
      else q.queue!.push(args);
    } as NonNullable<TagWindow['fbq']>;
    q.queue = [];
    q.loaded = true;
    q.version = '2.0';
    q.push = q;
    // Single-page site: no automatic page views when the address changes (other pages aren't the partner's).
    q.disablePushState = true;
    w.fbq = q;
    w._fbq = q;
    addScript('https://connect.facebook.net/en_US/fbevents.js');
  }
  w.fbq('init', id);
  w.fbq('trackSingle', id, 'PageView');
  return () => {};
}

/** Starts the partner's tags (when they have any and the visitor allows it); the returned function stops them. */
export function startPartnerTags(a: PartnerAnalytics | null | undefined): () => void {
  if (!a || typeof window === 'undefined' || optedOut()) return () => {};
  const stops = [a.ga4 ? startGa(a.ga4) : null, a.pixel ? startPixel(a.pixel) : null].filter(Boolean) as (() => void)[];
  return () => stops.forEach((s) => s());
}
