'use client';
/* eslint-disable @next/next/no-img-element -- the partner's photos are their own uploads (the media bucket), shown as they are. */

import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import BookingModal from '@/components/sections/BookingModal';
import BioModal from '@/components/sections/BioModal';
import type { RowFacts } from '@/components/sections/DirectoryRow';
import { setHeaderBrand } from '@/components/layout/headerBrand';
import { CART_EVENT, addToCart, cartChanged, checkoutHref, getCart, keepCodes, readCodes, removeLine, setLineQty, type Cart } from '@/content/cart';
import tagLabels from '@/content/data/listingTags.json';
import { fetchJobs, jobTypeLabel, payText, placeText, postedAgo, type Job } from '@/content/jobs';
import { agePolicy, categoryName, cornerTagLabel, isBookable, toItem, unitLabel } from '@/content/listings';
import {
  collabLabel,
  partnerType,
  sendPartnerLead,
  subscribeToPartner,
  TEAM_CHECK_LABELS,
  type PartnerCollab,
  type PartnerPageData,
  type PartnerTeamMember,
  type PartnerVideo,
  type PartnerPageResponse,
  type PartnerProduct,
  type PartnerReviewData,
} from '@/content/partnerPages';
import { canPaint, paint, storeHref } from '@/content/storefront';
import type { DirectoryItem } from '@/content/types';
import s from './partnerPage.module.css';

type Experience = PartnerPageResponse['experiences'][number];
type TabId = 'about' | 'content' | 'experiences' | 'jobs' | 'partnerships' | 'reviews' | 'shop' | 'news';

const AGES = tagLabels.ages as Record<string, string>;
const CITIES = tagLabels.cities as Record<string, string>;

const dollars = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;
const utc = (day: string) => new Date(`${day.slice(0, 10)}T00:00:00Z`);
const monthOf = (day: string) => utc(day).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
const dateText = (day: string) => utc(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthYear = (day: string) => utc(day).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const clock = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

// --- The partner's colours ----------------------------------------------------------------------------------------------

const rgbOf = (color: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
};
const luminance = (c: number[]) => {
  const [r, g, b] = c.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mix = (c: number[], to: number[], t: number) => c.map((v, i) => Math.round(v + (to[i] - v) * t));
const hexOf = (c: number[]) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/**
 * The page's colours from the partner's (the design's "A little"): their colour for tabs, labels, links and buttons
 * (darkened until white text on it reads at 4.5:1), a light tint for tags and a deep shade for the dark cards.
 */
function paletteOf(color: string, mode: 'little' | 'off' = 'little') {
  // "Off · CLP default": CLP's black and gold.
  if (mode === 'off') return { '--accent': '#111111', '--accent-label': '#8A6F33', '--accent-tint': '#F3EFE4', '--accent-ink': '#333333', '--accent-deep': '#0A0A0A' } as CSSProperties;
  let c = rgbOf(color) ?? [122, 31, 43];
  for (let i = 0; i < 24 && 1.05 / (luminance(c) + 0.05) < 4.5; i++) c = mix(c, [0, 0, 0], 0.1);
  return {
    '--accent': hexOf(c),
    '--accent-label': hexOf(c),
    '--accent-tint': hexOf(mix(c, [255, 255, 255], 0.9)),
    '--accent-ink': hexOf(mix(c, [0, 0, 0], 0.3)),
    '--accent-deep': hexOf(mix(c, [0, 0, 0], 0.3)),
  } as CSSProperties;
}

/** The page's colours, for the popups: they render in a portal outside the page, where its variables aren't set. */
const PaletteContext = createContext<CSSProperties>({});

// --- Icons --------------------------------------------------------------------------------------------------------------

const SOCIAL_ICONS: Record<string, ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  facebook: <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" />,
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v7M8 7v.01M12 17v-7M12 13a3 3 0 0 1 6 0v4" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.4 4.6 5 5" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="4" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  website: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
};

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
const BagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 7h12l1 13H5z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);
const stars = (n: number) => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));

// --- Experiences --------------------------------------------------------------------------------------------------------

/** The facts the booking popup shows of a listing (its dates, times and price). */
const factsOf = (l: Experience): RowFacts => ({
  months: l.startDate ? [dateText(l.startDate), [clock(l.startTime), clock(l.endTime)].filter(Boolean).join(' – ')].filter(Boolean).join(', ') : undefined,
  price: priceOf(l) || undefined,
});
const priceOf = (l: { priceMin?: number; priceMax?: number }) =>
  l.priceMin == null ? '' : (l.priceMax ?? l.priceMin) === 0 ? 'Free' : l.priceMin === (l.priceMax ?? l.priceMin) ? dollars(l.priceMin) : `${dollars(l.priceMin)}+`;
const whenOf = (l: Experience) =>
  l.startDate ? [dateText(l.startDate), [clock(l.startTime), clock(l.endTime)].filter(Boolean).join(' – ')].filter(Boolean).join(', ') : 'Ongoing · book any time';
const cityOf = (l: Experience) => CITIES[l.tags.find((t) => CITIES[t]) ?? ''] ?? l.subtitle ?? '';
const agesOf = (l: Experience) => l.tags.filter((t) => AGES[t]).map((t) => AGES[t]);
const isExperience = (l: Experience) => !l.listingType || l.listingType === 'experiences';
/** "18+" on the photo of an adults-only listing. */
const ageBadge = (l: Experience) => {
  const policy = agePolicy(l.tags);
  return policy.kind === 'adult' ? `${policy.minAge}+` : '';
};
const ctaOf = (l: Experience) => (!isBookable(toItem(l)) ? 'Details' : priceOf(l) === 'Free' ? 'RSVP' : 'Book Now');

/**
 * A CLP Partner's page (the Partner page handoff, Oct 15): the clean hero photo, the partner on a white strip under it
 * (logo, badges, name, socials, Book a session / Message / Follow), the tabs in alphabetical order with their counts (an
 * empty one hidden), and the partner's colours on the content. Content, Experiences, Jobs, Partnerships, Reviews, Shop
 * and Updates & News each show what the partner has on CLP.
 */
