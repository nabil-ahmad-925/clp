'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LuArrowUpDown, LuLayers, LuMapPin, LuSearch, LuShapes, LuVolleyball } from 'react-icons/lu';
import { NO_SEARCH, fold, useSharedSearch, type Search } from '@/components/sections/DirectorySearch';
import FilterChip from '@/components/ui/FilterChip';
import { AppliedPill } from '@/components/ui/FilterPopover';
import MobileFilters from '@/components/ui/MobileFilters';
import PillSelect from '@/components/ui/PillSelect';
import { PARTNER_CATEGORIES, PARTNER_SPORTS, PARTNER_TYPES, loadLivePartners, partnerHref, partnerType, type PartnerCardData } from '@/content/partnerPages';
import { partnerWays, partnershipsDisclaimer } from '@/content/partnerships';
import t from '@/components/sections/TeamDirectory.module.css';
import BecomePartner from './BecomePartner';
import { PartnerCard } from './PartnerDirectory';
import rows from '@/components/faq/FaqRows.module.css';
import s from './partnerships.module.css';

type Filters = { cats: string[]; types: string[]; sports: string[] };
const NO_FILTERS: Filters = { cats: [], types: [], sports: [] };

const catLabel = (id: string) => PARTNER_CATEGORIES.find((c) => c.id === id)?.label ?? id;
const sportLabel = (id: string) => PARTNER_SPORTS.find((sp) => sp.id === id)?.label ?? id;

/** A partner with no sports listed works with every sport. */
const matches = (p: PartnerCardData, f: Filters, search: Search) => {
  if (f.cats.length > 0 && !p.partnerCategories.some((c) => f.cats.includes(c))) return false;
  if (f.types.length > 0 && !f.types.includes(p.type)) return false;
  if (f.sports.length > 0 && p.sports.length > 0 && !p.sports.some((sp) => f.sports.includes(sp))) return false;
  const text = fold([p.name, p.short, p.category, p.about, partnerType(p.type).label, ...p.partnerCategories.map(catLabel), ...p.sports.map(sportLabel)].join(' '));
  if (
    !fold(search.q)
      .split(/\s+/)
      .filter(Boolean)
      .every((w) => text.includes(w))
  )
    return false;
  return !search.loc || fold(p.area).includes(fold(search.loc));
};

/** CLP features a partner with its ★ (Partners in the admin) or on one of its categories' listings (the Partnerships page). */
const featuredAnywhere = (p: PartnerCardData) => Boolean(p.homeFeatured) || (p.featured?.length ?? 0) > 0;
const byRating = (a: PartnerCardData, b: PartnerCardData) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name);
const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'az', label: 'A–Z' },
] as const;
type Sort = (typeof SORTS)[number]['value'];
/** Recommended: CLP's featured partners first, then top rated. */
const ORDER: Record<Sort, (a: PartnerCardData, b: PartnerCardData) => number> = {
  recommended: (a, b) => Number(featuredAnywhere(b)) - Number(featuredAnywhere(a)) || byRating(a, b),
  rating: byRating,
  az: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
};

/** The featured band's cards a row (more wrap onto the next). */
const FEATURED_ROW = 4;

/**
 * The Partnerships page (/partnerships/, the "Partnerships · category directory" design): under the heading and its
 * search bar, the filters, then the partner categories (each opening its listing, /portfolio/<category>-partners/)
 * and CLP's featured partners. A search, a filter or "View All Partners" shows the matching partners' cards instead.
 * Then the ways to partner with CLP and the gold "Want your page on CLP?" band.
 */
