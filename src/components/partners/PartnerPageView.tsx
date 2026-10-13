'use client';
/* eslint-disable @next/next/no-img-element -- the partner's photos are their own uploads (the media bucket), shown as they are. */

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import BookingModal from '@/components/sections/BookingModal';
import BioModal from '@/components/sections/BioModal';
import type { RowFacts } from '@/components/sections/DirectoryRow';
import { isBookable, toItem } from '@/content/listings';
import {
  COLLAB_TYPES,
  collabLabel,
  partnerType,
  sendPartnerLead,
  subscribeToPartner,
  type PartnerPageResponse,
  type PartnerProduct,
  type PartnerReviewData,
} from '@/content/partnerPages';
import type { DirectoryItem } from '@/content/types';
import s from './partnerPage.module.css';

type Experience = PartnerPageResponse['experiences'][number];
type CartLine = {
  key: string;
  slug: string;
  productId: string;
  title: string;
  option: string;
  qty: number;
  price: number;
  image: string;
};

const CART_KEY = 'clp-partner-cart';
const readCart = (): CartLine[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const writeCart = (lines: CartLine[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {}
};

const dollars = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const parts = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase(),
    mon: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    day: d.getUTCDate(),
    short: d
      .toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
      .toUpperCase(),
  };
};
const clock = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};
const priceText = (l: { priceMin?: number; priceMax?: number }) =>
  l.priceMin == null
    ? ''
    : (l.priceMax ?? l.priceMin) === 0
      ? 'Free'
      : l.priceMin === (l.priceMax ?? l.priceMin)
        ? dollars(l.priceMin)
        : `${dollars(l.priceMin)}+`;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const Star = ({ size = 16, fill = 'currentColor' }: { size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
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
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
};

/** The facts the booking popup shows of a listing (its dates, times and price). */
const factsOf = (l: Experience): RowFacts => ({
  months: l.startDate
    ? [`${parts(l.startDate).mon} ${parts(l.startDate).day}`, [clock(l.startTime), clock(l.endTime)].filter(Boolean).join(' – ')].filter(Boolean).join(', ')
    : undefined,
  price: priceText(l) || undefined,
});

/**
 * A CLP Partner's page (the Partner page template): the header with their logo, name, category and area and rating,
 * the tabs they show in their order (About, Partnerships, their listings, Updates & News, Shop), Share and Subscribe,
 * the reviews, the "Work with us" form and the store's cart.
 */
export default function PartnerPageView({ data }: { data: PartnerPageResponse }) {
  const { page, collabs, products, reviews, experiences, articles } = data;
  const type = partnerType(page.type);
  const accent = page.color || type.color;
  const tabs = page.sections.filter((x) => x.on && ['about', 'partnerships', 'experiences', 'news', 'shop'].includes(x.id));
  const tabLabel = (id: string) =>
    ({
      about: 'About',
      partnerships: 'Partnerships',
      experiences: type.listings,
      news: 'Updates & News',
      shop: 'Shop',
    })[id] ?? id;
  const showPhotos = page.sections.find((x) => x.id === 'photos')?.on !== false;
  const showReviews = page.sections.find((x) => x.id === 'reviews')?.on !== false;

  // The tab in the address (#shop: "View store" links). The page renders only in the browser, once its data loaded.
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.slice(1);
    return tabs.some((t) => t.id === fromHash) ? fromHash : (tabs[0]?.id ?? 'about');
  });
  const pick = (id: string) => {
    setTab(id);
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
  };

  const [dialog, setDialog] = useState<'reviews' | 'work' | 'subscribe' | 'share' | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [booking, setBooking] = useState<{
    item: DirectoryItem;
    widgetId: number;
    facts: RowFacts;
  } | null>(null);
  const [details, setDetails] = useState<DirectoryItem | null>(null);
  const [product, setProduct] = useState<PartnerProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const mine = cart.filter((l) => l.slug === page.slug);
  const saveCart = (lines: CartLine[]) => {
    setCart(lines);
    writeCart(lines);
  };

  const open = (l: Experience) => {
    const item = toItem(l);
    if (isBookable(item)) setBooking({ item, widgetId: Number(l.widgetId), facts: factsOf(l) });
    else setDetails(item);
  };

  const socials = [...page.socials, ...(page.website ? [{ network: 'website', href: page.website }] : [])];

  return (
    <div className={s.page} style={{ '--accent': accent } as CSSProperties}>
      {page.preview && <div className={s.previewBar}>Preview: this page isn’t public yet. CLP reviews new partner pages before they go live.</div>}

      <section className={s.hero} data-header-tone="light" data-page-hero>
        {page.hero && <img className={s.heroImage} src={page.hero} alt="" />}
        <span className={s.heroShade} aria-hidden />
        <div className={`${s.wrap} ${s.heroInner}`}>
          <span className={s.logo}>{page.logo ? <img src={page.logo} alt={`${page.name} logo`} /> : page.mono}</span>
          <div className={s.heroText}>
            <h1 className={s.name}>{page.name}</h1>
            <span className={s.heroLine}>
              {[page.category || type.label, page.area].filter(Boolean).join('  ·  ')}
              {showReviews && page.rating != null && (
                <button type="button" className={s.heroRating} onClick={() => setDialog('reviews')}>
                  <Star fill="#FFFFFF" />
                  <strong>{page.rating}</strong>
                  <span className={s.underline}>
                    {page.reviewCount} review{page.reviewCount === 1 ? '' : 's'}
                  </span>
                </button>
              )}
            </span>
          </div>
        </div>
      </section>

      <div className={s.tabBar} data-header-tone="dark">
        <div className={`${s.wrap} ${s.tabBarInner}`}>
          <nav className={s.tabs} aria-label="Partner sections">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${s.tab} ${tab === t.id ? s.tabOn : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => pick(t.id)}
              >
                {tabLabel(t.id)}
              </button>
            ))}
          </nav>
          <div className={s.tabActions}>
            {socials.length > 0 && (
              <>
                <div className={s.socials}>
                  {socials.map((so) => (
                    <a key={so.network} href={so.href} target="_blank" rel="noopener noreferrer" className={s.social} aria-label={so.network}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        {SOCIAL_ICONS[so.network] ?? SOCIAL_ICONS.website}
                      </svg>
                    </a>
                  ))}
                </div>
                <span className={s.divider} />
              </>
            )}
            <button type="button" className={s.btn} onClick={() => setDialog('share')}>
              Share
            </button>
            <button type="button" className={`${s.btn} ${s.btnAccent}`} onClick={() => setDialog('subscribe')}>
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div data-header-tone="dark">
        {tab === 'about' && (
          <About
            data={data}
            showPhotos={showPhotos}
            showReviews={showReviews}
            onReviews={() => setDialog('reviews')}
            onPhoto={setPhoto}
            upcoming={experiences.length}
            listingsLabel={type.listings}
          />
        )}
        {tab === 'partnerships' && <Partnerships page={page} collabs={collabs} onWork={() => setDialog('work')} />}
        {tab === 'experiences' && <Experiences items={experiences} label={type.listings} onOpen={open} />}
        {tab === 'news' && <News page={page} articles={articles} />}
        {tab === 'shop' && <Shop page={page} products={products} onOpen={setProduct} />}
      </div>

      {mine.length > 0 && (
        <button type="button" className={s.floatCart} onClick={() => setCartOpen(true)}>
          Cart · {mine.reduce((n, l) => n + l.qty, 0)}
        </button>
      )}

      {dialog === 'reviews' && <ReviewsDialog page={page} reviews={reviews} onClose={() => setDialog(null)} />}
      {dialog === 'work' && <WorkDialog slug={page.slug} short={page.short} onClose={() => setDialog(null)} />}
      {dialog === 'subscribe' && <SubscribeDialog slug={page.slug} name={page.name} preview={page.preview} onClose={() => setDialog(null)} />}
      {dialog === 'share' && <ShareDialog name={page.name} onClose={() => setDialog(null)} />}
      {photo && (
        <Overlay onClose={() => setPhoto(null)}>
          <img src={photo} alt="" className={s.lightbox} />
        </Overlay>
      )}
      {product && (
        <ProductDialog
          product={product}
          short={page.short}
          onClose={() => setProduct(null)}
          onAdd={(option, qty) => {
            const key = `${page.slug}#${product.id}#${option}`;
            const existing = cart.find((l) => l.key === key);
            saveCart(
              existing
                ? cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
                : [
                    ...cart,
                    {
                      key,
                      slug: page.slug,
                      productId: product.id,
                      title: product.title,
                      option,
                      qty,
                      price: product.price,
                      image: product.image,
                    },
                  ],
            );
            setProduct(null);
            setCartOpen(true);
          }}
        />
      )}
      {cartOpen && <CartDrawer lines={mine} onClose={() => setCartOpen(false)} onRemove={(key) => saveCart(cart.filter((l) => l.key !== key))} />}
      {booking && <BookingModal item={booking.item} widgetId={booking.widgetId} facts={booking.facts} onClose={() => setBooking(null)} />}
      {details && <BioModal card={details} variant="wps" onClose={() => setDetails(null)} />}
    </div>
  );
}

