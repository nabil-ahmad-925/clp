'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { LuArrowUpDown, LuBadgeCheck, LuMapPin, LuSearch, LuShapes, LuStar, LuVolleyball } from 'react-icons/lu';
import { NO_SEARCH, fold, useSharedSearch, type Search } from '@/components/sections/DirectorySearch';
import FilterChip from '@/components/ui/FilterChip';
import { AppliedPill } from '@/components/ui/FilterPopover';
import MobileFilters from '@/components/ui/MobileFilters';
import PillSelect from '@/components/ui/PillSelect';
import Pager from '@/components/ui/Pager';
import { PARTNER_SPORTS, PARTNER_TYPES, loadLivePartners, partnerHref, partnerType, type PartnerCardData } from '@/content/partnerPages';
import t from '@/components/sections/TeamDirectory.module.css';
import BecomePartner from './BecomePartner';
import c from './partnerDirectory.module.css';

const PAGE_SIZES = [12, 24, 48];
const sportLabel = (id: string) => PARTNER_SPORTS.find((s) => s.id === id)?.label ?? id;

type Filters = { sports: string[]; types: string[] };

/** A partner with no sports listed works with every sport. */
const playsAny = (p: PartnerCardData, sports: string[]) => sports.length === 0 || p.sports.length === 0 || p.sports.some((s) => sports.includes(s));

const matches = (p: PartnerCardData, f: Filters, search: Search) => {
  if (!playsAny(p, f.sports)) return false;
  if (f.types.length > 0 && !f.types.includes(p.type)) return false;
  const text = fold([p.name, p.short, p.category, p.about, partnerType(p.type).label].join(' '));
  if (
    !fold(search.q)
      .split(/\s+/)
      .filter(Boolean)
      .every((w) => text.includes(w))
  )
    return false;
  return !search.loc || fold(p.area).includes(fold(search.loc));
};

/** Top rated first (more reviews breaking ties), then A to Z. */
const byRating = (a: PartnerCardData, b: PartnerCardData) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name);
const byName = (a: PartnerCardData, b: PartnerCardData) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

/** The sort menu (the listing pages' "Recommended" pill): top rated first, or by name. */
const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'az', label: 'Name: A to Z' },
  { value: 'za', label: 'Name: Z to A' },
] as const;
type PartnerSort = (typeof SORTS)[number]['value'];
const ORDER: Record<PartnerSort, (a: PartnerCardData, b: PartnerCardData) => number> = { recommended: byRating, az: byName, za: (a, b) => byName(b, a) };

/**
 * A partner category's listing (/portfolio/<category>-partners/), in the experiences listing design: the search bar on
 * the heading's edge (name, place), Sport and Type filters (?sport=<id> picks the sport, as the listing pages' "View All
 * Partners" do), the partners' cards (each opening the partner's page) and the pager. The last page ends with "Your Brand
 * Should Be Here" (becoming a partner).
 */
export default function PartnerDirectory(props: { category: string; label: string }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Directory {...props} />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className={`${t.directory} ${t.listing}`} data-listing="">
      <div className={t.bar} />
      <div className={t.listingGrid} aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`${t.skeleton} ${t.listingSkeleton}`} />
        ))}
      </div>
    </div>
  );
}