export default function PartnershipsView() {
  const shared = useSharedSearch();
  const search = shared?.search ?? NO_SEARCH;
  const [items, setItems] = useState<PartnerCardData[] | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('recommended');
  const results = useRef<HTMLDivElement>(null);
  const toResults = () => setTimeout(() => results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const setPlaces = shared?.setPlaces;
  useEffect(() => {
    let active = true;
    loadLivePartners().then((list) => {
      if (!active) return;
      setItems(list);
      // The location field suggests the partners' areas.
      const areas = new Map<string, number>();
      list.forEach((p) => p.area && areas.set(p.area, (areas.get(p.area) ?? 0) + 1));
      setPlaces?.([...areas].map(([value, count]) => ({ value, label: value, count })));
    });
    return () => {
      active = false;
    };
  }, [setPlaces]);

  // The bar under the heading searches here, and brings the results into view.
  const register = shared?.register;
  const setSearch = shared?.setSearch;
  useEffect(
    () =>
      register?.((next) => {
        setSearch?.(next);
        toResults();
      }),
    [register, setSearch],
  );

  const list = items ?? [];
  const count = (f: Filters) => list.filter((p) => matches(p, f, search)).length;
  const shown = list.filter((p) => matches(p, filters, search)).sort(ORDER[sort]);
  const anyChosen = filters.cats.length + filters.types.length + filters.sports.length > 0 || Boolean(search.q || search.loc);
  const listing = anyChosen || all;
  const apply = (next: Filters) => {
    setFilters(next);
    setOpen(null);
  };
  const clearAll = () => {
    setFilters(NO_FILTERS);
    setAll(false);
    if (search.q || search.loc) setSearch?.(NO_SEARCH);
  };

  const catOptions = PARTNER_CATEGORIES.map((c) => ({ value: c.id, label: c.label, count: items ? count({ ...filters, cats: [c.id] }) : undefined }));
  const typeOptions = PARTNER_TYPES.filter((ty) => list.some((p) => p.type === ty.id) || filters.types.includes(ty.id)).map((ty) => ({
    value: ty.id,
    label: ty.label,
    count: count({ ...filters, types: [ty.id] }),
  }));
  const sportOptions = PARTNER_SPORTS.map((sp) => ({ value: sp.id, label: sp.label, count: items ? count({ ...filters, sports: [sp.id] }) : undefined }));

  const where = filters.cats.length === 1 ? `in ${catLabel(filters.cats[0])}` : filters.cats.length > 1 ? `in ${filters.cats.length} categories` : 'across all categories';
  // The results' count, while a search or a filter shows them.
  const summary =
    listing && items ? (
      <>
        <strong>
          {shown.length} {shown.length === 1 ? 'result' : 'results'}
        </strong>{' '}
        {where}
        {search.loc ? ` near ${search.loc}` : ''}
      </>
    ) : null;

  return (
    <div className={s.page} data-listing="">
      <section className={s.wrap} ref={results}>
        <div className={`${t.bar} ${s.bar}`}>
          <div className={t.barRow}>
            <div className={`${t.filters} ${items ? '' : t.busy}`} inert={!items}>
              <FilterChip
                name="All Categories"
                heading="Category"
                icon={<LuLayers />}
                plural="categories"
                options={catOptions}
                value={filters.cats}
                open={open === 'cat'}
                onOpenChange={(o) => setOpen(o ? 'cat' : null)}
                resultsFor={(draft) => count({ ...filters, cats: draft })}
                onApply={(cats) => apply({ ...filters, cats })}
              />
              {typeOptions.length > 0 && (
                <FilterChip
                  name="Any Partner Type"
                  heading="Partner Type"
                  icon={<LuShapes />}
                  plural="types"
                  options={typeOptions}
                  value={filters.types}
                  open={open === 'type'}
                  onOpenChange={(o) => setOpen(o ? 'type' : null)}
                  resultsFor={(draft) => count({ ...filters, types: draft })}
                  onApply={(types) => apply({ ...filters, types })}
                />
              )}
              <FilterChip
                name="Sport"
                icon={<LuVolleyball />}
                plural="sports"
                options={sportOptions}
                value={filters.sports}
                open={open === 'sport'}
                onOpenChange={(o) => setOpen(o ? 'sport' : null)}
                resultsFor={(draft) => count({ ...filters, sports: draft })}
                onApply={(sports) => apply({ ...filters, sports })}
              />
              {search.q && <AppliedPill icon={<LuSearch />} label={`“${search.q}”`} onClear={() => setSearch?.({ ...search, q: '' })} />}
              {search.loc && <AppliedPill icon={<LuMapPin />} label={search.loc} onClear={() => setSearch?.({ ...search, loc: '' })} />}
              {listing && (
                <button type="button" className={t.clearAll} onClick={clearAll}>
                  Clear
                </button>
              )}
            </div>
            <div className={t.mobileFilters}>
              <MobileFilters
                sections={[
                  { id: 'cat', heading: 'Category', options: catOptions, value: filters.cats },
                  ...(typeOptions.length > 0 ? [{ id: 'type', heading: 'Partner Type', options: typeOptions, value: filters.types }] : []),
                  { id: 'sport', heading: 'Sport', options: sportOptions, value: filters.sports },
                ]}
                applied={[filters.cats, filters.types, filters.sports].filter((v) => v.length > 0).length}
                sort={{ value: sort, options: SORTS }}
                countFor={(draft) => count({ cats: draft.cat ?? [], types: draft.type ?? [], sports: draft.sport ?? [] })}
                onApply={(draft, nextSort) => {
                  apply({ cats: draft.cat ?? [], types: draft.type ?? [], sports: draft.sport ?? [] });
                  if (nextSort) setSort(nextSort as Sort);
                }}
              />
            </div>
            <div className={t.sortSlot}>
              <span className={t.sortDesktop}>
                <PillSelect value={sort} options={SORTS} onChange={setSort} label="Sort partners" icon={<LuArrowUpDown />} />
              </span>
            </div>
          </div>
        </div>
        {summary && (
          <div className={s.summary} role="status">
            {summary}
          </div>
        )}
      </section>

      {listing ? (
        <section className={`${s.wrap} ${s.results}`}>
          {!items ? (
            <div className={t.listingGrid} aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={`${t.skeleton} ${t.listingSkeleton}`} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <Empty category={filters.cats.length === 1 && !list.some((p) => p.partnerCategories.includes(filters.cats[0])) ? catLabel(filters.cats[0]) : undefined} onClear={clearAll} />
          ) : (
            // The partners' cards as on the categories' listings.
            <div className={t.listingGrid}>
              {shown.map((p, i) => (
                <PartnerCard key={p.slug} partner={p} eager={i < 4} featured={featuredAnywhere(p)} />
              ))}
            </div>
          )}
          <p className={s.disclaimer}>{partnershipsDisclaimer}</p>
        </section>
      ) : (
        <>
          <CategoryDirectory items={items} />
          <FeaturedBand
            items={list.filter(featuredAnywhere).sort((a, b) => Number(Boolean(b.homeFeatured)) - Number(Boolean(a.homeFeatured)) || byRating(a, b))}
            onViewAll={() => {
              setAll(true);
              toResults();
            }}
          />
        </>
      )}

      <WaysToPartner />

      <section className={s.goldWrap} data-header-tone="dark">
        <div className={s.gold}>
          <h2 className={s.goldTitle}>Want Your Page on CLP?</h2>
          <span className={s.goldText}>One short application for clubs, coaches, facilities, brands, athletes and organizations. We reply within 3 business days.</span>
          <div className={s.goldActions}>
            <BecomePartner className={s.btnDark}>Apply to be a partner</BecomePartner>
            <Link href="/faq/partnerships/" className={s.btnOutline}>
              Partnership FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/** A partner's logo tile: their logo, else their photo, else their initials on their colour. */
function Logo({ partner: p, className }: { partner: PartnerCardData; className: string }) {
  return (
    <span className={className} style={{ background: p.color || partnerType(p.type).color }} title={p.name}>
      {p.logo || p.hero ? <Image src={p.logo || p.hero} alt="" width={96} height={96} /> : p.mono}
    </span>
  );
}

/** The partner's photo (their colour while they have none). */
function Photo({ partner: p, eager, sizes }: { partner: PartnerCardData; eager: boolean; sizes: string }) {
  return p.hero ? (
    <Image className={s.photo} src={p.hero} alt="" fill sizes={sizes} loading={eager ? 'eager' : 'lazy'} />
  ) : (
    <span className={s.photoBlank} style={{ background: p.color || partnerType(p.type).color }} />
  );
}

function Empty({ category, onClear }: { category?: string; onClear: () => void }) {
  return (
    <div className={s.empty} role="status">
      <strong className={s.emptyTitle}>{category ? `No ${category} partners yet` : 'No partners match'}</strong>
      <span className={s.emptyText}>
        {category
          ? `This category is open. If you work in ${category.toLowerCase()}, apply and your page could be the first one here.`
          : 'Try another city or fewer filters.'}
      </span>
      <div className={s.emptyActions}>
        <BecomePartner className={s.btnDark}>Apply to be a partner</BecomePartner>
        <button type="button" className={s.btnLight} onClick={onClear}>
          See all partners
        </button>
      </div>
    </div>
  );
}

/** "Browse partners by category": each category, its partners' logos and count, opening its listing. */
function CategoryDirectory({ items }: { items: PartnerCardData[] | null }) {
  return (
    <section className={`${s.wrap} ${s.directory}`}>
      <div className={s.head}>
        <h2 className={s.headTitle}>Browse Partners by Category</h2>
        <span className={s.headText}>Tap a category to see every partner in it.</span>
      </div>
      <div className={s.cats}>
        {PARTNER_CATEGORIES.map((c) => {
          const mine = items?.filter((p) => p.partnerCategories.includes(c.id)) ?? [];
          const n = mine.length;
          return (
            <Link key={c.id} href={c.href} className={s.cat}>
              <span className={s.catText}>
                <strong className={s.catName}>{c.label}</strong>
                <span className={s.catBlurb}>{c.blurb}</span>
              </span>
              <span className={s.catFoot}>
                <span className={s.catWho}>
                  {items &&
                    (n > 0 ? (
                      <>
                        <span className={s.faces}>
                          {mine.slice(0, 3).map((p) => (
                            <Logo key={p.slug} partner={p} className={s.face} />
                          ))}
                        </span>
                        <span className={s.catCount}>
                          {n} {n === 1 ? 'partner' : 'partners'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={s.faceOpen} aria-hidden>
                          +
                        </span>
                        <span className={`${s.catCount} ${s.catCountOpen}`}>Open for partners</span>
                      </>
                    ))}
                </span>
                <span className={s.catGo}>{items && n === 0 ? 'Be the first →' : 'View all →'}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** "Hand-picked by CLP": the partners CLP features (the admin's Partnerships page), on black. */
function FeaturedBand({ items, onViewAll }: { items: PartnerCardData[]; onViewAll: () => void }) {
  if (items.length === 0) return null;
  return (
    <section className={s.featured} data-header-tone="light">
      <div className={s.featuredInner}>
        <div className={s.head}>
          <h2 className={s.featuredTitle}>Hand-Picked by CLP</h2>
          <span className={s.featuredText}>Partners our team recommends this month.</span>
          <span className={s.eyebrow}>FEATURED PARTNERS</span>
        </div>
        <div className={s.featuredGrid} style={{ '--n': Math.min(items.length, FEATURED_ROW) } as CSSProperties}>
          {items.map((p, i) => (
            <Link key={p.slug} href={partnerHref(p.slug)} className={s.fcard} aria-label={`Learn more about ${p.name}`}>
              <span className={s.fmedia}>
                <Photo partner={p} eager={i === 0} sizes="(max-width: 999px) 50vw, 320px" />
              </span>
              <span className={s.fbody}>
                <Logo partner={p} className={s.flogo} />
                <strong className={s.fname}>{p.name}</strong>
                <span className={s.fline}>{[p.category || partnerType(p.type).label, p.area].filter(Boolean).join(' · ')}</span>
                {p.rating != null && p.reviewCount > 0 && (
                  <span className={s.frating}>
                    ★ {p.rating.toFixed(1)} · {p.reviewCount} {p.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                )}
                <span className={s.fgo}>
                  <span>Learn More</span>
                  <span className={s.farrow} aria-hidden>
                    →
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
        <button type="button" className={s.viewAll} onClick={onViewAll}>
          View All Partners
        </button>
      </div>
    </section>
  );
}

/** "Ways to partner with CLP": who you are (the switch), its questions (the FAQ's rows, each opening on its own) and what you get. */
function WaysToPartner() {
  const [way, setWay] = useState(partnerWays[2].id);
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const current = partnerWays.find((w) => w.id === way) ?? partnerWays[0];
  return (
    <section className={s.ways}>
      <div className={s.head}>
        <h2 className={s.headTitle}>Ways to Partner with CLP</h2>
        <span className={s.headText}>Pick what fits you. Every partner gets a page, bookings, a store and support from our team.</span>
        <span className={s.eyebrowDeep}>BECOME A PARTNER</span>
      </div>
      <div className={s.switch} role="group" aria-label="Partner type">
        {partnerWays.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`${s.switchBtn} ${w.id === way ? s.switchOn : ''}`}
            aria-pressed={w.id === way}
            onClick={() => {
              setWay(w.id);
              setOpened(new Set());
            }}
          >
            {w.label}
          </button>
        ))}
      </div>
      <div className={s.waysBody}>
        <div className={rows.list}>
          {current.questions.map((x, i) => {
            const isOpen = opened.has(i);
            return (
              <div key={x.q} className={rows.item}>
                <button
                  type="button"
                  className={rows.question}
                  aria-expanded={isOpen}
                  onClick={() => {
                    const next = new Set(opened);
                    if (isOpen) next.delete(i);
                    else next.add(i);
                    setOpened(next);
                  }}
                >
                  <span className={rows.questionText}>
                    <span className={rows.q}>{x.q}</span>
                  </span>
                  <span className={rows.sign} aria-hidden>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && <div className={rows.answer}>{x.a}</div>}
              </div>
            );
          })}
        </div>
        <div className={s.perks}>
          <span className={s.perksTitle}>WHAT YOU GET</span>
          {current.perks.map((k) => (
            <span key={k} className={s.perk}>
              <span className={s.check} aria-hidden>
                ✓
              </span>
              {k}
            </span>
          ))}
          <BecomePartner className={`${s.btnDark} ${s.perksCta}`} type={current.partnerType}>
            {current.cta}&nbsp;→
          </BecomePartner>
        </div>
      </div>
    </section>
  );
}
