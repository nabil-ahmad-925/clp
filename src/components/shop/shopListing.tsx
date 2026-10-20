'use client';
/* eslint-disable @next/next/no-img-element -- the partners' product photos (their own uploads), shown as they are. */

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { LuArrowUpDown } from 'react-icons/lu';
import DirectorySearch, { fold, type Place } from '@/components/sections/DirectorySearch';
import ds from '@/components/sections/DirectorySearch.module.css';
import lc from '@/components/sections/ListingCard.module.css';
import t from '@/components/sections/TeamDirectory.module.css';
import FilterChip, { type ChipOption } from '@/components/ui/FilterChip';
import MobileFilters from '@/components/ui/MobileFilters';
import PillSelect from '@/components/ui/PillSelect';
import ViewToggle, { type ResultsView } from '@/components/ui/ViewToggle';
import { money } from '@/content/cart';
import { site } from '@/content/site';
import { isNewProduct, paint, productHref, swatches, type ShopProduct, type ShopStore } from '@/content/storefront';
import s from './shop.module.css';

/** The page sizes of the shop's lists (rows of four). */
export const LIST_SIZES = [12, 24, 48] as const;

/** The stores' areas with how many stores each has, A to Z: the search bar's location suggestions. */
export function storePlaces(stores: ShopStore[]): Place[] {
  const counts = new Map<string, number>();
  for (const st of stores) if (st.area) counts.set(st.area, (counts.get(st.area) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => ({ value: label, label, count }));
}

/** A store in the searched place (its area); everywhere when none is asked. */
export const inPlace = (store: Pick<ShopStore, 'area'> | undefined, loc: string) => !loc || fold(store?.area ?? '').includes(fold(loc));

/** A label in Title Case ("Photo Prints", "Uniforms & Kits"): each word capitalised, the short joining words kept small. */
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with']);
export const titleCase = (text: string) =>
  text.replace(/[^\s]+/g, (w, i: number) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)));

/** Every word of a search somewhere in `text`. */
export const hasWords = (text: string, q: string) => {
  const words = fold(q).split(/\s+/).filter(Boolean);
  const all = fold(text);
  return words.every((w) => all.includes(w));
};

/**
 * The shop's search bar, the experiences' bar (what, then where, then the search button) straddling the bottom edge of
 * the page heading.
 */
export function ShopSearch({
  q,
  loc,
  places,
  placeholder,
  label,
  onSearch,
  onGrey = false,
}: {
  q: string;
  loc: string;
  places: Place[];
  placeholder: string;
  label: string;
  onSearch: (q: string, loc: string) => void;
  /** A grey list follows it: the strip under the bar takes the list's grey, not the page's white. */
  onGrey?: boolean;
}) {
  return (
    <>
      <div className={s.navGap} />
      <div className={onGrey ? s.searchOnGrey : undefined}>
        <div className={ds.slot}>
          <DirectorySearch query={q} location={loc} places={places} placeholder={placeholder} label={label} onSearch={onSearch} />
        </div>
      </div>
    </>
  );
}

/** A filter of a list's bar: a pill (its icon and "All …" name) opening its options, one at a time. */
export type ListChip = {
  id: string;
  name: string;
  heading: string;
  icon: ReactNode;
  plural: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  /** How many results a choice would show (the panel's "Show N results"). */
  count: (value: string) => number;
};

/**
 * A list's bar, as the experiences': its filters (a sheet on phones), Clear All, then the sort and the grid / list
 * switch (and anything after them, `end`).
 */