function Directory({ category, label }: { category: string; label: string }) {
  const params = useSearchParams();
  const shared = useSharedSearch();
  const search = shared?.search ?? NO_SEARCH;
  const [items, setItems] = useState<PartnerCardData[] | null>(null);
  const [filters, setFilters] = useState<Filters>(() => ({ sports: params.getAll('sport').filter((s) => PARTNER_SPORTS.some((x) => x.id === s)), types: [] }));
  const [open, setOpen] = useState<string | null>(null);
  const [size, setSize] = useState(PAGE_SIZES[0]);
  const [sort, setSort] = useState<PartnerSort>(() => (SORTS.some((o) => o.value === params.get('sort')) ? (params.get('sort') as PartnerSort) : 'recommended'));
  const [page, setPage] = useState({ key: '', index: 0 });
  const top = useRef<HTMLDivElement>(null);

  const setPlaces = shared?.setPlaces;
  useEffect(() => {
    let active = true;
    loadLivePartners().then((all) => {
      if (!active) return;
      const mine = all.filter((p) => p.partnerCategories.includes(category));
      setItems(mine);
      // The location field suggests the partners' areas.
      const areas = new Map<string, number>();
      mine.forEach((p) => p.area && areas.set(p.area, (areas.get(p.area) ?? 0) + 1));
      setPlaces?.([...areas].map(([value, count]) => ({ value, label: value, count })));
    });
    return () => {
      active = false;
    };
  }, [category, setPlaces]);

  // The bar under the heading searches here (the results filter in the browser).
  const register = shared?.register;
  const setSearch = shared?.setSearch;
  useEffect(() => register?.((next) => setSearch?.(next)), [register, setSearch]);

  const apply = (next: Filters) => {
    setFilters(next);
    setOpen(null);
    // The sport stays in the address, to share or come back to.
    const url = new URL(window.location.href);
    url.searchParams.delete('sport');
    next.sports.forEach((s) => url.searchParams.append('sport', s));
    window.history.replaceState(null, '', url);
  };
  const chooseSort = (next: PartnerSort) => {
    setSort(next);
    const url = new URL(window.location.href);
    if (next === 'recommended') url.searchParams.delete('sort');
    else url.searchParams.set('sort', next);
    window.history.replaceState(null, '', url);
  };

  if (!items) return <Skeleton />;
  const shown = items.filter((p) => matches(p, filters, search)).sort(ORDER[sort]);
  const count = (f: Filters) => items.filter((p) => matches(p, f, search)).length;
  const key = JSON.stringify([filters, search, size, sort]);
  const pageCount = Math.max(1, Math.ceil(shown.length / size));
  const index = page.key === key ? Math.min(page.index, pageCount - 1) : 0;
  const pageItems = shown.slice(index * size, (index + 1) * size);
  const goTo = (n: number) => {
    setPage({ key, index: n });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const anyChosen = filters.sports.length > 0 || filters.types.length > 0 || Boolean(search.q || search.loc);
  const clearAll = () => {
    apply({ sports: [], types: [] });
    if (search.q || search.loc) setSearch?.(NO_SEARCH);
  };

  const sportOptions = PARTNER_SPORTS.map((s) => ({ value: s.id, label: s.label, count: count({ ...filters, sports: [s.id] }) }));
  const typeOptions = PARTNER_TYPES.filter((ty) => items.some((p) => p.type === ty.id)).map((ty) => ({
    value: ty.id,
    label: ty.label,
    count: count({ ...filters, types: [ty.id] }),
  }));
  const lastPage = index === pageCount - 1;

  return (
    <div ref={top} className={`${t.directory} ${t.listing}`} data-listing="">
      <div className={t.bar}>
        <div className={t.barRow}>
          <div className={t.filters}>
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
            {typeOptions.length > 1 && (
              <FilterChip
                name="All Partners"
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
            {search.q && <AppliedPill icon={<LuSearch />} label={`“${search.q}”`} onClear={() => setSearch?.({ ...search, q: '' })} />}
            {search.loc && <AppliedPill icon={<LuMapPin />} label={search.loc} onClear={() => setSearch?.({ ...search, loc: '' })} />}
            {anyChosen && (
              <button type="button" className={t.clearAll} onClick={clearAll}>
                Clear All
              </button>
            )}
          </div>
          <div className={t.sortSlot}>
            <span className={t.sortDesktop}>
              <PillSelect value={sort} options={SORTS} onChange={chooseSort} label="Sort partners" icon={<LuArrowUpDown />} />
            </span>
          </div>
          <div className={t.mobileFilters}>
            <MobileFilters
              sections={[
                { id: 'sport', heading: 'Sport', options: sportOptions, value: filters.sports },
                ...(typeOptions.length > 1 ? [{ id: 'type', heading: 'Partner Type', options: typeOptions, value: filters.types }] : []),
              ]}
              applied={(filters.sports.length > 0 ? 1 : 0) + (filters.types.length > 0 ? 1 : 0)}
              sort={{ value: sort, options: SORTS }}
              countFor={(draft) => count({ sports: draft.sport ?? [], types: draft.type ?? [] })}
              onApply={(draft, nextSort) => {
                apply({ sports: draft.sport ?? [], types: draft.type ?? [] });
                if (nextSort && nextSort !== sort) chooseSort(nextSort as PartnerSort);
              }}
            />
          </div>
        </div>
      </div>

      <div className={c.results}>
        {shown.length === 0 && items.length > 0 ? (
          <div className={t.listingEmpty} role="status">
            No {label} partners match these filters.{' '}
            <button type="button" className={t.listingClear} onClick={clearAll}>
              Clear All
            </button>
          </div>
        ) : (
          <div className={t.listingGrid}>
            {pageItems.map((p, i) => (
              <PartnerCard key={p.slug} partner={p} eager={i < 4} />
            ))}
            {lastPage && (
              <BecomePartner className={c.join}>
                <span className={c.joinKicker}>{label} Partners</span>
                <span className={c.joinTitle}>
                  Your Brand
                  <br />
                  Should Be Here
                </span>
                <span className={c.joinLine}>Your own page on CLP: bookings, a store, partnerships and verified reviews.</span>
                <span className={c.joinCta}>
                  Become a Partner{' '}
                  <span className="glyph" aria-hidden>
                    →
                  </span>
                </span>
              </BecomePartner>
            )}
          </div>
        )}

        {shown.length > PAGE_SIZES[0] && (
          <Pager
            className={t.pager}
            page={index}
            pageCount={pageCount}
            total={shown.length}
            shown={pageItems.length}
            pageSize={size}
            sizes={PAGE_SIZES}
            onPage={goTo}
            onPageSize={(n) => {
              setSize(n);
              top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}
      </div>
    </div>
  );
}

/** A partner's card (the listing card's design): their photo with their logo and the CLP Partner badge, then who they are. */
function PartnerCard({ partner: p, eager }: { partner: PartnerCardData; eager: boolean }) {
  const type = partnerType(p.type);
  const color = p.color || type.color;
  return (
    <Link href={partnerHref(p.slug)} className={c.card}>
      <span className={c.media} style={{ background: color }}>
        {p.hero ? (
          <Image className={c.image} src={p.hero} alt="" fill sizes="(max-width: 860px) 50vw, 300px" loading={eager ? 'eager' : 'lazy'} />
        ) : (
          <span className={c.mono}>{p.mono}</span>
        )}
        <span className={c.badge}>
          <LuBadgeCheck aria-hidden /> CLP Partner
        </span>
        <span className={c.logo} style={{ background: color }}>
          {p.logo ? <Image src={p.logo} alt="" width={56} height={56} /> : p.mono}
        </span>
      </span>
      <span className={c.body}>
        <span className={c.kind}>{type.label}</span>
        <span className={c.name}>{p.name}</span>
        {p.category && <span className={c.line}>{p.category}</span>}
        {p.area && (
          <span className={c.fact}>
            <LuMapPin aria-hidden /> {p.area}
          </span>
        )}
        {p.sports.length > 0 && (
          <span className={c.tags}>
            {p.sports.slice(0, 3).map((s) => (
              <span key={s} className={c.tag}>
                {sportLabel(s)}
              </span>
            ))}
            {p.sports.length > 3 && <span className={c.tag}>+{p.sports.length - 3}</span>}
          </span>
        )}
        <span className={c.footer}>
          {p.rating != null && p.reviewCount > 0 ? (
            <span className={c.rating}>
              <LuStar aria-hidden /> {p.rating.toFixed(1)}{' '}
              <span>
                ({p.reviewCount} review{p.reviewCount === 1 ? '' : 's'})
              </span>
            </span>
          ) : (
            <span className={c.fresh}>New on CLP</span>
          )}
          <span className={c.cta}>View Partner</span>
        </span>
      </span>
    </Link>
  );
}
