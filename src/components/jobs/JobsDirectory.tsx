'use client';
/* eslint-disable @next/next/no-img-element -- the partners' logos and CLP's mark, shown as they are. */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowUpDown, LuBriefcase, LuBuilding2, LuMapPin, LuSearch, LuShapes, LuShieldCheck, LuVolleyball } from 'react-icons/lu';
import BecomePartner from '@/components/partners/BecomePartner';
import { NO_SEARCH, fold, useSharedSearch, type Search } from '@/components/sections/DirectorySearch';
import t from '@/components/sections/TeamDirectory.module.css';
import FilterChip from '@/components/ui/FilterChip';
import { AppliedPill } from '@/components/ui/FilterPopover';
import MobileFilters from '@/components/ui/MobileFilters';
import Pager from '@/components/ui/Pager';
import PillSelect from '@/components/ui/PillSelect';
import ViewToggle, { type ResultsView } from '@/components/ui/ViewToggle';
import {
  JOB_CATEGORIES,
  JOB_TYPES,
  JOB_WORKPLACES,
  daysUntil,
  fetchJob,
  fetchJobs,
  hourlyPay,
  jobCategoryLabel,
  jobTypeLabel,
  lines,
  payShort,
  postedAgo,
  shortDate,
  startText,
  workplaceLabel,
  type Job,
} from '@/content/jobs';
import { ADMIN_URL, PARTNER_SPORTS, partnerHref } from '@/content/partnerPages';
import { site } from '@/content/site';
import c from './jobs.module.css';
import { JOB_STARTS, useJobApplication } from './useJobApplication';

const PAGE_SIZES = [12, 24, 48];
const sportLabel = (id: string) => PARTNER_SPORTS.find((s) => s.id === id)?.label ?? id;

type Filters = { sports: string[]; types: string[]; roles: string[]; workplaces: string[] };
const NO_FILTERS: Filters = { sports: [], types: [], roles: [], workplaces: [] };
const PARAMS: Record<keyof Filters, string> = { sports: 'sport', types: 'type', roles: 'role', workplaces: 'workplace' };
const VALID: Record<keyof Filters, string[]> = {
  sports: PARTNER_SPORTS.map((s) => s.id),
  types: JOB_TYPES.map((x) => x.id),
  roles: JOB_CATEGORIES.map((x) => x.id),
  workplaces: JOB_WORKPLACES.map((x) => x.id),
};