export function ListToolbar<S extends string>({
  chips,
  sort,
  view,
  onView,
  end,
}: {
  chips: ListChip[];
  sort?: { value: S; options: readonly { value: S; label: string }[]; onChange: (value: S) => void };
  view?: ResultsView;
  onView?: (view: ResultsView) => void;
  end?: ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(null);
  // Filters always read in Title Case, whatever the data says.
  const shown = chips.filter((c) => c.options.length > 0).map((c) => ({ ...c, options: c.options.map((o) => ({ ...o, label: titleCase(o.label) })) }));
  const applied = shown.filter((c) => c.value).length;
  return (
    <div className={t.bar}>
      <div className={t.barRow}>
        <div className={t.filters}>
          {shown.map((c) => (
            <FilterChip
              key={c.id}
              name={c.name}
              heading={c.heading}
              icon={c.icon}
              plural={c.plural}
              single
              options={c.options}
              value={c.value ? [c.value] : []}
              open={open === c.id}
              onOpenChange={(o) => setOpen(o ? c.id : null)}
              resultsFor={(draft) => c.count(draft[0] ?? '')}
              onApply={(values) => {
                c.onChange(values[0] ?? '');
                setOpen(null);
              }}
            />
          ))}
          {applied > 0 && (
            <button type="button" className={t.clearAll} onClick={() => shown.forEach((c) => c.value && c.onChange(''))}>
              Clear All
            </button>
          )}
        </div>
        {/* Phones: one Filters button (a sheet) in place of the pills and the sort menu. */}
        {(shown.length > 0 || sort) && (
          <div className={t.mobileFilters}>
            <MobileFilters
              sections={shown.map((c) => ({ id: c.id, heading: c.heading, options: c.options, value: c.value ? [c.value] : [], single: true }))}
              sort={sort}
              applied={applied}
              countFor={(draft) => {
                const changed = shown.find((c) => (draft[c.id]?.[0] ?? '') !== c.value);
                return changed ? changed.count(draft[changed.id]?.[0] ?? '') : null;
              }}
              onApply={(draft, nextSort) => {
                shown.forEach((c) => {
                  const next = draft[c.id]?.[0] ?? '';
                  if (next !== c.value) c.onChange(next);
                });
                if (sort && nextSort && nextSort !== sort.value) sort.onChange(nextSort as S);
              }}
            />
          </div>
        )}
        <div className={t.sortSlot}>
          {sort && (
            <span className={t.sortDesktop}>
              <PillSelect label="Sort" icon={<LuArrowUpDown />} value={sort.value} options={sort.options} onChange={sort.onChange} />
            </span>
          )}
          {view && onView && <ViewToggle value={view} onChange={onView} />}
          {end}
        </div>
      </div>
    </div>
  );
}

/** What a product's card says under its name: its collection, or "Supports AFC" / "Only on CLP". */
const infoOf = (p: ShopProduct, store?: ShopStore) =>
  store?.shop.exclusive ? p.collection || 'Only on CLP' : store?.shop.private ? 'Private drop' : `Supports ${store?.short || store?.name || 'the store'}`;

/**
 * A product as the experiences' listing card: its photo (NEW, CLP EXCLUSIVE), the store, its name, what it supports,
 * the price with its colours, and View Item; a row of the list in the list view (as the experiences' rows: the price
 * on the left of the foot, View Item on the right).
 */
export function ProductCard({ product, store, eager, view = 'grid' }: { product: ShopProduct; store?: ShopStore; eager?: boolean; view?: ResultsView }) {
  const colors = swatches(product);
  const exclusive = Boolean(store?.shop.exclusive);
  const price = (
    <span className={s.productCardPrice}>
      <strong className={lc.bigPrice}>{money(product.price)}</strong>
      {colors.length > 0 && (
        <span className={s.dots}>
          {colors.map((c) => (
            <span key={c} className={s.dot} style={{ background: paint(c) }} title={c} />
          ))}
        </span>
      )}
    </span>
  );
  return (
    <Link href={productHref(product.slug, product.id)} className={[lc.card, view === 'list' && lc.list, lc.verified, s.productCard].filter(Boolean).join(' ')}>
      <span className={`${lc.media} ${s.productCardMedia}`} style={{ background: product.image ? '#EEEEEB' : exclusive ? '#0A0A0A' : store?.color || '#EEEEEB' }}>
        {product.image ? (
          <img src={product.image} alt={product.title} loading={eager ? 'eager' : 'lazy'} />
        ) : (
          <span className={s.tileBlank}>
            <img src={site.logo.light} alt="" style={{ opacity: exclusive ? 1 : 0.35 }} />
            {!exclusive && <span>{store?.mono}</span>}
          </span>
        )}
        {isNewProduct(product) && <span className={s.newTag}>NEW</span>}
        {exclusive && <span className={s.exclTag}>CLP EXCLUSIVE</span>}
      </span>
      <span className={lc.body}>
        <span className={lc.provider}>{exclusive ? 'Compete Like Pros' : (store?.name ?? '')}</span>
        <span className={lc.title}>{product.title}</span>
        <span className={s.productCardInfo}>{infoOf(product, store)}</span>
        {view === 'list' ? (
          <span className={lc.footer}>
            {price}
            <span className={lc.cta}>View Item</span>
          </span>
        ) : (
          <>
            {price}
            <span className={lc.facilityFooter}>
              <span className={`${lc.cta} ${lc.ctaWide}`}>View Item</span>
            </span>
          </>
        )}
      </span>
    </Link>
  );
}

/** Cards in the experiences' grid (four a row) or list. */
export function CardGrid({ view = 'grid', children }: { view?: ResultsView; children: ReactNode }) {
  return (
    <div key={view} className={view === 'list' ? t.listingList : t.listingGrid}>
      {children}
    </div>
  );
}

/** A section's View All button, centred under its cards. */
export function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <div className={`${s.center} ${s.viewAllRow}`}>
      <Link href={href} className={s.pillOutline}>
        {label}
      </Link>
    </div>
  );
}