export default function PartnerPageView({ data }: { data: PartnerPageResponse }) {
  const { page, collabs, products, reviews, experiences, articles } = data;
  const type = partnerType(page.type);
  const palette = useMemo(() => paletteOf(page.color || type.color, page.colorMode), [page.color, type.color, page.colorMode]);
  const sectionOn = (id: string) => page.sections.find((x) => x.id === id)?.on !== false;

  // Their open roles (the jobs board's, posted by this partner).
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => {
    let live = true;
    fetchJobs().then(
      (items) => live && setJobs(items.filter((j) => j.partner?.slug === page.slug)),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [page.slug]);

  const posts = postsOf(page, articles);
  const exps = experiences.filter(isExperience);
  const tabs = (
    [
      ['about', 'About', 0, true],
      ['content', 'Content', page.photos.length + (page.videos?.length ?? 0), sectionOn('photos') && page.photos.length + (page.videos?.length ?? 0) > 0],
      ['experiences', 'Experiences', experiences.length, sectionOn('experiences') && experiences.length > 0],
      ['jobs', 'Jobs', jobs.length, sectionOn('jobs') && jobs.length > 0],
      ['partnerships', 'Partnerships', collabs.length, sectionOn('partnerships') && collabs.length > 0],
      ['reviews', 'Reviews', page.reviewCount, sectionOn('reviews') && reviews.length > 0],
      ['shop', 'Shop', products.length, sectionOn('shop') && (products.length > 0 || Boolean(page.shop?.private))],
      ['news', 'Updates & News', posts.length, sectionOn('news') && posts.length > 0],
    ] as [TabId, string, number, boolean][]
  ).filter((t) => t[3]);
  const has = (id: TabId) => tabs.some((t) => t[0] === id);

  // The tab in the address (#shop: "View store" links; #photos, the old name of Content).
  const [tab, setTab] = useState<TabId>(() => {
    const hash = window.location.hash.slice(1);
    const id = (hash === 'photos' ? 'content' : hash) as TabId;
    return ['about', 'content', 'experiences', 'jobs', 'partnerships', 'reviews', 'shop', 'news'].includes(id) ? id : 'about';
  });
  const shown: TabId = has(tab) ? tab : 'about';
  const tabsRef = useRef<HTMLElement>(null);
  /** Scrolls up to the tabs (under the site header) when the page is further down. */
  const toTabs = () => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const header = document.getElementById('site-header')?.offsetHeight ?? 0;
    const top = tabs.getBoundingClientRect().top + window.scrollY - header;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
  };
  const pick = (id: TabId) => {
    setTab(id);
    setProduct(null);
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    toTabs();
  };

  const [dialog, setDialog] = useState<'follow' | 'question' | 'intro' | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ item: DirectoryItem; widgetId: number; facts: RowFacts } | null>(null);
  const [details, setDetails] = useState<DirectoryItem | null>(null);
  const [product, setProduct] = useState<PartnerProduct | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [member, setMember] = useState<PartnerTeamMember | null>(null);
  const [video, setVideo] = useState<PartnerVideo | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // This store's part of the shopper's cart (kept by the API; any change on the page updates it everywhere).
  const [cart, setCart] = useState<Cart | null>(null);
  useEffect(() => {
    if (page.preview) return;
    let live = true;
    getCart(page.slug, { codes: readCodes() }).then(
      (c) => live && setCart(c),
      () => {},
    );
    const onChange = (e: Event) => setCart((e as CustomEvent<Cart>).detail);
    window.addEventListener(CART_EVENT, onChange);
    return () => {
      live = false;
      window.removeEventListener(CART_EVENT, onChange);
    };
  }, [page.slug, page.preview]);
  const cartCount = cart?.count ?? 0;
  // The site header, co-branded ("CLP │ × AFC"), with this page's cart beside the menu.
  useEffect(() => {
    setHeaderBrand({ label: page.short, cartCount, onCart: () => setCartOpen(true) });
  }, [page.short, cartCount]);
  useEffect(() => () => setHeaderBrand(null), []);

  const open = (l: Experience) => {
    const item = toItem(l);
    if (isBookable(item)) setBooking({ item, widgetId: Number(l.widgetId), facts: factsOf(l) });
    else setDetails(item);
  };
  const socials = [...page.socials, ...(page.website ? [{ network: 'website', href: page.website }] : [])];
  const featured = (page.featured?.length ?? 0) > 0;

  return (
    <PaletteContext.Provider value={palette}>
      <div className={s.page} style={palette}>
        <section className={s.top} data-header-tone="light" />
        {page.preview && <div className={s.previewBar}>Preview: this page isn’t public yet. CLP reviews new partner pages before they go live.</div>}

        <section className={s.hero} data-header-tone="light" data-page-hero>
          {page.hero ? <img className={s.heroImage} src={page.hero} alt="" /> : <span className={s.heroBlank} />}
          <span className={s.heroFade} aria-hidden />
          {has('content') && (
            <button type="button" className={s.heroPhotos} onClick={() => pick('content')}>
              ▦ See all photos &amp; videos
            </button>
          )}
        </section>

        <section className={s.identity} data-header-tone="dark">
          <div className={`${s.wrap} ${s.identityInner}`}>
            <span className={s.logo}>{page.logo ? <img src={page.logo} alt={`${page.name} logo`} /> : page.mono}</span>
            <div className={s.identityText}>
              <div className={s.badges}>
                <span className={`${s.badge} ${s.badgeGold}`}>CLP PARTNER</span>
                <span className={s.badge}>✓ Verified</span>
                {featured && <span className={s.badge}>★ Featured on CLP</span>}
              </div>
              <h1 className={s.name}>{page.name}</h1>
              <div className={s.identityLine}>
                <span>{[type.label, page.area].filter(Boolean).join(' · ')}</span>
                {page.rating != null && sectionOn('reviews') && (
                  <>
                    <span className={s.dot} aria-hidden />
                    <button type="button" className={s.ratingLink} onClick={() => has('reviews') && pick('reviews')}>
                      <strong>{page.rating}★</strong> {plural(page.reviewCount, 'review')}
                    </button>
                  </>
                )}
                {socials.length > 0 && (
                  <span className={s.socials}>
                    {socials.map((so) => (
                      <a key={so.network} href={so.href} target="_blank" rel="noopener noreferrer" className={s.social} aria-label={`${page.short} on ${so.network}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          {SOCIAL_ICONS[so.network] ?? SOCIAL_ICONS.website}
                        </svg>
                      </a>
                    ))}
                  </span>
                )}
              </div>
            </div>
            <div className={s.identityActions}>
              {has('experiences') && (
                <button type="button" className={`${s.action} ${s.actionGold}`} onClick={() => pick('experiences')}>
                  Book a session
                </button>
              )}
              <button type="button" className={`${s.action} ${s.actionLight}`} onClick={() => setDialog('question')}>
                Message
              </button>
              <button type="button" className={`${s.action} ${s.actionOutline}`} onClick={() => setDialog('follow')}>
                Follow
              </button>
            </div>
          </div>
        </section>

        <nav ref={tabsRef} className={s.tabBar} aria-label={`${page.short} page`} data-header-tone="dark">
          <div className={`${s.wrap} ${s.tabBarInner}`}>
            {tabs.map(([id, label, n]) => (
              <button key={id} type="button" className={`${s.tab} ${shown === id ? s.tabOn : ''}`} aria-current={shown === id ? 'page' : undefined} onClick={() => pick(id)}>
                {label}
                {n > 0 && <span className={s.tabCount}>{n}</span>}
              </button>
            ))}
            {cartCount > 0 && (
              <button type="button" className={s.tabCart} onClick={() => setCartOpen(true)}>
                <BagIcon />
                Cart · {cartCount}
              </button>
            )}
          </div>
        </nav>

        <main className={s.main} data-header-tone="dark">
          <div className={s.wrap}>
            {shown === 'about' && <About page={page} experiences={exps} onOpen={open} onAll={has('experiences') ? () => pick('experiences') : undefined} onMember={setMember} />}
            {shown === 'content' && <Content page={page} onPhoto={setPhoto} onVideo={setVideo} />}
            {shown === 'experiences' && <Experiences page={page} items={experiences} onOpen={open} />}
            {shown === 'jobs' && <Jobs page={page} jobs={jobs} onOpen={setJob} />}
            {shown === 'partnerships' && <Partnerships page={page} collabs={collabs} onWork={() => setDialog('intro')} />}
            {shown === 'reviews' && <Reviews page={page} reviews={reviews} />}
            {shown === 'shop' &&
              (page.shop?.private ? (
                <PrivateStore page={page} />
              ) : product ? (
                <ProductPage
                  key={product.id}
                  page={page}
                  product={product}
                  products={products}
                  onBack={() => setProduct(null)}
                  onOpen={(p) => {
                    setProduct(p);
                    toTabs();
                  }}
                  onAdded={() => setCartOpen(true)}
                />
              ) : (
                <Shop
                  page={page}
                  products={products}
                  onOpen={(p) => {
                    setProduct(p);
                    toTabs();
                  }}
                />
              ))}
            {shown === 'news' && <News page={page} posts={posts} />}
          </div>
        </main>

        {dialog === 'follow' && <FollowDialog page={page} onClose={() => setDialog(null)} />}
        {(dialog === 'question' || dialog === 'intro') && <MessageDialog page={page} kind={dialog} onKind={setDialog} onClose={() => setDialog(null)} />}
        {job && <JobDialog page={page} job={job} onClose={() => setJob(null)} />}
        {member && (
          <MemberDialog
            member={member}
            onClose={() => setMember(null)}
            onSessions={
              has('experiences')
                ? () => {
                    setMember(null);
                    pick('experiences');
                  }
                : undefined
            }
          />
        )}
        {video && <VideoDialog video={video} onClose={() => setVideo(null)} />}
        {photo && (
          <Overlay onClose={() => setPhoto(null)} bare>
            <img src={photo} alt="" className={s.lightbox} />
          </Overlay>
        )}
        {cartOpen && <CartDrawer page={page} cart={cart} onClose={() => setCartOpen(false)} onShop={has('shop') ? () => pick('shop') : undefined} />}
        {booking && <BookingModal item={booking.item} widgetId={booking.widgetId} facts={booking.facts} onClose={() => setBooking(null)} />}
        {details && <BioModal card={details} variant="wps" onClose={() => setDetails(null)} />}
      </div>
    </PaletteContext.Provider>
  );
}

// --- About --------------------------------------------------------------------------------------------------------------

function About({
  page,
  experiences,
  onOpen,
  onAll,
  onMember,
}: {
  page: PartnerPageData;
  experiences: Experience[];
  onOpen: (l: Experience) => void;
  onAll?: () => void;
  onMember: (m: PartnerTeamMember) => void;
}) {
  const [faq, setFaq] = useState(0);
  // Dated sessions first (soonest), then the ones booked any time.
  const next = [...experiences.filter((l) => l.startDate), ...experiences.filter((l) => !l.startDate)].slice(0, 2);
  const stats = [
    ...(experiences.length ? [{ value: String(experiences.length), label: `upcoming ${experiences.length === 1 ? 'experience' : 'experiences'}` }] : []),
    ...(page.rating != null ? [{ value: `${page.rating}★`, label: plural(page.reviewCount, 'review') }] : []),
    ...page.stats.map((x) => ({ value: x.value, label: x.label.toLowerCase() })),
  ];
  const paragraphs = (page.about || `${page.name} is a CLP Partner${page.area ? ` in ${page.area}` : ''}.`).split(/\n{2,}/);
  return (
    <div className={s.aboutGrid}>
      <div className={s.stack}>
        <div className={s.card}>
          <span className={s.label}>ABOUT</span>
          <h2 className={s.cardTitle}>{page.category || `About ${page.short}`}</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className={s.aboutText}>
              {p}
            </p>
          ))}
          {page.highlights.length > 0 && (
            <div className={s.tags}>
              {page.highlights.map((h) => (
                <span key={h} className={s.tag}>
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>

        {stats.length > 0 && (
          <div className={s.stats}>
            {stats.map((st) => (
              <div key={`${st.value}-${st.label}`} className={s.stat}>
                <span className={s.statValue}>{st.value}</span>
                <span className={s.statLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        )}

        {page.team.length > 0 && (
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.label}>WHO RUNS IT</span>
              {page.team.some(hasBio) && <span className={s.mutedSmall}>Tap a person to read their bio</span>}
            </div>
            <div className={s.people}>
              {page.team.map((m) => {
                const inner = (
                  <>
                    {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span className={s.personMono}>{initials(m.name)}</span>}
                    <span className={s.personShade} aria-hidden />
                    <span className={s.personText}>
                      <strong>{m.name}</strong>
                      <span>{m.role}</span>
                      {hasBio(m) && <span className={s.readBio}>Read bio →</span>}
                    </span>
                    {youthCleared(m) && <span className={s.youthCleared}>✓ Youth cleared</span>}
                  </>
                );
                return hasBio(m) ? (
                  <button key={`${m.name}-${m.role}`} type="button" className={s.person} aria-label={`About ${m.name}`} onClick={() => onMember(m)}>
                    {inner}
                  </button>
                ) : (
                  <div key={`${m.name}-${m.role}`} className={s.person}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {page.faq.length > 0 && (
          <div className={`${s.card} ${s.faqCard}`}>
            <span className={`${s.label} ${s.faqLabel}`}>FAQ</span>
            {page.faq.map((q, i) => (
              <div key={q.q} className={s.faqItem}>
                <button type="button" className={s.faqQ} aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>
                  {q.q}
                  <span aria-hidden>{faq === i ? '−' : '+'}</span>
                </button>
                {faq === i && <p className={s.faqA}>{q.a}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className={s.aside}>
        {next.length > 0 && (
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.label}>NEXT UP</span>
              {onAll && (
                <button type="button" className={s.textLink} onClick={onAll}>
                  All experiences →
                </button>
              )}
            </div>
            {next.map((l) => (
              <div key={l.id} className={s.nextRow}>
                <span className={s.dateBlock}>
                  {l.startDate ? (
                    <>
                      <span>{monthOf(l.startDate)}</span>
                      <strong>{utc(l.startDate).getUTCDate()}</strong>
                    </>
                  ) : (
                    <span>ANY DAY</span>
                  )}
                </span>
                <span className={s.nextText}>
                  <strong>{l.title}</strong>
                  <span>{[priceOf(l), cityOf(l)].filter(Boolean).join(' · ')}</span>
                </span>
                <button type="button" className={`${s.btnAccent} ${s.btnSm}`} onClick={() => onOpen(l)}>
                  {ctaOf(l) === 'Book Now' ? 'Book' : ctaOf(l)}
                </button>
              </div>
            ))}
          </div>
        )}
        <SignupCard page={page} />
      </aside>
    </div>
  );
}

/** "Get first dibs": the partner's e-mail list (adults and parents). */
function SignupCard({ page }: { page: PartnerPageData }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
  const join = async (e: FormEvent) => {
    e.preventDefault();
    setState('busy');
    setError('');
    try {
      await subscribeToPartner(page.slug, email.trim());
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you up.');
      setState('idle');
    }
  };
  return (
    <form className={s.signup} onSubmit={join}>
      <strong className={s.signupTitle}>Get first dibs</strong>
      {state === 'done' ? (
        <span className={s.signupText}>You’re on the {page.short} list. New dates, drops and events come to {email}.</span>
      ) : (
        <>
          <span className={s.signupText}>New runs, drops and events from {page.short}. Adults and parents only.</span>
          <div className={s.signupRow}>
            <input type="email" required aria-label="Email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={page.preview} />
            <button type="submit" className={s.btnGold} disabled={state === 'busy' || page.preview}>
              {state === 'busy' ? 'Joining…' : 'Join'}
            </button>
          </div>
          {error && <span className={s.signupError}>{error}</span>}
        </>
      )}
    </form>
  );
}

// --- Content ------------------------------------------------------------------------------------------------------------

const VIDEO_SOURCES: Record<string, { label: string; bg: string }> = {
  youtube: { label: 'YOUTUBE', bg: '#C4302B' },
  instagram: { label: 'INSTAGRAM', bg: '#8A3AB9' },
  tiktok: { label: 'TIKTOK', bg: '#111111' },
  vimeo: { label: 'VIMEO', bg: '#1A7FB5' },
};
/** A video's id on its site, from its link. */
const videoId = (v: PartnerVideo) => {
  try {
    const url = new URL(v.url);
    const path = url.pathname.split('/').filter(Boolean);
    if (v.source === 'youtube') return url.hostname.endsWith('youtu.be') ? path[0] : (url.searchParams.get('v') ?? (['shorts', 'embed', 'live'].includes(path[0]) ? path[1] : ''));
    if (v.source === 'vimeo') return path.find((x) => /^\d+$/.test(x)) ?? '';
    if (v.source === 'tiktok') return path.includes('video') ? path[path.indexOf('video') + 1] : '';
    if (v.source === 'instagram') return ['p', 'reel', 'tv'].includes(path[0]) ? path[1] : '';
  } catch {
    return '';
  }
  return '';
};
/** The player that plays a video on the page (visitors stay on CLP), or '' when its link can't be played here. */
const embedOf = (v: PartnerVideo) => {
  const id = videoId(v);
  if (!id) return '';
  return {
    youtube: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    vimeo: `https://player.vimeo.com/video/${id}?autoplay=1`,
    tiktok: `https://www.tiktok.com/embed/v2/${id}`,
    instagram: `https://www.instagram.com/p/${id}/embed`,
    '': '',
  }[v.source];
};
const thumbOf = (v: PartnerVideo) => (v.source === 'youtube' && videoId(v) ? `https://i.ytimg.com/vi/${videoId(v)}/hqdefault.jpg` : '');

function Content({ page, onPhoto, onVideo }: { page: PartnerPageData; onPhoto: (src: string) => void; onVideo: (v: PartnerVideo) => void }) {
  const videos = page.videos ?? [];
  const [kind, setKind] = useState<'all' | 'photos' | 'videos'>('all');
  const filters = (
    [
      ['all', 'All', page.photos.length + videos.length],
      ['photos', 'Photos', page.photos.length],
      ['videos', 'Videos', videos.length],
    ] as const
  ).filter(([id, , n]) => id === 'all' || n > 0);
  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <div className={s.headStack}>
          <span className={s.label}>CONTENT</span>
          <h2 className={s.cardTitle}>Photos &amp; videos</h2>
        </div>
        <div className={s.pills}>
          {filters.map(([id, label, n]) => (
            <button key={id} type="button" className={`${s.pill} ${kind === id ? s.pillOn : ''}`} aria-pressed={kind === id} onClick={() => setKind(id)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={s.grid3}>
        {kind !== 'photos' &&
          videos.map((v, i) => {
            const src = VIDEO_SOURCES[v.source] ?? { label: 'VIDEO', bg: 'rgba(0,0,0,0.6)' };
            const thumb = thumbOf(v);
            return (
              <button key={`v-${i}-${v.url}`} type="button" className={s.contentCard} onClick={() => onVideo(v)}>
                <span className={s.contentMedia}>
                  {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className={s.videoBlank}>{page.mono}</span>}
                  <span className={s.contentSource} style={{ background: src.bg }}>
                    {src.label}
                  </span>
                  <span className={s.playMark} aria-hidden>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="#111111">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                <span className={s.contentText}>
                  <strong>{v.title || `${page.short} video ${i + 1}`}</strong>
                  <span>Video · {src.label.charAt(0) + src.label.slice(1).toLowerCase()}</span>
                </span>
              </button>
            );
          })}
        {kind !== 'videos' &&
          page.photos.map((ph, i) => (
            <button key={`p-${i}-${ph.src}`} type="button" className={s.contentCard} onClick={() => onPhoto(ph.src)}>
              <span className={s.contentMedia}>
                <img src={ph.src} alt={ph.caption} loading="lazy" />
                <span className={s.contentSource}>PHOTOS</span>
              </span>
              <span className={s.contentText}>
                <strong>{ph.caption || `${page.short} photo ${i + 1}`}</strong>
                <span>{page.name}</span>
              </span>
            </button>
          ))}
      </div>
      <div className={s.note}>Youth albums and videos are private to the families booked on that session. Download, print or license a photo from any public album.</div>
    </div>
  );
}

// --- Experiences --------------------------------------------------------------------------------------------------------

type ExpFilters = { q: string; type: string; ages: string; loc: string; when: string };
const NO_FILTERS: ExpFilters = { q: '', type: '', ages: '', loc: '', when: '' };

function Experiences({ page, items, onOpen }: { page: PartnerPageData; items: Experience[]; onOpen: (l: Experience) => void }) {
  const [f, setF] = useState<ExpFilters>(NO_FILTERS);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [now] = useState(() => Date.now());
  const exps = items.filter(isExperience);
  const other = items.filter((l) => !isExperience(l));
  const typeOf = (l: Experience) => categoryName(Number(l.widgetId)) ?? '';
  const types = [...new Set(exps.map(typeOf).filter(Boolean))].sort();
  const ages = [...new Set(exps.flatMap((l) => l.tags.filter((t) => AGES[t])))];
  const places = [...new Set(exps.map(cityOf).filter(Boolean))].sort();
  const today = new Date(now).toISOString().slice(0, 10);
  const plus = (days: number) => new Date(now + days * 86_400_000).toISOString().slice(0, 10);
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = exps.filter(
    (l) =>
      (!f.type || typeOf(l) === f.type) &&
      (!f.ages || l.tags.includes(f.ages)) &&
      (!f.loc || cityOf(l) === f.loc) &&
      (!f.when || (l.startDate && l.startDate <= plus(f.when === 'week' ? 7 : 31) && (l.endDate ?? l.startDate) >= today)) &&
      words.every((w) => [l.title, l.subtitle, l.excerpt, typeOf(l), cityOf(l)].join(' ').toLowerCase().includes(w)),
  );
  const any = Object.values(f).some(Boolean);
  const select = (key: keyof ExpFilters, label: string, options: [string, string][]) =>
    options.length > 0 && (
      <select aria-label={label} className={`${s.filterSelect} ${f[key] ? s.filterOn : ''}`} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}>
        <option value="">{label}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    );
  const badge = (l: Experience) => (l.cornerTag ? cornerTagLabel(l.cornerTag).toUpperCase() : '✓ CLP PARTNER');
  const unit = (l: Experience) => (l.priceUnit && priceOf(l) !== 'Free' ? `/ ${unitLabel(l.priceUnit)}` : '');

  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <div className={s.headStack}>
          <span className={s.label}>EXPERIENCES</span>
          <h2 className={s.cardTitle}>Upcoming with {page.short}</h2>
        </div>
        <span className={s.countText}>{plural(shown.length, 'experience')}</span>
      </div>

      {exps.length > 0 && (
        <div className={s.filterBar}>
          <input type="search" className={s.filterSearch} aria-label="Search experiences" placeholder={`Search ${page.short} experiences`} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          {select(
            'type',
            'All types',
            types.map((t) => [t, t]),
          )}
          {select(
            'ages',
            'All ages',
            ages.map((t) => [t, AGES[t]]),
          )}
          {select(
            'loc',
            'All locations',
            places.map((p) => [p, p]),
          )}
          {select('when', 'Any date', [
            ['week', 'This week'],
            ['month', 'This month'],
          ])}
          {any && (
            <button type="button" className={s.textLink} onClick={() => setF(NO_FILTERS)}>
              Clear
            </button>
          )}
          <ViewToggle view={view} onView={setView} />
        </div>
      )}

      {exps.length > 0 && shown.length === 0 && (
        <div className={s.emptyCard}>
          No experiences match these filters.{' '}
          <button type="button" className={s.textLink} onClick={() => setF(NO_FILTERS)}>
            Clear filters
          </button>
        </div>
      )}

      {view === 'list' ? (
        <div className={s.expList}>
          {shown.map((l) => (
            <article key={l.id} className={`${s.expRow} ${l.cornerTag ? s.expFeatured : ''}`}>
              <div className={s.expMedia}>
                {l.image && <img src={l.image} alt="" loading="lazy" />}
                <span className={`${s.expBadge} ${l.cornerTag ? s.expBadgeDark : ''}`}>{badge(l)}</span>
                {ageBadge(l) && <span className={s.expAge}>{ageBadge(l)}</span>}
              </div>
              <div className={s.expBody}>
                <span className={s.expCat}>{typeOf(l) || l.subtitle}</span>
                <strong className={s.expTitle}>{l.title}</strong>
                <span className={s.expFact}>
                  <CalendarIcon />
                  {whenOf(l)}
                </span>
                {cityOf(l) && (
                  <span className={s.expFact}>
                    <PinIcon />
                    {cityOf(l)}
                  </span>
                )}
                {agesOf(l).length > 0 && <span className={s.expAges}>{agesOf(l).join(' · ')}</span>}
                <div className={s.expFoot}>
                  <span className={s.expPrice}>
                    <span>
                      <strong>{priceOf(l)}</strong> <span className={s.mutedText}>{unit(l)}</span>
                    </span>
                    {l.capacity ? <span className={s.expSpots}>{l.capacity} spots a session</span> : null}
                  </span>
                  <button type="button" className={`${s.btnAccent} ${s.btnLg}`} onClick={() => onOpen(l)}>
                    {ctaOf(l)}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={s.grid3}>
          {shown.map((l) => (
            <article key={l.id} className={`${s.expCard} ${l.cornerTag ? s.expFeatured : ''}`}>
              <div className={s.expCardMedia}>
                {l.image && <img src={l.image} alt="" loading="lazy" />}
                <span className={`${s.expBadge} ${l.cornerTag ? s.expBadgeDark : ''}`}>{badge(l)}</span>
                {ageBadge(l) && <span className={s.expAge}>{ageBadge(l)}</span>}
              </div>
              <div className={s.expCardBody}>
                <span className={s.expCat}>{cityOf(l) || typeOf(l)}</span>
                <strong className={s.expCardTitle}>{l.title}</strong>
                <span className={s.expFact}>
                  <CalendarIcon />
                  {whenOf(l)}
                </span>
                <strong className={s.expCardPrice}>
                  {priceOf(l)} <span className={s.mutedText}>{unit(l)}</span>
                </strong>
                <div className={s.expCardFoot}>
                  <span>{agesOf(l).join(' · ') || 'All ages'}</span>
                  <span className={s.rule} aria-hidden />
                  <span>{page.name}</span>
                </div>
                <button type="button" className={`${s.btnAccent} ${s.btnLg}`} onClick={() => onOpen(l)}>
                  {ctaOf(l)}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {other.length > 0 && (
        <div className={s.stack} style={{ gap: 14, marginTop: 12 }}>
          <span className={s.label}>RESOURCES &amp; SERVICES</span>
          <div className={s.grid3}>
            {other.map((l) => (
              <div key={l.id} className={s.resCard}>
                <span className={s.tag}>{categoryName(Number(l.widgetId)) ?? 'Resource'}</span>
                <strong>{l.title}</strong>
                <span className={s.mutedText}>{l.excerpt || l.subtitle}</span>
                <div className={s.resFoot}>
                  <strong>{priceOf(l) || 'Free'}</strong>
                  <button type="button" className={s.btnOutline} onClick={() => onOpen(l)}>
                    {isBookable(toItem(l)) ? 'Book a session' : 'Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, onView }: { view: 'list' | 'grid'; onView: (v: 'list' | 'grid') => void }) {
  return (
    <span className={s.viewToggle} role="group" aria-label="View">
      {(
        [
          ['list', 'List'],
          ['grid', 'Grid'],
        ] as const
      ).map(([v, label]) => (
        <button key={v} type="button" className={view === v ? s.viewOn : ''} aria-pressed={view === v} onClick={() => onView(v)}>
          {label}
        </button>
      ))}
    </span>
  );
}

// --- Jobs ---------------------------------------------------------------------------------------------------------------

function Jobs({ page, jobs, onOpen }: { page: PartnerPageData; jobs: Job[]; onOpen: (j: Job) => void }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [loc, setLoc] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [now] = useState(() => Date.now());
  const kinds = [...new Set(jobs.map((j) => j.type))];
  const places = [...new Set(jobs.map((j) => placeText(j)).filter(Boolean))].sort();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = jobs.filter(
    (j) => (!kind || j.type === kind) && (!loc || placeText(j) === loc) && words.every((w) => [j.title, j.description, placeText(j)].join(' ').toLowerCase().includes(w)),
  );
  const fresh = (j: Job) => now - Date.parse(j.postedAt) < 7 * 86_400_000;
  const meta = (j: Job) => [placeText(j), jobTypeLabel(j.type)].filter(Boolean).join(' · ');
  const summary = (j: Job) => j.description.split('\n')[0];
  return (
    <div className={s.stack} style={{ gap: 30 }}>
      <div className={s.listHead}>
        <div className={s.headStack} style={{ gap: 10 }}>
          <span className={s.bigTitle}>
            Open roles <span className={s.countText}>{shown.length === jobs.length ? jobs.length : `${shown.length} of ${jobs.length}`}</span>
          </span>
          <span className={s.mutedText}>Work with {page.short}. Every role is also on CLP Jobs &amp; Internships.</span>
        </div>
        <div className={s.listTools}>
          <label className={s.field}>
            SEARCH
            <input type="search" placeholder="Role or keyword" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className={s.field}>
            TYPE
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">All types ({jobs.length})</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {jobTypeLabel(k)} ({jobs.filter((j) => j.type === k).length})
                </option>
              ))}
            </select>
          </label>
          {places.length > 1 && (
            <label className={s.field}>
              LOCATION
              <select value={loc} onChange={(e) => setLoc(e.target.value)}>
                <option value="">All locations</option>
                {places.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}
          <ViewToggle view={view} onView={setView} />
        </div>
      </div>
      {shown.length === 0 ? (
        <div className={s.emptyCard}>
          No roles match.{' '}
          <button
            type="button"
            className={s.textLink}
            onClick={() => {
              setQ('');
              setKind('');
              setLoc('');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : view === 'list' ? (
        <div className={s.stack} style={{ gap: 14 }}>
          {shown.map((j) => (
            <article key={j.id} className={s.jobRow}>
              <div className={s.jobMain}>
                <span className={s.jobTags}>
                  <span className={s.jobType}>{jobTypeLabel(j.type)}</span>
                  {j.backgroundCheck && <span className={s.cleared}>✓ Background check &amp; SafeSport required</span>}
                  {fresh(j) && <span className={s.newTag}>New</span>}
                </span>
                <strong className={s.jobTitle}>{j.title}</strong>
                <span className={s.jobMeta}>{meta(j)}</span>
                <span className={s.jobText}>{summary(j)}</span>
              </div>
              <div className={s.jobSide}>
                {payText(j) && <strong>{payText(j)}</strong>}
                <button type="button" className={`${s.btnAccent} ${s.btnLg}`} onClick={() => onOpen(j)}>
                  View &amp; apply
                </button>
                <span className={s.mutedSmall}>Posted {postedAgo(j.postedAt, now).toLowerCase()}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={s.grid3}>
          {shown.map((j) => (
            <article key={j.id} className={s.jobCard}>
              <div className={s.jobCardMedia}>
                {page.hero && <img src={page.hero} alt="" loading="lazy" />}
                <span className={s.jobCardType}>{jobTypeLabel(j.type)}</span>
                {fresh(j) && <span className={s.jobCardNew}>New</span>}
              </div>
              <div className={s.jobCardBody}>
                <strong className={s.jobCardTitle}>{j.title}</strong>
                <span className={s.jobMeta}>{meta(j)}</span>
                <span className={s.jobText}>{summary(j)}</span>
                {j.backgroundCheck && <span className={s.cleared}>✓ Background check &amp; SafeSport</span>}
                <div className={s.jobCardFoot}>
                  <strong>{payText(j) || 'Pay on request'}</strong>
                  <span className={s.mutedSmall}>Posted {postedAgo(j.postedAt, now).toLowerCase()}</span>
                </div>
                <button type="button" className={`${s.btnAccent} ${s.btnLg}`} onClick={() => onOpen(j)}>
                  View &amp; apply
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className={s.noteRow}>
        <span>Not seeing a fit? Follow {page.short} to hear about new roles first.</span>
        <Link href="/jobs/">Also listed on CLP Jobs &amp; Internships</Link>
      </div>
    </div>
  );
}

function JobDialog({ page, job, onClose }: { page: PartnerPageData; job: Job; onClose: () => void }) {
  const lines = (text: string) =>
    text
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  const [about, ...does] = lines(job.description);
  const needs = lines(job.requirements);
  const apply = job.applyUrl || (job.applyEmail ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`${job.title} · ${page.name}`)}` : `/jobs/?job=${encodeURIComponent(job.id)}`);
  return (
    <Overlay onClose={onClose} width={760}>
      <div className={s.dialogHead}>
        <span className={s.headStack} style={{ gap: 6 }}>
          <span className={s.miniBrand}>
            <span className={s.miniLogo}>{page.logo ? <img src={page.logo} alt="" /> : page.mono}</span>
            {page.name} · {jobTypeLabel(job.type)}
          </span>
          <strong className={s.dialogTitleCaps}>{job.title}</strong>
          <span className={s.mutedText}>{[placeText(job), payText(job)].filter(Boolean).join(' · ')}</span>
        </span>
        <CloseButton onClose={onClose} />
      </div>
      <div className={s.dialogBody}>
        {about && <p className={s.dialogText}>{about}</p>}
        {(does.length > 0 || needs.length > 0) && (
          <div className={s.twoCols}>
            {does.length > 0 && (
              <div className={s.headStack} style={{ gap: 8 }}>
                <span className={s.label}>WHAT YOU’LL DO</span>
                {does.map((x) => (
                  <span key={x} className={s.bullet}>
                    {x}
                  </span>
                ))}
              </div>
            )}
            {needs.length > 0 && (
              <div className={s.headStack} style={{ gap: 8 }}>
                <span className={s.label}>YOU HAVE</span>
                {needs.map((x) => (
                  <span key={x} className={s.bullet}>
                    {x}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {job.backgroundCheck && <div className={s.clearedNote}>This role works with kids. If you’re hired, CLP runs a background check and SafeSport training before your first session.</div>}
        {job.deadline && <span className={s.mutedSmall}>Apply by {dateText(job.deadline)}.</span>}
        <a className={`${s.btnAccent} ${s.btnBlock}`} href={apply} target={job.applyUrl ? '_blank' : undefined} rel="noopener noreferrer">
          {job.applyUrl ? 'Apply now ↗' : job.applyEmail ? 'Apply by e-mail' : 'Apply on CLP Jobs'}
        </a>
      </div>
    </Overlay>
  );
}

// --- Partnerships -------------------------------------------------------------------------------------------------------

function Partnerships({ page, collabs, onWork }: { page: PartnerPageData; collabs: PartnerCollab[]; onWork: () => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('new');
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const cats = [...new Set(collabs.map((c) => c.type))];
  const shown = collabs
    .filter((c) => (!cat || c.type === cat) && words.every((w) => [c.title, c.brand, c.description, c.dates, collabLabel(c.type)].join(' ').toLowerCase().includes(w)))
    .sort((a, b) => (sort === 'az' ? a.title.localeCompare(b.title) : sort === 'old' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  const card = (c: PartnerCollab) => (
    <>
      <span className={s.collabImage}>{c.image ? <img src={c.image} alt="" loading="lazy" /> : <span>{c.brand.toUpperCase()}</span>}</span>
      <span className={s.collabType}>{collabLabel(c.type)}</span>
      <strong className={s.collabTitle}>{c.title}</strong>
      <span className={s.collabText}>{[c.description || `With ${c.brand}`, c.dates].filter(Boolean).join(' · ')}</span>
    </>
  );
  return (
    <div className={s.stack} style={{ gap: 30 }}>
      <div className={s.listHead}>
        <div className={s.headStack} style={{ gap: 14 }}>
          <span className={s.bigTitle}>
            All partnerships <span className={s.countText}>{shown.length === collabs.length ? collabs.length : `${shown.length} of ${collabs.length}`}</span>
          </span>
          <button type="button" className={s.btnOutlineDark} onClick={onWork} disabled={page.preview}>
            Work with {page.short} →
          </button>
        </div>
        <div className={s.listTools}>
          <label className={s.field}>
            SEARCH
            <input type="search" placeholder="Brand, title or dates" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className={s.field}>
            CATEGORY
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories ({collabs.length})</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {collabLabel(c)} ({collabs.filter((x) => x.type === c).length})
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            SORT
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="az">A–Z</option>
            </select>
          </label>
        </div>
      </div>
      {shown.length ? (
        <div className={s.collabGrid}>
          {shown.map((c) =>
            c.link ? (
              <a key={c.id} className={s.collab} href={c.link} target="_blank" rel="noopener noreferrer">
                {card(c)}
              </a>
            ) : (
              <div key={c.id} className={s.collab}>
                {card(c)}
              </div>
            ),
          )}
        </div>
      ) : (
        <div className={s.emptyCard}>
          No partnerships match.{' '}
          <button
            type="button"
            className={s.textLink}
            onClick={() => {
              setQ('');
              setCat('');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

// --- Reviews ------------------------------------------------------------------------------------------------------------

function Reviews({ page, reviews }: { page: PartnerPageData; reviews: PartnerReviewData[] }) {
  const total = reviews.length;
  const average = page.rating ?? (total ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / total) * 10) / 10 : 0);
  return (
    <div className={s.reviewsGrid}>
      <div className={`${s.card} ${s.reviewSummary}`}>
        <span className={s.label}>REVIEWS</span>
        <span className={s.reviewScore}>
          <strong>{average}</strong>
          <span className={s.starsInk}>{stars(average)}</span>
        </span>
        <span className={s.mutedText}>{plural(page.reviewCount || total, 'review')} from verified attendees</span>
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviews.filter((r) => r.rating === n).length;
          return (
            <div key={n} className={s.bar}>
              <span>{n}</span>
              <span className={s.barTrack}>
                <span style={{ width: total ? `${Math.round((count / total) * 100)}%` : 0 }} />
              </span>
              <span className={s.barCount}>{count}</span>
            </div>
          );
        })}
        <div className={s.tintNote}>Only people who attended a session, or parents with a member account, can leave a review.</div>
      </div>
      <div className={s.stack} style={{ gap: 14 }}>
        {reviews.map((r) => (
          <div key={r.id} className={s.review}>
            <span className={s.reviewTop}>
              <span className={s.starsInk}>{stars(r.rating)}</span>
              <span className={s.mutedSmall}>{[dateText(r.date || r.createdAt), r.session].filter(Boolean).join(' · ')}</span>
            </span>
            <strong className={s.reviewText}>“{r.text}”</strong>
            <span className={s.mutedText}>
              {r.name} · <span className={s.verified}>✓ {r.badge || 'Verified attendee'}</span>
            </span>
            {r.reply && (
              <div className={s.reply}>
                <strong>Reply from {page.short}:</strong> {r.reply.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Shop ---------------------------------------------------------------------------------------------------------------

const SORTS = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
] as const;
type Sort = (typeof SORTS)[number][0];

const DARK_COLORS = /black|navy|maroon|burgundy|wine|charcoal|forest|dark|crimson|red|royal|purple|brown|graphite/;
/** A product without a photo: on the partner's colour when the product's first colour is a dark one, else on cream. */
const darkTile = (p: PartnerProduct) => {
  const first = (p.optionGroups.find((g) => g.kind === 'Colors')?.values[0] ?? '').toLowerCase();
  const rgb = rgbOf(first);
  return rgb ? luminance(rgb) < 0.2 : DARK_COLORS.test(first);
};

/** A product's tile photo, or the partner's mark when it has none (the design's AFC tiles). */
function ProductImage({ page, product, size }: { page: PartnerPageData; product: PartnerProduct; size: number }) {
  return product.image ? (
    <img src={product.image} alt={product.title} loading="lazy" />
  ) : (
    <span className={`${s.productBlank} ${darkTile(product) ? '' : s.productBlankLight}`}>
      <span style={{ fontSize: size }}>{page.mono}</span>
      <span>{product.category.toUpperCase()}</span>
    </span>
  );
}

const subOf = (p: PartnerProduct) => [p.collection, p.optionGroups.find((g) => g.kind === 'Colors')?.values[0]].filter(Boolean).join(' · ');

function Shop({ page, products, onOpen }: { page: PartnerPageData; products: PartnerProduct[]; onOpen: (p: PartnerProduct) => void }) {
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [now] = useState(() => Date.now());
  const cats = [...new Set(products.map((p) => p.category))];
  const shown = products
    .filter((p) => !cat || p.category === cat)
    .sort((a, b) =>
      sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'newest' ? (b.addedAt ?? '').localeCompare(a.addedAt ?? '') : 0,
    );
  const cover = page.hero || products.find((p) => p.image)?.image;
  const fresh = (p: PartnerProduct) => p.addedAt && now - Date.parse(p.addedAt) < 30 * 86_400_000;
  return (
    <div className={s.stack}>
      <div className={s.storeBanner}>
        {cover && <img src={cover} alt="" />}
        <span className={s.storeBannerShade} aria-hidden />
        <div className={s.storeBannerText}>
          <span className={s.storeKicker}>THE {page.short.toUpperCase()} STORE</span>
          <strong>{page.store.title || 'Wear the club.'}</strong>
          <span>{page.store.sub || `Gear and keepsakes from ${page.name}. Every order supports ${page.short}.`}</span>
        </div>
      </div>
      <div className={s.shopTools}>
        <div className={s.pills}>
          {[['', 'All'], ...cats.map((c) => [c, c])].map(([id, label]) => (
            <button key={id} type="button" className={`${s.pill} ${cat === id ? s.pillOn : ''}`} aria-pressed={cat === id} onClick={() => setCat(id)}>
              {label} <span>{id ? products.filter((p) => p.category === id).length : products.length}</span>
            </button>
          ))}
        </div>
        <select aria-label="Sort" className={s.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          {SORTS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className={s.productGrid}>
        {shown.map((p) => (
          <button key={p.id} type="button" className={s.product} onClick={() => onOpen(p)}>
            <span className={s.productMedia}>
              <ProductImage page={page} product={p} size={56} />
              {fresh(p) && <span className={s.productTag}>New</span>}
            </span>
            <span className={s.productInfo}>
              <span className={s.headStack} style={{ gap: 2 }}>
                <strong>{p.title}</strong>
                {subOf(p) && <span className={s.mutedSmall}>{subOf(p)}</span>}
              </span>
              <strong>{dollars(p.price)}</strong>
            </span>
          </button>
        ))}
      </div>
      <div className={s.noteRow}>
        <span>Sold by {page.name} · Made and shipped by CLP</span>
        <span>Have a team code? Use it at checkout.</span>
      </div>
    </div>
  );
}

function ProductPage({
  page,
  product,
  products,
  onBack,
  onOpen,
  onAdded,
}: {
  page: PartnerPageData;
  product: PartnerProduct;
  products: PartnerProduct[];
  onBack: () => void;
  onOpen: (p: PartnerProduct) => void;
  onAdded: () => void;
}) {
  const [choices, setChoices] = useState<Record<string, string>>(() => Object.fromEntries(product.optionGroups.map((g) => [g.kind, g.values[0]])));
  const [shot, setShot] = useState(0);
  const [info, setInfo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const colors = product.optionGroups.find((g) => g.kind === 'Colors');
  const swatchy = Boolean(colors?.values.every(canPaint));
  const sized = product.optionGroups.some((g) => g.kind === 'Sizes');
  const add = async () => {
    setBusy(true);
    setError('');
    try {
      cartChanged(await addToCart(page.slug, product.id, choices, 1));
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add it. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const rows: [string, string][] = [
    ['Details', product.description || `${product.title} from ${page.name}.`],
    ...(sized ? ([['Size & fit', 'True to size. Size up for a relaxed fit.']] as [string, string][]) : []),
    ['Shipping & returns', 'Made to order by CLP. Ships in 5–7 days. Free returns on unworn items within 30 days.'],
  ];
  const more = products.filter((p) => p.id !== product.id).slice(0, 4);
  return (
    <div className={s.stack} style={{ gap: 18 }}>
      <button type="button" className={s.textLink} style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        ← {page.short} Store
      </button>
      <div className={s.pdp}>
        <div className={s.stack} style={{ gap: 12 }}>
          <div className={s.pdpMedia}>{images.length ? <img src={images[shot]} alt={product.title} /> : <ProductImage page={page} product={product} size={72} />}</div>
          {images.length > 1 && (
            <div className={s.thumbs}>
              {images.slice(0, 4).map((src, i) => (
                <button key={src} type="button" className={`${s.thumb} ${shot === i ? s.thumbOn : ''}`} aria-label={`Photo ${i + 1}`} onClick={() => setShot(i)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={s.pdpInfo}>
          <span className={s.miniBrand}>
            <span className={s.miniLogo}>{page.logo ? <img src={page.logo} alt="" /> : page.mono}</span>
            {page.name}
          </span>
          <strong className={s.pdpTitle}>{product.title}</strong>
          <strong className={s.pdpPrice}>{dollars(product.price)}</strong>
          {product.optionGroups.map((g) =>
            g.kind === 'Colors' && swatchy ? (
              <div key={g.kind} className={s.option}>
                <span className={s.optionLabel}>
                  Color · <span>{choices[g.kind]}</span>
                </span>
                <div className={s.swatches}>
                  {g.values.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-label={v}
                      aria-pressed={choices[g.kind] === v}
                      className={`${s.swatch} ${choices[g.kind] === v ? s.swatchOn : ''}`}
                      style={{ background: paint(v) }}
                      onClick={() => setChoices({ ...choices, [g.kind]: v })}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div key={g.kind} className={s.option}>
                <span className={s.optionLabel}>{g.kind === 'Sizes' ? 'Size' : g.kind === 'Colors' ? `Color · ${choices[g.kind]}` : g.kind}</span>
                <div className={s.sizes}>
                  {g.values.map((v) => (
                    <button key={v} type="button" className={`${s.size} ${choices[g.kind] === v ? s.sizeOn : ''}`} aria-pressed={choices[g.kind] === v} onClick={() => setChoices({ ...choices, [g.kind]: v })}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ),
          )}
          {error && <span className={s.formError}>{error}</span>}
          <button type="button" className={`${s.btnAccent} ${s.btnXl}`} disabled={busy || page.preview} onClick={add}>
            {page.preview ? 'On sale once the page is live' : busy ? 'Adding…' : `Add to cart · ${dollars(product.price)}`}
          </button>
          <span className={s.mutedSmall}>Made to order and shipped by CLP in 5–7 days. Free returns on unworn items within 30 days.</span>
          <div className={s.accordion}>
            {rows.map(([t, d], i) => (
              <div key={t} className={s.accordionItem}>
                <button type="button" aria-expanded={info === i} onClick={() => setInfo(info === i ? -1 : i)}>
                  {t}
                  <span aria-hidden>{info === i ? '−' : '+'}</span>
                </button>
                {info === i && <p>{d}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
      {more.length > 0 && (
        <div className={s.stack} style={{ gap: 14, marginTop: 20 }}>
          <span className={s.label}>MORE FROM {page.short.toUpperCase()}</span>
          <div className={s.moreGrid}>
            {more.map((p) => (
              <button key={p.id} type="button" className={s.moreItem} onClick={() => onOpen(p)}>
                <span className={s.moreMedia}>
                  <ProductImage page={page} product={p} size={32} />
                </span>
                <strong>{p.title}</strong>
                <span className={s.mutedText}>{dollars(p.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** A private store's Shop tab: its products open on the shop, with the password from the invite. */
function PrivateStore({ page }: { page: PartnerPageData }) {
  return (
    <div className={s.privateStore}>
      <span className={s.label}>PRIVATE STORE</span>
      <strong className={s.cardTitle}>{page.name}’s store is for invited guests</strong>
      <span className={s.mutedText}>
        Open it on the CLP shop with the password from your invite
        {page.shop?.until ? `, until ${dateText(page.shop.until)}` : ''}.
      </span>
      <a className={`${s.btnAccent} ${s.btnLg}`} href={storeHref(page.slug)}>
        Open the store
      </a>
    </div>
  );
}

// --- Updates & News -----------------------------------------------------------------------------------------------------

type Post = { key: string; kind: 'update' | 'news'; title: string; excerpt: string; image: string; date: string; href: string; source: string };

/** Their updates (articles on CLP) and press, newest first. */
function postsOf(page: PartnerPageData, articles: PartnerPageResponse['articles']): Post[] {
  return [
    ...articles.map((a) => ({ key: a.slug, kind: 'update' as const, title: a.title, excerpt: a.excerpt, image: a.image, date: a.publishedAt, href: a.path, source: page.short })),
    ...page.press.map((p, i) => ({ key: `press-${i}`, kind: 'news' as const, title: p.title, excerpt: '', image: p.image, date: p.date, href: p.href, source: p.source })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function News({ page, posts }: { page: PartnerPageData; posts: Post[] }) {
  const [kind, setKind] = useState<'all' | Post['kind']>('all');
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('new');
  const top = posts[0];
  const rest = posts.slice(1);
  const years = [...new Set(rest.map((p) => p.date.slice(0, 4)).filter(Boolean))].sort().reverse();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = rest
    .filter((p) => (kind === 'all' || p.kind === kind) && (!year || p.date.startsWith(year)) && words.every((w) => [p.title, p.excerpt, p.source].join(' ').toLowerCase().includes(w)))
    .sort((a, b) => (sort === 'old' ? (a.date || '').localeCompare(b.date || '') : (b.date || '').localeCompare(a.date || '')));
  const external = (p: Post) => p.kind === 'news';
  const typeLabel = (p: Post) => (p.kind === 'news' ? 'In the news' : 'Update');
  return (
    <div className={s.stack} style={{ gap: 40 }}>
      {top && (
        <a className={s.topPost} href={top.href || undefined} target={external(top) ? '_blank' : undefined} rel="noopener noreferrer">
          <span className={s.topPostMedia}>{top.image && <img src={top.image} alt="" />}</span>
          <span className={s.topPostText}>
            <span className={s.topPostKicker}>
              <span>{typeLabel(top).toUpperCase()}</span>
              {top.date && <span>{monthYear(top.date).toUpperCase()}</span>}
            </span>
            <strong>{top.title}</strong>
            {top.excerpt && <span className={s.mutedText}>{top.excerpt}</span>}
            <span className={s.btnDark}>{external(top) ? `Read it on ${top.source || 'the site'}` : 'Read the update'}</span>
          </span>
        </a>
      )}
      {rest.length > 0 && (
        <div className={s.stack} style={{ gap: 22 }}>
          <div className={s.listHead} style={{ alignItems: 'flex-end' }}>
            <span className={s.bigTitle}>
              Recent <span className={s.countText}>{shown.length === rest.length ? rest.length : `${shown.length} of ${rest.length}`}</span>
            </span>
            <div className={s.newsTabs}>
              {(
                [
                  ['all', 'All'],
                  ['update', 'Updates'],
                  ['news', 'In the news'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" className={kind === id ? s.newsTabOn : ''} aria-pressed={kind === id} onClick={() => setKind(id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={s.newsTools}>
            <input type="search" aria-label="Search updates" placeholder="Search updates and news" value={q} onChange={(e) => setQ(e.target.value)} />
            {years.length > 1 && (
              <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Any year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
            </select>
          </div>
          {shown.length ? (
            <div className={s.grid3} style={{ gap: 28 }}>
              {shown.map((p) => (
                <a key={p.key} className={s.post} href={p.href || undefined} target={external(p) ? '_blank' : undefined} rel="noopener noreferrer">
                  <span className={s.postMedia}>
                    {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span>{p.source || page.short}</span>}
                    <span className={`${s.postType} ${p.kind === 'update' ? s.postTypeUpdate : ''}`}>{typeLabel(p)}</span>
                  </span>
                  <span className={s.mutedSmall} style={{ fontWeight: 700 }}>
                    {[p.source, p.date && monthYear(p.date)].filter(Boolean).join(' · ')}
                  </span>
                  <strong className={s.postTitle}>{p.title}</strong>
                  {p.excerpt && <span className={s.mutedText}>{p.excerpt}</span>}
                </a>
              ))}
            </div>
          ) : (
            <div className={s.emptyCard}>
              Nothing matches.{' '}
              <button
                type="button"
                className={s.textLink}
                onClick={() => {
                  setQ('');
                  setYear('');
                  setKind('all');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Dialogs ------------------------------------------------------------------------------------------------------------

function Overlay({ children, onClose, width = 560, bare }: { children: ReactNode; onClose: () => void; width?: number; bare?: boolean }) {
  const palette = useContext(PaletteContext);
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={s.overlay} style={palette} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      {bare ? (
        children
      ) : (
        <div className={s.dialog} role="dialog" aria-modal="true" style={{ maxWidth: width }}>
          {children}
        </div>
      )}
    </div>,
    document.body,
  );
}

function CloseButton({ onClose, label = 'Close' }: { onClose: () => void; label?: string }) {
  return (
    <button type="button" className={s.close} aria-label={label} onClick={onClose}>
      <CloseIcon />
    </button>
  );
}

/** A team member's card opens a bio when there's more to read than their name and role. */
const hasBio = (m: PartnerTeamMember) => Boolean(m.bio || m.runs?.length || m.checks?.length || m.instagram);
/** Cleared to work with kids: CLP verified their SafeSport training and background check. */
const youthCleared = (m: PartnerTeamMember) => Boolean(m.checks?.includes('safesport') && m.checks.includes('background'));

/** A team member's bio: their photo, role and bio, the sessions they run, CLP's checks and their Instagram. */
function MemberDialog({ member: m, onClose, onSessions }: { member: PartnerTeamMember; onClose: () => void; onSessions?: () => void }) {
  return (
    <Overlay onClose={onClose} width={860}>
      <div className={s.memberDialog}>
        <div className={s.memberPhoto}>{m.photo ? <img src={m.photo} alt={m.name} /> : <span className={s.personMono}>{initials(m.name)}</span>}</div>
        <div className={s.memberBody}>
          <div className={s.memberHead}>
            <span className={s.headStack} style={{ gap: 4 }}>
              <span className={s.label}>{m.role.toUpperCase()}</span>
              <strong className={s.cardTitle}>{m.name}</strong>
            </span>
            <CloseButton onClose={onClose} />
          </div>
          {m.bio && <p className={s.dialogText}>{m.bio}</p>}
          {Boolean(m.runs?.length) && (
            <div className={s.headStack} style={{ gap: 8 }}>
              <span className={s.label}>RUNS</span>
              <div className={s.tags}>
                {m.runs!.map((r) => (
                  <span key={r} className={s.tag}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Boolean(m.checks?.length) && (
            <div className={s.headStack} style={{ gap: 8 }}>
              <span className={s.label}>VERIFIED BY CLP</span>
              <div className={s.tags}>
                {m.checks!.map((c) => (
                  <span key={c} className={s.cleared} style={{ height: 30 }}>
                    ✓ {TEAM_CHECK_LABELS[c]}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className={s.memberActions}>
            {onSessions && (
              <button type="button" className={s.btnAccent} onClick={onSessions}>
                See upcoming sessions
              </button>
            )}
            {m.instagram && (
              <a className={s.btnOutline} href={`https://www.instagram.com/${m.instagram}/`} target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {SOCIAL_ICONS.instagram}
                </svg>
                @{m.instagram}
              </a>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/** A video playing inside the page (visitors stay on CLP); a link that can't be embedded opens on its site. */
function VideoDialog({ video, onClose }: { video: PartnerVideo; onClose: () => void }) {
  const embed = embedOf(video);
  const source = VIDEO_SOURCES[video.source]?.label ?? 'VIDEO';
  const name = source.charAt(0) + source.slice(1).toLowerCase();
  return (
    <Overlay onClose={onClose} bare>
      <div className={s.videoDialog} role="dialog" aria-modal="true" aria-label={video.title || 'Video'}>
        <div className={s.videoHead}>
          <span className={s.headStack} style={{ gap: 2 }}>
            <strong>{video.title || 'Video'}</strong>
            <span>{name}</span>
          </span>
          <button type="button" className={s.videoClose} aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={`${s.videoFrame} ${video.source === 'tiktok' || video.source === 'instagram' ? s.videoTall : ''}`}>
          {embed ? (
            <iframe src={embed} title={video.title || 'Video'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <a className={s.btnGold} href={video.url} target="_blank" rel="noopener noreferrer">
              Watch on {name} ↗
            </a>
          )}
        </div>
        <span className={s.videoNote}>{embed ? `Plays from ${name} inside the page.` : 'This link can’t play inside the page.'}</span>
      </div>
    </Overlay>
  );
}

const PARTNER_KINDS = ['Brand', 'Photo & video', 'Facility', 'Service provider', 'Another club or team'];

/**
 * "Message": a question about a session, or a partnership intro (brands, photographers, facilities, other clubs). Both go
 * to the partner through CLP, who replies by e-mail.
 */
function MessageDialog({ page, kind, onKind, onClose }: { page: PartnerPageData; kind: 'question' | 'intro'; onKind: (k: 'question' | 'intro') => void; onClose: () => void }) {
  const intro = kind === 'intro';
  const [form, setForm] = useState({ name: '', organization: '', email: '', partnerKind: PARTNER_KINDS[0], message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || (intro && !form.organization.trim())) return setError('Fill in every field, please.');
    setBusy(true);
    setError('');
    try {
      await sendPartnerLead(page.slug, {
        name: form.name.trim(),
        organization: intro ? form.organization.trim() : `${form.name.trim()} (a question)`,
        email: form.email.trim(),
        onClp: false,
        collabType: 'other',
        idea: intro ? `${form.partnerKind}: ${form.message.trim()}` : `Question: ${form.message.trim()}`,
        website: form.website,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Overlay onClose={onClose}>
      <div className={s.dialogHead}>
        <strong className={s.dialogTitle}>Message {page.name}</strong>
        <CloseButton onClose={onClose} />
      </div>
      {sent ? (
        <div className={`${s.dialogBody} ${s.done}`}>
          <span className={s.doneMark}>✓</span>
          <strong className={s.cardTitle}>{intro ? 'Intro sent' : 'Message sent'}</strong>
          <span className={s.mutedText}>{page.short} gets it through CLP and replies to you by e-mail.</span>
          <button type="button" className={s.btnOutlineDark} onClick={onClose}>
            Back to {page.short}
          </button>
        </div>
      ) : (
        <form className={s.dialogBody} onSubmit={send} noValidate>
          <div className={s.kinds}>
            {(
              [
                ['question', 'A question'],
                ['intro', 'Partnership intro'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" className={kind === id ? s.kindOn : ''} aria-pressed={kind === id} onClick={() => onKind(id)}>
                {label}
              </button>
            ))}
          </div>
          <span className={s.mutedText}>
            {intro
              ? `Brands, photographers, facilities and other clubs: introduce yourself. ${page.short} decides whether to take it further.`
              : `Ask about a session before you book. Already booked? Reply to your booking e-mail so ${page.short} has the details.`}
          </span>
          {intro && (
            <label className={s.formField}>
              What kind of partner are you?
              <select value={form.partnerKind} onChange={set('partnerKind')}>
                {PARTNER_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
          )}
          <div className={s.twoCols}>
            <label className={s.formField}>
              Your name
              <input maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} />
            </label>
            {intro ? (
              <label className={s.formField}>
                Brand or organization
                <input maxLength={120} autoComplete="organization" value={form.organization} onChange={set('organization')} />
              </label>
            ) : (
              <label className={s.formField}>
                Your e-mail
                <input type="email" maxLength={200} autoComplete="email" value={form.email} onChange={set('email')} />
              </label>
            )}
          </div>
          {intro && (
            <label className={s.formField}>
              Work e-mail
              <input type="email" maxLength={200} autoComplete="email" value={form.email} onChange={set('email')} />
            </label>
          )}
          <textarea
            rows={4}
            aria-label="Message"
            maxLength={1900}
            placeholder={intro ? 'Who you are, what you’d like to do together, and when.' : 'Hi! Do you run a women’s-only session?'}
            value={form.message}
            onChange={set('message')}
          />
          {/* A field people don't see: filled in, the request is a bot's. */}
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className={s.trap} value={form.website} onChange={set('website')} />
          <div className={s.rule2}>
            {intro
              ? `Sent through CLP. ${page.short} sees your name, organization and e-mail.`
              : 'For adults. Under 18? Ask a parent or guardian to reach out.'}
          </div>
          {error && <span className={s.formError}>{error}</span>}
          <button type="submit" className={`${s.btnAccent} ${s.btnLg}`} disabled={busy || page.preview}>
            {busy ? 'Sending…' : intro ? 'Send intro request' : 'Send message'}
          </button>
        </form>
      )}
    </Overlay>
  );
}

/** "Follow": the partner's e-mail list (new dates, drops and events). */
function FollowDialog({ page, onClose }: { page: PartnerPageData; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('busy');
    setError('');
    try {
      await subscribeToPartner(page.slug, email.trim());
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not follow.');
      setState('idle');
    }
  };
  return (
    <Overlay onClose={onClose} width={480}>
      <div className={s.dialogHead}>
        <strong className={s.dialogTitle}>Follow {page.name}</strong>
        <CloseButton onClose={onClose} />
      </div>
      <form className={s.dialogBody} onSubmit={submit}>
        {state === 'done' ? (
          <>
            <span className={s.mutedText}>
              You’re following {page.short}. New dates, drops and updates come to {email}.
            </span>
            <button type="button" className={s.btnOutlineDark} onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <span className={s.mutedText}>New dates, drops and updates, by e-mail. Adults and parents only. Unfollow anytime.</span>
            <label className={s.formField}>
              Your e-mail
              <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <span className={s.formError}>{error}</span>}
            <button type="submit" className={`${s.btnAccent} ${s.btnLg}`} disabled={state === 'busy' || page.preview}>
              {state === 'busy' ? 'Following…' : 'Follow'}
            </button>
          </>
        )}
      </form>
    </Overlay>
  );
}

/** "Your AFC cart": this store's part of the cart, a discount or team code, and its checkout. */
function CartDrawer({ page, cart, onClose, onShop }: { page: PartnerPageData; cart: Cart | null; onClose: () => void; onShop?: () => void }) {
  const palette = useContext(PaletteContext);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const lines = cart?.lines ?? [];
  const totals = cart?.totals;
  const change = async (key: string, work: () => Promise<Cart>) => {
    setBusy(key);
    setError('');
    try {
      cartChanged(await work());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your cart. Please try again.');
    } finally {
      setBusy('');
    }
  };
  /** The cart again, priced with the shopper's codes (kept for the checkout too). */
  const priced = async (codes: string[]) => {
    const c = await getCart(page.slug, { codes });
    keepCodes(codes.filter((x) => !c.badCodes?.includes(x)));
    return c;
  };
  const apply = (e: FormEvent) => {
    e.preventDefault();
    const next = code.trim().toUpperCase();
    if (!next) return;
    void change('code', async () => {
      const c = await priced([...new Set([...readCodes(), next])]);
      if (c.badCodes?.includes(next)) throw new Error(`${next} isn’t a code that works here.`);
      setCode('');
      return c;
    });
  };
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={s.drawerShade} style={palette} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={s.drawer} role="dialog" aria-modal="true" aria-label={`Your ${page.short} cart`}>
        <div className={s.drawerHead}>
          <span className={s.miniBrand} style={{ fontSize: 18, color: '#111' }}>
            <span className={s.miniLogo} style={{ width: 32, height: 32 }}>
              {page.logo ? <img src={page.logo} alt="" /> : page.mono}
            </span>
            <strong>Your {page.short} cart</strong>
          </span>
          <CloseButton onClose={onClose} label="Close cart" />
        </div>
        <div className={s.drawerBody}>
          {!cart ? (
            <span className={s.mutedText}>Loading your cart…</span>
          ) : lines.length === 0 ? (
            <div className={s.drawerEmpty}>Your {page.short} cart is empty.</div>
          ) : (
            lines.map((l) => (
              <div key={l.key} className={s.cartLine} aria-busy={busy === l.key}>
                <span className={s.cartThumb}>{l.image ? <img src={l.image} alt="" /> : page.mono}</span>
                <span className={s.cartInfo}>
                  <strong>{l.title}</strong>
                  <span className={s.mutedSmall}>{l.option || 'One size'}</span>
                  <span className={s.cartControls}>
                    <span className={s.qty}>
                      <button type="button" aria-label={`One less ${l.title}`} disabled={Boolean(busy)} onClick={() => change(l.key, () => setLineQty(l.key, l.qty - 1, page.slug))}>
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button
                        type="button"
                        aria-label={`One more ${l.title}`}
                        disabled={Boolean(busy) || l.qty >= 20}
                        onClick={() => change(l.key, () => setLineQty(l.key, l.qty + 1, page.slug))}
                      >
                        +
                      </button>
                    </span>
                    <button type="button" className={s.remove} disabled={Boolean(busy)} onClick={() => change(l.key, () => removeLine(l.key, page.slug))}>
                      Remove
                    </button>
                  </span>
                </span>
                <strong>{dollars(l.price * l.qty)}</strong>
              </div>
            ))
          )}
          {cart?.removed ? <p className={s.mutedSmall}>Something in your cart is no longer for sale, so it was taken out.</p> : null}
        </div>
        <div className={s.drawerFoot}>
          <form className={s.codeRow} onSubmit={apply}>
            <input aria-label="Discount or team code" placeholder="Discount or team code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={24} />
            <button type="submit" disabled={busy === 'code' || !code.trim()}>
              {busy === 'code' ? 'Checking…' : 'Apply'}
            </button>
          </form>
          {cart?.codes?.map((c) => (
            <span key={c.code} className={s.codeApplied}>
              <span>✓ {c.label || c.code}</span>
              <button type="button" onClick={() => change('code', () => priced(readCodes().filter((x) => x !== c.code)))}>
                Remove
              </button>
            </span>
          ))}
          {error && <span className={s.formError}>{error}</span>}
          <div className={s.totalRow}>
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          {totals && totals.discount + totals.covered > 0 && (
            <div className={s.totalRow}>
              <span>Codes</span>
              <span>−{dollars(totals.discount + totals.covered)}</span>
            </div>
          )}
          <div className={`${s.totalRow} ${s.totalBig}`}>
            <strong>Subtotal</strong>
            <strong>{dollars(totals ? totals.subtotal - totals.discount - totals.covered : (cart?.subtotal ?? 0))}</strong>
          </div>
          {lines.length > 0 ? (
            <a className={`${s.btnAccent} ${s.btnXl}`} href={checkoutHref(page.slug)}>
              Checkout
            </a>
          ) : (
            <button
              type="button"
              className={`${s.btnAccent} ${s.btnXl}`}
              onClick={() => {
                onClose();
                onShop?.();
              }}
              disabled={!onShop}
            >
              Shop {page.short}
            </button>
          )}
          <span className={s.drawerNote}>Sold by {page.name} · Secure checkout by CLP</span>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