const matches = (j: Job, f: Filters, search: Search) => {
  // A role listing no sport is for any sport.
  if (f.sports.length && j.sports.length && !j.sports.some((s) => f.sports.includes(s))) return false;
  if (f.types.length && !f.types.includes(j.type)) return false;
  if (f.roles.length && !f.roles.includes(j.category)) return false;
  if (f.workplaces.length && !f.workplaces.includes(j.workplace)) return false;
  const text = fold([j.title, j.organization, j.description, jobCategoryLabel(j.category), jobTypeLabel(j.type)].join(' '));
  if (
    !fold(search.q)
      .split(/\s+/)
      .filter(Boolean)
      .every((w) => text.includes(w))
  )
    return false;
  if (!search.loc) return true;
  const where = fold(`${j.location} ${j.workplace === 'remote' ? 'remote' : ''}`);
  return where.includes(fold(search.loc));
};

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'pay', label: 'Highest Pay' },
  { value: 'closing', label: 'Closing Soon' },
] as const;
type JobSort = (typeof SORTS)[number]['value'];
const ORDER: Record<JobSort, (a: Job, b: Job) => number> = {
  newest: (a, b) => b.postedAt.localeCompare(a.postedAt),
  // The best paid (per hour, as near as each unit allows) first; those without pay last.
  pay: (a, b) => hourlyPay(b) - hourlyPay(a) || b.postedAt.localeCompare(a.postedAt),
  // Those with a deadline first, the nearest first.
  closing: (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || b.postedAt.localeCompare(a.postedAt),
};

/** A role's job type tag colours (the design's): internships gold, contracts teal, volunteering grey, the rest neutral. */
const TYPE_TAG: Record<string, string> = { internship: c.tagGold, contract: c.tagTeal, volunteer: c.tagGrey };

/** Posted in the last 3 days: NEW on its card. */
const isNew = (j: Job) => Date.now() - Date.parse(j.postedAt) < 3 * 86_400_000;
/** "Posted today", "Yesterday", "5 days ago"… */
const posted = (j: Job) => (postedAgo(j.postedAt) === 'Today' ? 'Posted today' : postedAgo(j.postedAt));
/** Its deadline in a week or less: shown in red. */
const closingSoon = (j: Job) => Boolean(j.deadline) && daysUntil(j.deadline) <= 7;
/** "Apply by Oct 24", or "Rolling" (open until filled). */
const applyBy = (j: Job) => (j.deadline ? `Apply by ${shortDate(j.deadline)}` : 'Rolling');
/** "$25–$30 / hr", "Unpaid · Volunteer" or "Pay Not Listed". */
const payLine = (j: Job) => payShort(j) || (j.type === 'volunteer' ? 'Unpaid · Volunteer' : 'Pay Not Listed');
/** "San Jose, CA (On-site)", "Remote". */
const where = (j: Job) => (j.location ? `${j.location} (${workplaceLabel(j.workplace)})` : workplaceLabel(j.workplace));
/** Its photo: its own cover, else its partner's page photo; '' for none (its colour and CLP's mark). */
const photoOf = (j: Job) => j.image || j.partner?.hero || '';

/** Job ids kept on this device (saved, applied to): read once, written on each change. */
function useStoredIds(key: string) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const v = JSON.parse(window.localStorage.getItem(key) ?? '[]');
      return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const write = (next: string[]) => {
    setIds(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode or storage full: kept for this visit only.
    }
  };
  return { ids, has: (id: string) => ids.includes(id), toggle: (id: string) => write(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]), add: (id: string) => !ids.includes(id) && write([...ids, id]) };
}

/**
 * Jobs & Internships (/jobs/, the Resources' jobs category; the Jobs Board design): the search on the heading's edge
 * (role, organization; city, or "Remote"), Sport, Job Type, Role and Workplace filters (?sport=<id> picks the sport, as
 * each sport's Resources page links here), the sort and the grid / list switch, the roles as photo cards (saved with
 * the heart, on this device), the pager, and a role opening in its panel (?job=<id>, to share). The last page ends with
 * "Hiring?" (posting as a CLP partner).
 */
export default function JobsDirectory() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Directory />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className={`${t.directory} ${t.listing}`} data-listing="">
      <div className={t.bar} />
      <div className={t.listingGrid} aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`${t.skeleton} ${c.skeleton}`} />
        ))}
      </div>
    </div>
  );
}