// --- Tabs ---------------------------------------------------------------------------------------------------------------

function About({
  data,
  showPhotos,
  showReviews,
  onReviews,
  onPhoto,
  upcoming,
  listingsLabel,
}: {
  data: PartnerPageResponse;
  showPhotos: boolean;
  showReviews: boolean;
  onReviews: () => void;
  onPhoto: (src: string) => void;
  upcoming: number;
  listingsLabel: string;
}) {
  const { page } = data;
  const [openFaq, setOpenFaq] = useState(0);
  const stats = [
    ...(upcoming
      ? [
          {
            value: String(upcoming),
            label: `Upcoming ${listingsLabel.toLowerCase()}`,
          },
        ]
      : []),
    ...page.stats,
  ];
  return (
    <>
      <section className={`${s.wrap} ${s.aboutTop}`}>
        <div className={s.aboutRow}>
          <h2 className={s.aboutTitle}>
            About
            <br />
            {page.short}
          </h2>
          <div className={s.aboutBody}>
            <p className={s.aboutText}>{page.about || `${page.name} is a CLP Partner${page.area ? ` in ${page.area}` : ''}.`}</p>
            {page.highlights.length > 0 && (
              <div className={s.chips}>
                {page.highlights.map((h) => (
                  <span key={h} className={s.chip}>
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {(stats.length > 0 || (showReviews && page.rating != null)) && (
        <section className={s.wrap} style={{ paddingBottom: 96 }}>
          <div className={s.stats}>
            {showReviews && page.rating != null && (
              <button type="button" className={s.stat} onClick={onReviews}>
                <span className={s.statValue}>{page.rating}</span>
                <span className={s.stars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(page.rating!) ? 'currentColor' : '#DDDDDA'} />
                  ))}
                </span>
                <span className={`${s.statLabel} ${s.underline}`}>
                  {page.reviewCount} review{page.reviewCount === 1 ? '' : 's'}
                </span>
              </button>
            )}
            {stats.map((st) => (
              <div key={st.label} className={s.stat}>
                <span className={s.statValue}>{st.value}</span>
                <span className={s.statLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPhotos && page.photos.length > 0 && (
        <section className={s.wrap} style={{ paddingBottom: 112 }}>
          <div className={s.photos}>
            {page.photos.map((ph, i) => (
              <button
                key={`${i}-${ph.src}`}
                type="button"
                className={`${s.photo} ${i === 0 || i === 5 ? s.photoWide : ''}`}
                aria-label={`Open photo${ph.caption ? `: ${ph.caption}` : ''}`}
                onClick={() => onPhoto(ph.src)}
              >
                <img src={ph.src} alt={ph.caption} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      {page.team.length > 0 && (
        <section className={`${s.wrap} ${s.team}`}>
          <h3 className={s.sectionTitle}>The people behind {page.short}</h3>
          <div className={s.people}>
            {page.team.map((m) => (
              <div key={`${m.name}-${m.role}`} className={s.person}>
                <span className={s.personMono}>{m.photo ? <img src={m.photo} alt="" /> : initials(m.name)}</span>
                <span className={s.personText}>
                  <span>{m.name}</span>
                  <span>{m.role}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.faq.length > 0 && (
        <section className={s.faqBand}>
          <div className={s.faq}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <span className={s.kicker}>FAQ</span>
              <h3 className={s.sectionTitle} style={{ fontSize: 44 }}>
                Good to know
              </h3>
            </div>
            <div className={s.faqList}>
              {page.faq.map((q, i) => (
                <div key={q.q} className={s.faqItem}>
                  <button type="button" className={s.faqQ} aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {q.q}
                    <span aria-hidden style={{ fontSize: 24, fontWeight: 400 }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && <p className={s.faqA}>{q.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Partnerships({ page, collabs, onWork }: { page: PartnerPageResponse['page']; collabs: PartnerPageResponse['collabs']; onWork: () => void }) {
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('new');
  const lead = collabs.find((c) => c.live);
  const shown = collabs
    .filter((c) => cat === 'all' || c.type === cat)
    .sort((a, b) => (sort === 'az' ? a.title.localeCompare(b.title) : sort === 'za' ? b.title.localeCompare(a.title) : b.createdAt.localeCompare(a.createdAt)));
  const used = COLLAB_TYPES.filter((t) => collabs.some((c) => c.type === t.id));
  const card = (c: PartnerPageResponse['collabs'][number]) => {
    const inner = (
      <>
        <span className={s.collabImage}>{c.image ? <img src={c.image} alt="" loading="lazy" /> : c.brand.toUpperCase()}</span>
        <span className={s.collabText}>
          <span className={s.kicker}>{collabLabel(c.type).toUpperCase()}</span>
          <span className={`${s.display} ${s.collabTitle}`}>{c.title}</span>
          {(c.description || c.dates) && <span className={s.muted}>{[c.description, c.dates].filter(Boolean).join(' · ')}</span>}
        </span>
      </>
    );
    return c.link ? (
      <a key={c.id} className={s.collab} href={c.link} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    ) : (
      <div key={c.id} className={s.collab}>
        {inner}
      </div>
    );
  };
  return (
    <section className={`${s.wrap} ${s.section}`}>
      {lead && (
        <a className={s.lead} href={lead.link || undefined} target={lead.link ? '_blank' : undefined} rel="noopener noreferrer">
          {lead.image && <img src={lead.image} alt="" />}
          <span className={s.leadShade} />
          <span className={s.leadText}>
            <span className={s.leadTags}>
              <span>LIVE NOW</span>
              <span>{collabLabel(lead.type).toUpperCase()}</span>
            </span>
            <span className={`${s.display} ${s.leadTitle}`}>{lead.title}</span>
            <span className={s.leadDesc}>{lead.description || `With ${lead.brand}${lead.dates ? ` · ${lead.dates}` : ''}`}</span>
            {lead.link && <span className={s.leadCta}>View partnership</span>}
          </span>
        </a>
      )}

      <div className={s.listHead} style={lead ? undefined : { paddingTop: 0 }}>
        <span className={s.listTitle}>
          <span className={s.display}>All partnerships</span>
          <span className={s.count}>
            {shown.length} of {collabs.length}
          </span>
        </span>
        <div className={s.selects}>
          <label className={s.selectLabel}>
            CATEGORY
            <select className={s.select} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories ({collabs.length})</option>
              {used.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({collabs.filter((c) => c.type === t.id).length})
                </option>
              ))}
            </select>
          </label>
          <label className={s.selectLabel}>
            SORT
            <select className={s.select} style={{ minWidth: 140 }} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </select>
          </label>
        </div>
      </div>
      {shown.length ? (
        <div className={s.collabGrid}>{shown.map(card)}</div>
      ) : (
        <p className={s.empty}>{collabs.length ? 'No partnerships in this category yet.' : 'Partnerships will show here.'}</p>
      )}

      <div className={s.workBand}>
        <span className={s.kicker}>PARTNER WITH {page.short.toUpperCase()}</span>
        <h3 className={s.display}>Have an idea? Let’s build it.</h3>
        <p>Brands and organizations, whether you’re on CLP or not, can tell us about a partnership, product drop or experience.</p>
        <button type="button" className={`${s.btn} ${s.btnAccent} ${s.btnLg}`} style={{ marginTop: 12 }} disabled={page.preview} onClick={onWork}>
          Work with us
        </button>
      </div>
    </section>
  );
}

function Experiences({ items, label, onOpen }: { items: Experience[]; label: string; onOpen: (l: Experience) => void }) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [all, setAll] = useState(false);
  const [city, setCity] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const dated = items.filter((l) => l.startDate);
  const featured = dated[0];
  const rest = (featured ? items.filter((l) => l !== featured) : items).filter(
    (l) => !city || (l.subtitle ?? '').toLowerCase().includes(city.toLowerCase()) || l.tags.includes(city),
  );
  const shown = all ? rest : rest.slice(0, 5);
  const when = (l: Experience) => {
    if (!l.startDate) return 'ANYTIME';
    const p = parts(l.startDate < today ? today : l.startDate);
    return `${p.dow} ${p.mon} ${p.day}`;
  };
  const meta = (l: Experience) => [[clock(l.startTime), clock(l.endTime)].filter(Boolean).join('–'), l.subtitle].filter(Boolean).join(' · ');
  const cta = (l: Experience) => (isBookable(toItem(l)) ? 'Register' : 'Details');
  const places = [...new Set(items.map((l) => l.subtitle).filter(Boolean))] as string[];

  if (!items.length) {
    return (
      <section className={`${s.wrap} ${s.section}`}>
        <p className={s.empty}>No upcoming {label.toLowerCase()} right now. Subscribe to hear about new dates.</p>
      </section>
    );
  }
  return (
    <section className={`${s.wrap} ${s.section}`} style={{ gap: 56 }}>
      {featured && !all && (
        <div className={s.feat}>
          <div className={s.featDate}>
            <span className={s.kicker} style={{ fontSize: 14 }}>
              {parts(featured.startDate! < today ? today : featured.startDate!).dow} · {parts(featured.startDate! < today ? today : featured.startDate!).mon}
            </span>
            <span className={s.featDay}>{parts(featured.startDate! < today ? today : featured.startDate!).day}</span>
          </div>
          <div className={s.featText}>
            <span className={s.featKind}>FEATURED · {label.toUpperCase()}</span>
            <span className={`${s.display} ${s.featTitle}`}>{featured.title}</span>
            <span className={s.featMeta}>{[featured.excerpt, meta(featured)].filter(Boolean).join(' · ')}</span>
          </div>
          <div className={s.featBuy}>
            {priceText(featured) && <span className={s.featPrice}>{priceText(featured)}</span>}
            <button type="button" className={`${s.btn} ${s.btnAccent}`} style={{ height: 56, padding: '0 32px' }} onClick={() => onOpen(featured)}>
              {cta(featured)}
            </button>
          </div>
        </div>
      )}

      {(rest.length > 0 || all) && (
        <div className={s.expToolbar}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {all && (
              <button type="button" className={s.back} onClick={() => setAll(false)}>
                ← Back
              </button>
            )}
            <span className={s.listTitle}>
              <span className={s.display}>{all ? `All ${label.toLowerCase()}` : 'Coming up'}</span>
              {all && <span className={s.count}>{rest.length}</span>}
            </span>
          </div>
          <div className={s.selects} style={{ alignItems: 'flex-end' }}>
            {all && places.length > 1 && (
              <label className={s.selectLabel}>
                LOCATION
                <select className={s.select} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">All locations</option>
                  {places.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={s.viewToggle} role="group" aria-label="View">
              <button type="button" className={view === 'list' ? s.viewOn : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>
                List
              </button>
              <button type="button" className={view === 'grid' ? s.viewOn : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
                Images
              </button>
            </div>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        all ? (
          <p className={s.empty}>Nothing else coming up yet.</p>
        ) : null
      ) : view === 'list' ? (
        <div className={s.expList}>
          {shown.map((l) => (
            <div key={l.id} className={s.expRow}>
              <span className={s.expWhen}>{when(l)}</span>
              <div className={s.expMain}>
                <span className={s.expTitle}>{l.title}</span>
                <span className={s.expMeta}>{meta(l) || l.excerpt}</span>
              </div>
              <span className={s.expPrice}>{priceText(l)}</span>
              <button type="button" className={`${s.btn} ${s.expCta} ${s.expCtaDark}`} onClick={() => onOpen(l)}>
                {cta(l)}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={s.expGrid}>
          {shown.map((l) => {
            const p = l.startDate ? parts(l.startDate < today ? today : l.startDate) : null;
            return (
              <article key={l.id} className={s.expCard}>
                <div className={s.expMedia}>
                  {l.image && <img src={l.image} alt="" loading="lazy" />}
                  {p && (
                    <span className={s.expBadge}>
                      <span>{p.mon}</span>
                      <span>{p.day}</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className={s.featKind} style={{ letterSpacing: 2 }}>
                    {p ? p.dow : 'ANYTIME'}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>{l.title}</span>
                  <span className={s.expMeta}>{meta(l)}</span>
                </div>
                <div className={s.expCardFoot}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{priceText(l)}</span>
                  <button type="button" className={`${s.btn} ${s.expCta}`} onClick={() => onOpen(l)}>
                    {cta(l)}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!all && rest.length > shown.length && (
        <button type="button" className={`${s.btn} ${s.btnLg}`} style={{ alignSelf: 'center', borderColor: '#111' }} onClick={() => setAll(true)}>
          See all {items.length} {label.toLowerCase()}
        </button>
      )}
    </section>
  );
}

function News({ page, articles }: { page: PartnerPageResponse['page']; articles: PartnerPageResponse['articles'] }) {
  const [filter, setFilter] = useState<'all' | 'updates' | 'press'>('all');
  const posts = useMemo(
    () =>
      [
        ...articles.map((a) => ({
          key: a.slug,
          kind: 'updates' as const,
          label: 'UPDATE',
          title: a.title,
          excerpt: a.excerpt,
          image: a.image,
          date: a.publishedAt,
          href: a.path,
          source: '',
        })),
        ...page.press.map((p, i) => ({
          key: `press-${i}`,
          kind: 'press' as const,
          label: 'IN THE NEWS',
          title: p.title,
          excerpt: '',
          image: p.image,
          date: p.date,
          href: p.href,
          source: p.source,
        })),
      ].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [articles, page.press],
  );
  const top = posts.find((p) => p.kind === 'updates');
  const rest = posts.filter((p) => p !== top && (filter === 'all' || p.kind === filter));
  const date = (d: string) => (d ? parts(d.slice(0, 10)).short : '');
  if (!posts.length) {
    return (
      <section className={`${s.wrap} ${s.section}`}>
        <p className={s.empty}>Updates from {page.short} will show here.</p>
      </section>
    );
  }
  return (
    <section className={`${s.wrap} ${s.section}`} style={{ gap: 72 }}>
      {top && (
        <a className={s.topPost} href={top.href}>
          {top.image ? <img src={top.image} alt="" /> : <span className={s.topPostBlank} />}
          <span className={s.topPostText}>
            <span className={s.postTags}>
              <span style={{ color: 'var(--accent)' }}>UPDATE</span>
              <span>{date(top.date)}</span>
            </span>
            <span className={s.topPostTitle}>{top.title}</span>
            {top.excerpt && <span className={s.topPostExcerpt}>{top.excerpt}</span>}
            <span className={`${s.btn} ${s.btnDark}`} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              Read the update
            </span>
          </span>
        </a>
      )}
      {rest.length > 0 || filter !== 'all' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <h3 className={s.sectionTitle} style={{ fontSize: 32, textAlign: 'left' }}>
              Recent
            </h3>
            <div className={s.postFilters}>
              {(
                [
                  ['all', 'All'],
                  ['updates', 'Updates'],
                  ['press', 'In the news'],
                ] as const
              ).map(([f, l]) => (
                <button key={f} type="button" className={`${s.postFilter} ${filter === f ? s.postFilterOn : ''}`} onClick={() => setFilter(f)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {rest.length ? (
            <div className={s.posts}>
              {rest.map((p) => (
                <a key={p.key} className={s.post} href={p.href || undefined} target={p.kind === 'press' ? '_blank' : undefined} rel="noopener noreferrer">
                  <span className={s.postImage}>{p.image ? <img src={p.image} alt="" loading="lazy" /> : p.source || page.short}</span>
                  <span className={s.postTags}>
                    <span
                      style={{
                        color: p.kind === 'press' ? '#111' : 'var(--accent)',
                      }}
                    >
                      {p.label}
                    </span>
                    <span>{date(p.date)}</span>
                  </span>
                  <span className={s.postTitle}>{p.title}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className={s.empty}>Nothing here yet.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Shop({ page, products, onOpen }: { page: PartnerPageResponse['page']; products: PartnerProduct[]; onOpen: (p: PartnerProduct) => void }) {
  const collections = [...new Set(products.map((p) => p.collection))];
  const [col, setCol] = useState('');
  const shown = products.filter((p) => !col || p.collection === col);
  return (
    <section className={`${s.wrap} ${s.section}`} style={{ alignItems: 'center', gap: 48, paddingTop: 72 }}>
      <div className={s.shopHead}>
        <span className={s.kicker}>{page.type === 'brand' ? 'BRAND STORE' : 'TEAM STORE'}</span>
        <h2 className={`${s.display} ${s.shopTitle}`}>{page.store.title || `Support ${page.short}`}</h2>
        <p className={s.shopSub}>{page.store.sub || 'Merch and keepsakes from the store.'}</p>
        {collections.length > 1 && (
          <div className={s.collections} style={{ marginTop: 10 }}>
            {collections.map((c) => (
              <button key={c} type="button" className={`${s.collection} ${col === c ? s.collectionOn : ''}`} onClick={() => setCol(col === c ? '' : c)}>
                {c} <span style={{ opacity: 0.6 }}>{products.filter((p) => p.collection === c).length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {shown.length ? (
        <div className={s.products}>
          {shown.map((p) => (
            <button key={p.id} type="button" className={s.product} onClick={() => onOpen(p)}>
              <span className={s.productImage}>{p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : p.category.toUpperCase()}</span>
              <span className={s.productCat}>{p.category.toUpperCase()}</span>
              <span className={s.productName}>{p.title}</span>
              <span className={s.productPrice}>{dollars(p.price)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className={s.empty}>The store opens soon.</p>
      )}
    </section>
  );
}

// --- Dialogs ------------------------------------------------------------------------------------------------------------

function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const isImage = !wide && typeof children === 'object' && children !== null && (children as { type?: unknown }).type === 'img';
  return createPortal(
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      {isImage ? (
        children
      ) : (
        <div className={`${s.dialog} ${wide ? s.dialogWide : ''}`} role="dialog" aria-modal="true">
          <button type="button" className={s.close} aria-label="Close" onClick={onClose}>
            ×
          </button>
          {children}
        </div>
      )}
    </div>,
    document.body,
  );
}

function ReviewsDialog({ page, reviews, onClose }: { page: PartnerPageResponse['page']; reviews: PartnerReviewData[]; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div className={s.dialogBody}>
        <div className={s.ratingBig}>
          <strong>{page.rating ?? '—'}</strong>
          <span>
            <span className={s.stars}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={18} fill={page.rating != null && i < Math.round(page.rating) ? 'currentColor' : '#DDDDDA'} />
              ))}
            </span>
            <span className={s.muted}>
              {page.reviewCount} verified review
              {page.reviewCount === 1 ? '' : 's'}
            </span>
          </span>
        </div>
        <div className={s.reviewRules}>
          <strong>To keep reviews real</strong>, only people checked in at a session with {page.short} can leave one: they get the link with their booking.
          Reading reviews is open to everyone.
        </div>
        {reviews.length === 0 ? (
          <p className={s.empty}>No reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={s.review}>
              <span className={s.stars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : '#DDDDDA'} />
                ))}
              </span>
              <span style={{ fontSize: 16 }}>{r.text}</span>
              <span className={s.reviewMeta}>
                {r.name} · {r.badge} · {r.session} · {parts(r.date).short}
              </span>
              {r.reply && (
                <div className={s.reply}>
                  <strong>{page.short} replied:</strong> {r.reply.text}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Overlay>
  );
}

function WorkDialog({ slug, short, onClose }: { slug: string; short: string; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    organization: '',
    email: '',
    onClp: false,
    collabType: '',
    idea: '',
    website: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.organization.trim() || !form.email.trim() || !form.collabType || !form.idea.trim())
      return setError('Fill in every field, please.');
    setBusy(true);
    setError('');
    try {
      await sendPartnerLead(slug, form);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Overlay onClose={onClose}>
      {sent ? (
        <div className={s.dialogBody} style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className={s.kicker}>THANK YOU</span>
          <h3 className={`${s.display} ${s.dialogTitle}`}>We got your idea</h3>
          <span className={s.muted}>The CLP and {short} teams will review it and reach out by email.</span>
          <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className={s.dialogBody} onSubmit={submit} noValidate>
          <span className={s.kicker}>WORK WITH {short.toUpperCase()}</span>
          <h3 className={`${s.display} ${s.dialogTitle}`}>Partnership interest form</h3>
          <label className={s.field}>
            Your name
            <input className={s.input} maxLength={120} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className={s.field}>
            Brand or organization
            <input
              className={s.input}
              maxLength={120}
              autoComplete="organization"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          </label>
          <label className={s.field}>
            Work email
            <input
              className={s.input}
              type="email"
              maxLength={200}
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <div className={s.field}>
            Are you already on CLP?
            <div className={s.radios}>
              <button type="button" className={`${s.size} ${form.onClp ? s.sizeOn : ''}`} onClick={() => setForm({ ...form, onClp: true })}>
                Yes, we’re on CLP
              </button>
              <button type="button" className={`${s.size} ${!form.onClp ? s.sizeOn : ''}`} onClick={() => setForm({ ...form, onClp: false })}>
                Not yet
              </button>
            </div>
          </div>
          <label className={s.field}>
            Type of collab
            <select className={s.input} value={form.collabType} onChange={(e) => setForm({ ...form, collabType: e.target.value })}>
              <option value="">Choose…</option>
              {COLLAB_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
              <option value="other">Other</option>
            </select>
          </label>
          <label className={s.field}>
            Tell us about the idea
            <textarea className={s.input} maxLength={2000} value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} />
          </label>
          {/* A field people don't see: filled in, the request is a bot's. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            style={{ position: 'absolute', left: -9999 }}
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          {error && <span className={s.formError}>{error}</span>}
          <button type="submit" className={`${s.btn} ${s.btnAccent} ${s.btnLg}`} disabled={busy}>
            {busy ? 'Sending…' : 'Send interest'}
          </button>
        </form>
      )}
    </Overlay>
  );
}

function SubscribeDialog({ slug, name, preview, onClose }: { slug: string; name: string; preview: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('busy');
    setError('');
    try {
      await subscribeToPartner(slug, email.trim());
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not subscribe.');
      setState('idle');
    }
  };
  return (
    <Overlay onClose={onClose}>
      <form className={s.dialogBody} onSubmit={submit}>
        <span className={s.kicker}>SUBSCRIBE</span>
        <h3 className={`${s.display} ${s.dialogTitle}`}>Follow {name}</h3>
        {state === 'done' ? (
          <>
            <span className={s.muted}>
              You’re subscribed. New dates, drops and updates from {name} come to {email}.
            </span>
            <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <span className={s.muted}>New dates, drops and updates, by email. Unsubscribe anytime.</span>
            <input
              className={s.input}
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            {error && <span className={s.formError}>{error}</span>}
            <button type="submit" className={`${s.btn} ${s.btnAccent} ${s.btnLg}`} disabled={state === 'busy' || preview}>
              {state === 'busy' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </>
        )}
      </form>
    </Overlay>
  );
}

function ShareDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : window.location.href.replace(/[?&]preview=[^&#]*/, '');
  const enc = encodeURIComponent(url);
  return (
    <Overlay onClose={onClose}>
      <div className={s.dialogBody}>
        <span className={s.kicker}>SHARE</span>
        <h3 className={`${s.display} ${s.dialogTitle}`}>{name}</h3>
        <input className={s.input} readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Page link" />
        <div className={s.radios} style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`${s.btn} ${s.btnDark}`}
            onClick={async () => {
              await navigator.clipboard?.writeText(url).catch(() => {});
              setCopied(true);
            }}
          >
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <a className={s.btn} href={`https://www.facebook.com/share.php?u=${enc}`} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a className={s.btn} href={`https://twitter.com/share?url=${enc}`} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a className={s.btn} href={`mailto:?subject=${encodeURIComponent(name)}&body=${enc}`}>
            Email
          </a>
        </div>
      </div>
    </Overlay>
  );
}

function ProductDialog({
  product,
  short,
  onClose,
  onAdd,
}: {
  product: PartnerProduct;
  short: string;
  onClose: () => void;
  onAdd: (option: string, qty: number) => void;
}) {
  const [option, setOption] = useState(product.options[0] ?? '');
  const [qty, setQty] = useState(1);
  return (
    <Overlay onClose={onClose} wide>
      <div className={s.productDialog}>
        <div className={s.productDialogImage}>{product.image ? <img src={product.image} alt={product.title} /> : product.category.toUpperCase()}</div>
        <div className={s.dialogBody}>
          <span className={s.productCat}>
            {short.toUpperCase()} · {product.category.toUpperCase()}
          </span>
          <h3 className={`${s.display} ${s.dialogTitle}`}>{product.title}</h3>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{dollars(product.price)}</span>
          <div className={s.field}>
            {product.optionLabel}
            <div className={s.sizes}>
              {product.options.map((o) => (
                <button key={o} type="button" className={`${s.size} ${option === o ? s.sizeOn : ''}`} onClick={() => setOption(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className={s.field}>
            Quantity
            <span className={s.qty}>
              <button type="button" aria-label="Less" onClick={() => setQty(Math.max(1, qty - 1))}>
                −
              </button>
              <span>{qty}</span>
              <button type="button" aria-label="More" onClick={() => setQty(Math.min(20, qty + 1))}>
                +
              </button>
            </span>
          </div>
          <button type="button" className={`${s.btn} ${s.btnAccent} ${s.btnLg}`} onClick={() => onAdd(option, qty)}>
            Add to cart · {dollars(product.price * qty)}
          </button>
          <span className={s.muted} style={{ fontSize: 13 }}>
            Ships from the partner store. Shipping &amp; returns details at checkout.
          </span>
        </div>
      </div>
    </Overlay>
  );
}

function CartDrawer({ lines, onClose, onRemove }: { lines: CartLine[]; onClose: () => void; onRemove: (key: string) => void }) {
  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const [note, setNote] = useState(false);
  return createPortal(
    <>
      <div className={s.overlay} style={{ background: 'rgba(10,10,10,.4)' }} onMouseDown={onClose} />
      <aside className={s.drawer} role="dialog" aria-modal="true" aria-label="Your cart">
        <div className={s.drawerHead}>
          Your cart ({lines.reduce((n, l) => n + l.qty, 0)})
          <button type="button" className={s.close} style={{ position: 'static' }} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={s.drawerBody}>
          {lines.length === 0 ? (
            <span className={s.muted}>Your cart is empty.</span>
          ) : (
            lines.map((l) => (
              <div key={l.key} className={s.cartLine}>
                <span className={s.cartThumb}>{l.image && <img src={l.image} alt="" />}</span>
                <span
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <strong>{l.title}</strong>
                  <span className={s.muted} style={{ fontSize: 13 }}>
                    {l.option} · Qty {l.qty}
                  </span>
                  <button type="button" className={s.back} style={{ textDecoration: 'underline' }} onClick={() => onRemove(l.key)}>
                    Remove
                  </button>
                </span>
                <strong>{dollars(l.price * l.qty)}</strong>
              </div>
            ))
          )}
        </div>
        <div className={s.drawerFoot}>
          <span
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
            }}
          >
            <span>Subtotal</span>
            <span>{dollars(total)}</span>
          </span>
          {note && (
            <span className={s.muted} style={{ fontSize: 13 }}>
              Online checkout opens soon: payments aren’t connected yet. Your cart is saved on this device.
            </span>
          )}
          <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnLg}`} disabled={!lines.length} onClick={() => setNote(true)}>
            Checkout
          </button>
          <button type="button" className={s.btn} onClick={onClose}>
            Keep shopping
          </button>
        </div>
      </aside>
    </>,
    document.body,
  );
}