function Directory() {
  const params = useSearchParams();
  const shared = useSharedSearch();
  const search = shared?.search ?? NO_SEARCH;
  const [items, setItems] = useState<Job[] | null>(null);
  const [failed, setFailed] = useState('');
  const [filters, setFilters] = useState<Filters>(() => {
    const f = { ...NO_FILTERS };
    (Object.keys(PARAMS) as (keyof Filters)[]).forEach((k) => (f[k] = params.getAll(PARAMS[k]).filter((v) => VALID[k].includes(v))));
    return f;
  });
  const [open, setOpen] = useState<string | null>(null);
  const [size, setSize] = useState(PAGE_SIZES[0]);
  const [sort, setSort] = useState<JobSort>(() => (SORTS.some((o) => o.value === params.get('sort')) ? (params.get('sort') as JobSort) : 'newest'));
  const [view, setView] = useState<ResultsView>(() => (params.get('cards') === 'list' ? 'list' : 'grid'));
  const [page, setPage] = useState({ key: '', index: 0 });
  const [jobId, setJobId] = useState(() => params.get('job') ?? '');
  const saved = useStoredIds('clp-saved-jobs');
  const applied = useStoredIds('clp-applied-jobs');
  const [toast, setToast] = useState({ text: '', n: 0 });
  const top = useRef<HTMLDivElement>(null);

  const setPlaces = shared?.setPlaces;
  useEffect(() => {
    let active = true;
    fetchJobs().then(
      (jobs) => {
        if (!active) return;
        setItems(jobs);
        // The location field suggests the roles' cities, and Remote.
        const places = new Map<string, number>();
        jobs.forEach((j) => {
          if (j.location) places.set(j.location, (places.get(j.location) ?? 0) + 1);
          if (j.workplace === 'remote') places.set('Remote', (places.get('Remote') ?? 0) + 1);
        });
        setPlaces?.([...places].map(([value, count]) => ({ value, label: value, count })));
      },
      (err) => active && (setFailed(err instanceof Error ? err.message : 'Could not load the jobs.'), setItems([])),
    );
    return () => {
      active = false;
    };
  }, [setPlaces]);

  const register = shared?.register;
  const setSearch = shared?.setSearch;
  useEffect(() => register?.((next) => setSearch?.(next)), [register, setSearch]);

  // A saved / removed note, gone after a moment.
  useEffect(() => {
    if (!toast.text) return;
    const timer = window.setTimeout(() => setToast((x) => (x.n === toast.n ? { text: '', n: x.n } : x)), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /** The address keeps the filters, sort, view and open role, to share or come back to. */
  const remember = (f: Filters, s: JobSort, v: ResultsView, job: string) => {
    const url = new URL(window.location.href);
    (Object.keys(PARAMS) as (keyof Filters)[]).forEach((k) => {
      url.searchParams.delete(PARAMS[k]);
      f[k].forEach((x) => url.searchParams.append(PARAMS[k], x));
    });
    if (s === 'newest') url.searchParams.delete('sort');
    else url.searchParams.set('sort', s);
    if (v === 'list') url.searchParams.set('cards', 'list');
    else url.searchParams.delete('cards');
    if (job) url.searchParams.set('job', job);
    else url.searchParams.delete('job');
    window.history.replaceState(null, '', url);
  };
  const apply = (next: Filters) => {
    setFilters(next);
    setOpen(null);
    remember(next, sort, view, jobId);
  };
  const chooseSort = (next: JobSort) => {
    setSort(next);
    remember(filters, next, view, jobId);
  };
  const chooseView = (next: ResultsView) => {
    setView(next);
    remember(filters, sort, next, jobId);
  };
  const openJob = (id: string) => {
    setJobId(id);
    remember(filters, sort, view, id);
  };
  const toggleSaved = (j: Job) => {
    const was = saved.has(j.id);
    saved.toggle(j.id);
    setToast((x) => ({ text: was ? 'Removed from saved jobs' : 'Job saved', n: x.n + 1 }));
  };

  if (!items) return <Skeleton />;
  const shown = items.filter((j) => matches(j, filters, search)).sort(ORDER[sort]);
  const count = (f: Filters) => items.filter((j) => matches(j, f, search)).length;
  const key = JSON.stringify([filters, search, size, sort]);
  const pageCount = Math.max(1, Math.ceil(shown.length / size));
  const index = page.key === key ? Math.min(page.index, pageCount - 1) : 0;
  const pageItems = shown.slice(index * size, (index + 1) * size);
  const goTo = (n: number) => {
    setPage({ key, index: n });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const anyChosen = Object.values(filters).some((v) => v.length > 0) || Boolean(search.q || search.loc);
  const clearAll = () => {
    apply(NO_FILTERS);
    if (search.q || search.loc) setSearch?.(NO_SEARCH);
  };
  const lastPage = index === pageCount - 1;

  // Each filter's options A to Z.
  const options = (k: keyof Filters, list: { id: string; label: string }[]) =>
    list
      .map((o) => ({ value: o.id, label: o.label, count: count({ ...filters, [k]: [o.id] }) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
  type Chip = { k: keyof Filters; name: string; heading: string; plural: string; icon: React.ReactNode; options: ReturnType<typeof options> };
  const chips = (
    [
      { k: 'sports', name: 'Sport', heading: 'Sport', plural: 'sports', icon: <LuVolleyball />, options: options('sports', PARTNER_SPORTS) },
      { k: 'types', name: 'Job Type', heading: 'Job type', plural: 'types', icon: <LuBriefcase />, options: options('types', JOB_TYPES) },
      { k: 'roles', name: 'Role', heading: 'Kind of role', plural: 'roles', icon: <LuShapes />, options: options('roles', JOB_CATEGORIES) },
      { k: 'workplaces', name: 'Workplace', heading: 'Workplace', plural: 'workplaces', icon: <LuBuilding2 />, options: options('workplaces', JOB_WORKPLACES) },
    ] satisfies Chip[]
  )
    // The filters A to Z by name (as the experiences').
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = jobId ? items.find((j) => j.id === jobId) : undefined;

  return (
    <div ref={top} className={`${t.directory} ${t.listing}`} data-listing="">
      <div className={t.bar}>
        <div className={t.barRow}>
          <div className={t.filters}>
            {chips.map((ch) => (
              <FilterChip
                key={ch.k}
                name={ch.name}
                heading={ch.heading}
                icon={ch.icon}
                plural={ch.plural}
                options={ch.options}
                value={filters[ch.k]}
                open={open === ch.k}
                onOpenChange={(o) => setOpen(o ? ch.k : null)}
                resultsFor={(draft) => count({ ...filters, [ch.k]: draft })}
                onApply={(v) => apply({ ...filters, [ch.k]: v })}
              />
            ))}
            {search.q && <AppliedPill icon={<LuSearch />} label={`“${search.q}”`} onClear={() => setSearch?.({ ...search, q: '' })} />}
            {search.loc && <AppliedPill icon={<LuMapPin />} label={search.loc} onClear={() => setSearch?.({ ...search, loc: '' })} />}
            {anyChosen && (
              <button type="button" className={t.clearAll} onClick={clearAll}>
                Clear All
              </button>
            )}
          </div>
          <div className={t.mobileFilters}>
            <MobileFilters
              sections={chips.map((ch) => ({ id: ch.k, heading: ch.heading, options: ch.options, value: filters[ch.k] }))}
              applied={Object.values(filters).filter((v) => v.length > 0).length}
              sort={{ value: sort, options: SORTS }}
              countFor={(draft) =>
                count({ sports: draft.sports ?? [], types: draft.types ?? [], roles: draft.roles ?? [], workplaces: draft.workplaces ?? [] })
              }
              onApply={(draft, nextSort) => {
                apply({ sports: draft.sports ?? [], types: draft.types ?? [], roles: draft.roles ?? [], workplaces: draft.workplaces ?? [] });
                if (nextSort && nextSort !== sort) chooseSort(nextSort as JobSort);
              }}
            />
          </div>
          <div className={t.sortSlot}>
            <span className={t.sortDesktop}>
              <PillSelect value={sort} options={SORTS} onChange={chooseSort} label="Sort" icon={<LuArrowUpDown />} />
            </span>
            <ViewToggle value={view} onChange={chooseView} />
          </div>
        </div>
      </div>

      <div className={c.results}>
        {failed ? (
          <div className={t.listingEmpty} role="alert">
            {failed}
          </div>
        ) : shown.length === 0 && items.length > 0 ? (
          <div className={t.listingEmpty} role="status">
            No jobs match these filters.{' '}
            <button type="button" className={t.listingClear} onClick={clearAll}>
              Clear All
            </button>
          </div>
        ) : (
          <div key={view} className={view === 'list' ? c.list : t.listingGrid}>
            {pageItems.map((j) => (
              <JobCard key={j.id} job={j} view={view} saved={saved.has(j.id)} onSave={() => toggleSaved(j)} onOpen={() => openJob(j.id)} />
            ))}
            {lastPage && <Hiring empty={items.length === 0} />}
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

      {jobId && (
        <JobPanel
          id={jobId}
          job={selected}
          saved={saved.has(jobId)}
          applied={applied.has(jobId)}
          onSave={(j) => toggleSaved(j)}
          onApplied={(j) => applied.add(j.id)}
          onClose={() => openJob('')}
        />
      )}
      {toast.text && (
        <div className={c.toast} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

/**
 * The small box on a role's photo (as the partners' cards): its own small card image, else its partner's logo, else its
 * photo; without any, the partner's initials on their colour, CLP's mark, or the organization's initials.
 */
function OrgMark({ job, size }: { job: Job; size: number }) {
  const p = job.partner;
  const initials =
    job.organization
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join('') || '··';
  return (
    <span className={c.mark} style={{ width: size, height: size, flexBasis: size, background: p?.color ?? (job.clp ? '#0a0a0a' : '#5b5a56') }}>
      {job.logo || p?.logo || photoOf(job) ? <img src={job.logo || p?.logo || photoOf(job)} alt="" /> : (p?.mono ?? (job.clp ? 'CLP' : initials))}
    </span>
  );
}

/** "✓ CLP Partner" (a partner with a live page), "✓ CLP" (CLP's own); nothing for others. */
const badgeOf = (j: Job) => (j.partner ? 'CLP Partner' : j.clp ? 'CLP' : '');

/** The heart: saves the role on this device. */
function SaveHeart({ job, saved, onSave }: { job: Job; saved: boolean; onSave: () => void }) {
  return (
    <button
      type="button"
      className={`${c.heart} ${saved ? c.heartOn : ''}`}
      aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
      aria-pressed={saved}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        onSave();
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M12 20.5 4.2 12.9A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 7.8 6.3z" />
      </svg>
    </button>
  );
}

/** A role's photo (its cover, its partner's page photo, else its colour with CLP's mark), NEW and Youth Role, the heart. */
function JobPhoto({ job: j, saved, onSave, children }: { job: Job; saved: boolean; onSave: () => void; children?: React.ReactNode }) {
  const photo = photoOf(j);
  return (
    <span className={c.photo} style={photo ? { backgroundImage: `url("${photo}")` } : { background: j.partner?.color ?? (j.clp ? '#0a0a0a' : '#333') }}>
      {!photo && <img className={c.photoMark} src={site.logo.light} alt="" />}
      <span className={c.badges}>
        {isNew(j) && <span className={c.newTag}>NEW</span>}
        {j.backgroundCheck && (
          <span className={c.youthTag}>
            <LuShieldCheck aria-hidden /> Youth Role
          </span>
        )}
      </span>
      <SaveHeart job={j} saved={saved} onSave={onSave} />
      {children}
    </span>
  );
}

/** A role's type and sports tags. */
function Tags({ job: j }: { job: Job }) {
  return (
    <span className={c.tags}>
      <span className={`${c.tag} ${TYPE_TAG[j.type] ?? ''}`}>{jobTypeLabel(j.type)}</span>
      {j.sports.slice(0, 2).map((s) => (
        <span key={s} className={c.tag}>
          {sportLabel(s)}
        </span>
      ))}
      {j.sports.length > 2 && <span className={c.tag}>+{j.sports.length - 2}</span>}
    </span>
  );
}

/**
 * A role's card (the Jobs Board design): its photo with the small box on its bottom edge (as the partners' cards), who
 * posted it and how they're verified,
 * the kind of role, the title, its tags, where and the pay, then when it was posted, its deadline and View Job; in the
 * list view a row (photo, the role, then the pay, dates, View Job and Save).
 */
function JobCard({ job: j, view, saved, onSave, onOpen }: { job: Job; view: ResultsView; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const badge = badgeOf(j);
  const paid = Boolean(payShort(j));
  const deadline = <span className={closingSoon(j) ? c.deadlineSoon : c.deadline}>{applyBy(j)}</span>;
  const viewJob = (
    <button
      type="button"
      className={c.viewJob}
      aria-haspopup="dialog"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      View Job{' '}
      <span className="glyph" aria-hidden>
        →
      </span>
    </button>
  );
  if (view === 'list')
    return (
      <article className={c.row} onClick={onOpen}>
        <JobPhoto job={j} saved={saved} onSave={onSave}>
          <span className={c.rowMark}>
            <OrgMark job={j} size={64} />
          </span>
        </JobPhoto>
        <span className={c.rowBody}>
          <span className={c.rowOrg}>
            <strong>{j.organization}</strong>
            {badge && <span className={c.badge}>✓ {badge}</span>}
          </span>
          <span className={c.kind}>{jobCategoryLabel(j.category)}</span>
          <span className={`${c.title} ${c.rowTitle}`}>{j.title}</span>
          <Tags job={j} />
          <span className={c.fact}>
            <LuMapPin aria-hidden /> {where(j)}
          </span>
        </span>
        <span className={c.rowSide}>
          <span className={c.rowDates}>
            <strong className={paid ? c.rowPay : c.rowPayNone}>{payLine(j)}</strong>
            <span className={c.posted}>{posted(j)}</span>
            {deadline}
          </span>
          <span className={c.rowActions}>
            {viewJob}
            <button
              type="button"
              className={c.saveBtn}
              aria-pressed={saved}
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          </span>
        </span>
      </article>
    );
  return (
    <article className={c.card} onClick={onOpen}>
      <JobPhoto job={j} saved={saved} onSave={onSave}>
        <span className={c.cardMark}>
          <OrgMark job={j} size={64} />
        </span>
      </JobPhoto>
      <span className={c.cardBody}>
        <span className={c.rowOrg}>
          <strong>{j.organization}</strong>
          {badge && <span className={c.badge}>✓ {badge}</span>}
        </span>
        <span className={c.kind}>{jobCategoryLabel(j.category)}</span>
        <span className={c.title}>{j.title}</span>
        <Tags job={j} />
        <span className={c.facts}>
          <span className={c.fact}>
            <LuMapPin aria-hidden /> {where(j)}
          </span>
          <span className={`${c.fact} ${paid ? c.pay : c.payNone}`}>
            <span className={c.dollar} aria-hidden>
              $
            </span>
            {payLine(j)}
          </span>
        </span>
      </span>
      <span className={c.cardFoot}>
        <span className={c.dates}>
          <span className={c.posted}>{posted(j)}</span>
          {deadline}
        </span>
        {viewJob}
      </span>
    </article>
  );
}

/** "Hiring?": how roles get here (a CLP partner posts them from their dashboard). */
function Hiring({ empty }: { empty: boolean }) {
  return (
    <div className={c.join}>
      <span className={c.joinKicker}>{empty ? 'No open roles right now' : 'Hiring?'}</span>
      <span className={c.joinTitle}>
        Post Your
        <br />
        Jobs on CLP
      </span>
      <span className={c.joinLine}>CLP partners post coaching, event, media and internship roles from their dashboard. CLP reviews each one.</span>
      <BecomePartner className={c.joinCta}>
        Become a Partner{' '}
        <span className="glyph" aria-hidden>
          →
        </span>
      </BecomePartner>
      <a className={c.joinLink} href={`${ADMIN_URL}/jobs/new/`} target="_blank" rel="noopener">
        Already a partner? Post a job ↗
      </a>
    </div>
  );
}

/**
 * A role in full, in its panel (its own address, ?job=<id>): its photo, who posted it, the kind of role and title, its
 * facts (pay, type, workplace, location, start, deadline), the youth note, about it, what you'll do and what you need,
 * then Save and Apply: a partner's with "Apply with CLP" (the application form), CLP's own by its link or e-mail.
 */
function JobPanel({
  id,
  job: listed,
  saved,
  applied,
  onSave,
  onApplied,
  onClose,
}: {
  id: string;
  job?: Job;
  saved: boolean;
  applied: boolean;
  onSave: (job: Job) => void;
  onApplied: (job: Job) => void;
  onClose: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const [fetched, setFetched] = useState<{ id: string; job: Job | null; error: string } | null>(null);
  const job = listed ?? (fetched?.id === id ? fetched.job : null);
  const error = !listed && fetched?.id === id ? fetched.error : '';
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // A shared link to a role not in the list (closed since, or past its deadline): asked for on its own.
  useEffect(() => {
    if (listed) return;
    let active = true;
    fetchJob(id).then(
      (j) => active && setFetched({ id, job: j, error: '' }),
      () => active && setFetched({ id, job: null, error: 'This job isn’t open anymore.' }),
    );
    return () => {
      active = false;
    };
  }, [id, listed]);

  useEffect(() => {
    document.body.classList.add('menu-open');
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const closeButton = (
    <button type="button" className={c.close} aria-label="Close" onClick={onClose}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
  const facts = job
    ? [
        { k: 'Pay', v: payShort(job) || (job.type === 'volunteer' ? 'Unpaid' : 'Not listed'), tone: payShort(job) ? c.factPay : '' },
        { k: 'Type', v: jobTypeLabel(job.type), tone: '' },
        { k: 'Workplace', v: workplaceLabel(job.workplace), tone: '' },
        { k: 'Location', v: job.location || workplaceLabel(job.workplace), tone: '' },
        { k: 'Starts', v: startText(job), tone: '' },
        { k: 'Apply By', v: job.deadline ? shortDate(job.deadline) : 'Rolling', tone: closingSoon(job) ? c.factSoon : '' },
      ]
    : [];
  const dos = job ? lines(job.duties) : [];
  const needs = job ? lines(job.requirements) : [];
  const mailto = job?.applyEmail ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}` : '';
  const photo = job ? photoOf(job) : '';
  return createPortal(
    <div className={c.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={c.panel} role="dialog" aria-modal="true" aria-label={job?.title ?? 'Job'} tabIndex={-1}>
        {!job ? (
          <div className={c.panelBody}>
            {closeButton}
            <p className={c.dialogNote}>{error || 'Loading…'}</p>
          </div>
        ) : applying && !job.clp ? (
          <>
            {closeButton}
            <ApplyWithClp job={job} onBack={() => setApplying(false)} onClose={onClose} onSent={() => onApplied(job)} />
          </>
        ) : (
          <>
            <div className={c.panelPhoto} style={photo ? { backgroundImage: `url("${photo}")` } : { background: job.partner?.color ?? (job.clp ? '#0a0a0a' : '#333') }}>
              {!photo && <img className={c.photoMark} src={site.logo.light} alt="" />}
              {closeButton}
            </div>
            <div className={c.panelBody}>
              <div className={c.panelHead}>
                <OrgMark job={job} size={84} />
                <span className={c.org}>
                  {job.partner ? (
                    <Link className={c.panelOrg} href={partnerHref(job.partner.slug)}>
                      {job.organization}
                    </Link>
                  ) : (
                    <strong className={c.panelOrg}>{job.organization}</strong>
                  )}
                  {badgeOf(job) && <span className={c.badge}>✓ {badgeOf(job)}</span>}
                </span>
              </div>
              <span className={c.panelTitleGroup}>
                <span className={c.kind}>{jobCategoryLabel(job.category)}</span>
                <h2 className={c.panelTitle}>{job.title}</h2>
              </span>
              <div className={c.factGrid}>
                {facts.map((f) => (
                  <span key={f.k} className={c.factCell}>
                    <span className={c.factKey}>{f.k}</span>
                    <strong className={f.tone}>{f.v}</strong>
                  </span>
                ))}
              </div>
              {job.sports.length > 0 && (
                <span className={c.tags}>
                  {job.sports.map((s) => (
                    <span key={s} className={c.tag}>
                      {sportLabel(s)}
                    </span>
                  ))}
                </span>
              )}
              {job.backgroundCheck && (
                <div className={c.youthNote}>
                  <strong>Works with players under 18.</strong> Needs a background check, SafeSport and CPR before you start.
                </div>
              )}
              <p className={c.about}>{job.description}</p>
              {(dos.length > 0 || needs.length > 0) && (
                <div className={c.lists}>
                  {dos.length > 0 && (
                    <div className={c.listCol}>
                      <strong>What You’ll Do</strong>
                      <ul>
                        {dos.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {needs.length > 0 && (
                    <div className={c.listCol}>
                      <strong>What You Need</strong>
                      <ul>
                        {needs.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className={c.panelActions}>
                <button type="button" className={c.panelSave} aria-pressed={saved} onClick={() => onSave(job)}>
                  {saved ? '♥ Saved' : '♡ Save Job'}
                </button>
                {!job.clp ? (
                  applied ? (
                    <span className={c.appliedTag}>✓ Applied</span>
                  ) : (
                    <button type="button" className={c.panelApply} onClick={() => setApplying(true)}>
                      Apply with CLP
                    </button>
                  )
                ) : job.applyUrl ? (
                  <a className={c.panelApply} href={job.applyUrl} target="_blank" rel="noopener">
                    Apply Now ↗
                  </a>
                ) : (
                  mailto && (
                    <a className={c.panelApply} href={mailto}>
                      Apply by Email
                    </a>
                  )
                )}
              </div>
              <span className={c.panelNote}>
                {!job.clp ? (
                  `Applies through CLP. ${job.organization} sees your name, contact and answers, and replies in your CLP Messages.`
                ) : job.applyUrl && mailto ? (
                  <>
                    Or email your application to <a href={mailto}>{job.applyEmail}</a>.
                  </>
                ) : job.applyUrl ? (
                  'Opens the application in a new tab.'
                ) : (
                  `Opens an email to ${job.applyEmail}.`
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** "Apply with CLP" on a partner's role: the application (a conversation with them on CLP Messages), then "sent". */
function ApplyWithClp({ job, onBack, onClose, onSent }: { job: Job; onBack: () => void; onClose: () => void; onSent: () => void }) {
  const app = useJobApplication(job, job.organization);
  const { form, set } = app;
  // Sent (or sent before): this device shows the role as applied to.
  const sent = Boolean(app.sent);
  const sentRef = useRef(onSent);
  useEffect(() => {
    sentRef.current = onSent;
  });
  useEffect(() => {
    if (sent) sentRef.current();
  }, [sent]);
  if (app.sent)
    return (
      <div className={`${c.dialogBody} ${c.applyDone}`}>
        <span className={c.applyMark}>✓</span>
        <h2 className={c.dialogTitle}>{app.sent.already ? 'You already applied' : 'Application sent'}</h2>
        <p className={c.dialogNote}>
          {app.sent.already
            ? `Your application for ${job.title} is with ${job.organization}. Their reply comes to your conversation in CLP Messages.`
            : `${job.organization} usually replies within a few days. The conversation lives in your CLP Messages.`}
        </p>
        <Link className={c.apply} href={app.sent.path}>
          Open the conversation
        </Link>
        <button type="button" className={c.applySecondary} onClick={onClose}>
          Back to jobs
        </button>
      </div>
    );
  return (
    <form className={c.applyForm} onSubmit={app.submit} noValidate>
      <div className={c.dialogBody}>
        <span className={c.kind}>Apply with CLP</span>
        <h2 className={c.dialogTitle}>{job.title}</h2>
        <div className={c.applyContact}>
          <label className={c.applyField}>
            Your name
            <input type="text" autoComplete="name" maxLength={80} value={form.name} onChange={set('name')} />
          </label>
          <label className={c.applyField}>
            Your e-mail
            <input type="email" autoComplete="email" maxLength={200} value={form.email} onChange={set('email')} />
          </label>
          <label className={c.applyField}>
            <span>
              Your phone <span className={c.optional}>(optional)</span>
            </span>
            <input type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={set('phone')} />
          </label>
        </div>
        <label className={c.applyField}>
          <span>
            Resume or portfolio link <span className={c.optional}>(optional)</span>
          </span>
          <input type="url" inputMode="url" placeholder="https://" maxLength={500} value={form.link} onChange={set('link')} />
        </label>
        <label className={c.applyField}>
          Why {job.organization}?
          <textarea rows={4} maxLength={1900} placeholder="A few lines about you and why this role" value={form.note} onChange={set('note')} />
        </label>
        <label className={c.applyField}>
          When can you start?
          <select value={form.start} onChange={set('start')}>
            {JOB_STARTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {/* A field people don't see: filled in, the request is a bot's. */}
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className={c.trap} value={form.website} onChange={set('website')} />
        <span className={c.applyNote}>{job.organization} sees your name, contact and answers. They’ll reply in your CLP Messages.</span>
        {app.error && <span className={c.applyError}>{app.error}</span>}
      </div>
      <div className={c.dialogFoot}>
        <button type="button" className={c.applySecondary} onClick={onBack}>
          Back
        </button>
        <button type="submit" className={c.apply} disabled={app.busy}>
          {app.busy ? 'Sending…' : 'Send application'}
        </button>
      </div>
    </form>
  );
}
