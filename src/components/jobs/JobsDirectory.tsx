'use client';
/* eslint-disable @next/next/no-img-element -- the partners' logos and CLP's mark, shown as they are. */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowUpDown, LuBriefcase, LuBuilding2, LuHeart, LuMapPin, LuSearch, LuShapes, LuShieldCheck, LuVolleyball } from 'react-icons/lu';
import BecomePartner from '@/components/partners/BecomePartner';
import BioModal from '@/components/sections/BioModal';
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
import { ADMIN_URL, PARTNER_SPORTS, fetchPartnerPage, partnerHref } from '@/content/partnerPages';
import { site } from '@/content/site';
import type { FacilityCard } from '@/content/types';
import c from './jobs.module.css';
import ResumeField from './ResumeField';
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
  // From the latest list (an Undo in the toast runs after other saves).
  const write = (change: (prev: string[]) => string[]) =>
    setIds((prev) => {
      const next = change(prev);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Private mode or storage full: kept for this visit only.
      }
      return next;
    });
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => write((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    add: (id: string) => write((prev) => (prev.includes(id) ? prev : [...prev, id])),
    drop: (gone: string[]) => write((prev) => prev.filter((x) => !gone.includes(x))),
  };
}

/**
 * Jobs & Internships (/jobs/, the Resources' jobs category; the Jobs Board design): the search on the heading's edge
 * (role, organization; city, or "Remote"), Sport, Job Type, Role and Workplace filters (?sport=<id> picks the sport, as
 * each sport's Resources page links here), the sort and the grid / list switch, the roles as photo cards (saved with
 * the heart, on this device), the pager, and a role opening in its panel (?job=<id>, to share). The last page ends with
 * "Hiring?" (posting as a CLP partner). Saved (the heart's count, beside the sort) shows the saved roles alone
 * (?saved=1), as a food app's favourites: the same cards, each opening its role.
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
  // The partner whose Learn More is open (a click on their role's card).
  const [about, setAbout] = useState('');
  const saved = useStoredIds('clp-saved-jobs');
  const applied = useStoredIds('clp-applied-jobs');
  // Only the saved roles (Saved, ?saved=1).
  const [savedOnly, setSavedOnly] = useState(() => params.get('saved') === '1');
  const [toast, setToast] = useState<{ text: string; n: number; action?: { label: string; run: () => void } }>({ text: '', n: 0 });
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
  useEffect(
    () =>
      register?.((next) => {
        setSearch?.(next);
        // A search is across all the roles: back from Saved.
        setSavedOnly(false);
        const url = new URL(window.location.href);
        url.searchParams.delete('saved');
        window.history.replaceState(null, '', url);
      }),
    [register, setSearch],
  );

  // A saved / removed note, gone after a moment (a little longer with its button).
  useEffect(() => {
    if (!toast.text) return;
    const timer = window.setTimeout(() => setToast((x) => (x.n === toast.n ? { text: '', n: x.n } : x)), toast.action ? 4000 : 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /** The address keeps the filters, sort, view, open role and Saved, to share or come back to. */
  const remember = (f: Filters, s: JobSort, v: ResultsView, job: string, only = savedOnly) => {
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
    if (only) url.searchParams.set('saved', '1');
    else url.searchParams.delete('saved');
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
  /** Saved on (the saved roles alone, from the top) or off (the board); an open role closes. */
  const showSaved = (on: boolean) => {
    setSavedOnly(on);
    setOpen(null);
    setJobId('');
    setToast((x) => ({ text: '', n: x.n }));
    remember(filters, sort, view, '', on);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleSaved = (j: Job) => {
    const was = saved.has(j.id);
    saved.toggle(j.id);
    setToast((x) => ({
      text: was ? 'Removed from saved jobs' : 'Job saved',
      n: x.n + 1,
      // A removal can be undone. A save, on the board, links to Saved.
      action: was ? { label: 'Undo', run: () => saved.add(j.id) } : savedOnly ? undefined : { label: 'View Saved', run: () => showSaved(true) },
    }));
  };

  if (!items) return <Skeleton />;
  const savedJobs = items.filter((j) => saved.has(j.id));
  // Saved roles no longer on the board (filled, or past their deadline).
  const closed = failed ? [] : saved.ids.filter((id) => !items.some((j) => j.id === id));
  const shown = (savedOnly ? savedJobs : items.filter((j) => matches(j, filters, search))).sort(ORDER[sort]);
  const count = (f: Filters) => items.filter((j) => matches(j, f, search)).length;
  const key = JSON.stringify([filters, search, size, sort, savedOnly]);
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
          {savedOnly ? (
            <div className={c.savedHead}>
              <button type="button" className={c.savedBack} onClick={() => showSaved(false)}>
                <span className="glyph" aria-hidden>
                  ←
                </span>{' '}
                All Jobs
              </button>
              <span className={c.savedTitle}>
                <h2>Saved Jobs</h2>
                <span>Kept on This Device</span>
              </span>
            </div>
          ) : (
            <>
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
            </>
          )}
          <div className={t.sortSlot}>
            {!savedOnly && (
              <button
                type="button"
                className={`${c.savedBtn} ${savedJobs.length ? c.savedBtnOn : ''}`}
                aria-label={`Saved jobs, ${savedJobs.length}`}
                onClick={() => showSaved(true)}
              >
                <LuHeart aria-hidden />
                <span className={c.savedLabel}>Saved</span>
                {savedJobs.length > 0 && (
                  // Keyed by the count: it pops on each save.
                  <span key={savedJobs.length} className={c.savedCount}>
                    {savedJobs.length}
                  </span>
                )}
              </button>
            )}
            <span className={t.sortDesktop}>
              <PillSelect value={sort} options={SORTS} onChange={chooseSort} label="Sort" icon={<LuArrowUpDown />} />
            </span>
            <ViewToggle value={view} onChange={chooseView} />
          </div>
        </div>
      </div>

      <div className={c.results}>
        {savedOnly && closed.length > 0 && (
          <div className={c.savedClosed} role="status">
            {closed.length === 1 ? 'A job you saved is no longer open.' : `${closed.length} jobs you saved are no longer open.`}
            <button type="button" className={t.listingClear} onClick={() => saved.drop(closed)}>
              Remove {closed.length === 1 ? 'It' : 'Them'}
            </button>
          </div>
        )}
        {failed ? (
          <div className={t.listingEmpty} role="alert">
            {failed}
          </div>
        ) : savedOnly && shown.length === 0 ? (
          <div className={c.savedEmpty} role="status">
            <span className={c.savedEmptyHeart} aria-hidden>
              <LuHeart />
            </span>
            <strong>No Saved Jobs Yet</strong>
            <span>Tap the heart on any job to keep it here, then come back to apply.</span>
            <button type="button" className={c.panelApply} onClick={() => showSaved(false)}>
              Browse Jobs
            </button>
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
              <JobCard
                key={j.id}
                job={j}
                view={view}
                saved={saved.has(j.id)}
                onSave={() => toggleSaved(j)}
                onOpen={() => openJob(j.id)}
                // A partner's role: who they are (their Learn More); CLP's own: the role itself.
                onCard={() => (j.partner ? setAbout(j.partner.slug) : openJob(j.id))}
              />
            ))}
            {lastPage && !savedOnly && <Hiring empty={items.length === 0} />}
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
      {about && <PartnerAbout slug={about} onClose={() => setAbout('')} onError={(text) => setToast((x) => ({ text, n: x.n + 1 }))} />}
      {toast.text && (
        <div className={c.toast} role="status">
          {toast.text}
          {toast.action && (
            <button
              type="button"
              className={c.toastAction}
              onClick={() => {
                toast.action?.run();
                setToast((x) => ({ text: '', n: x.n }));
              }}
            >
              {toast.action.label}
            </button>
          )}
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
 * A role's card (the Jobs Board design): its photo, the poster's logo half over its bottom edge with their name and how
 * they're verified beside it, the kind of role, the title, its tags, where and the pay, then when it was posted, its
 * deadline and View Job; in the list view a row (photo, the role, then the pay, dates, View Job and Save). View Job opens
 * the role; the rest of the card who posted it (a partner's Learn More, as the experiences').
 */
function JobCard({
  job: j,
  view,
  saved,
  onSave,
  onOpen,
  onCard,
}: {
  job: Job;
  view: ResultsView;
  saved: boolean;
  /** The heart; View Job (the role's popup); the rest of the card (its partner's Learn More). */
  onSave: () => void;
  onOpen: () => void;
  onCard: () => void;
}) {
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
      <article className={c.row} onClick={onCard}>
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
    <article className={c.card} onClick={onCard}>
      <JobPhoto job={j} saved={saved} onSave={onSave} />
      {/* The poster's logo half over the photo's edge, their name and how they're verified beside it (the design's). */}
      <span className={c.cardHead}>
        <OrgMark job={j} size={64} />
        <span className={c.cardOrg}>
          <strong>{j.organization}</strong>
          {badge && <span className={c.badge}>✓ {badge}</span>}
        </span>
      </span>
      <span className={c.cardBody}>
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

/**
 * Who a partner is (a click on their role's card): their Learn More, the experiences' full-screen popup, from their
 * live page: their name, kind and area, about, photos and socials, with their profile to open.
 */
function PartnerAbout({ slug, onClose, onError }: { slug: string; onClose: () => void; onError: (text: string) => void }) {
  const [card, setCard] = useState<FacilityCard | null>(null);
  const done = useRef({ onClose, onError });
  useEffect(() => {
    done.current = { onClose, onError };
  });
  useEffect(() => {
    let active = true;
    const escape = (text: string) => text.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
    fetchPartnerPage(slug).then(
      ({ page: p }) =>
        active &&
        setCard({
          image: p.logo || p.hero,
          subtitle: [p.category, p.area].filter(Boolean).join(' · '),
          title: p.name,
          excerpt: '',
          bio: '',
          // The popup shows its buttons with a rich-text bio: their about, as paragraphs.
          bioHtml: (p.about || `${p.name} is a CLP Partner.`)
            .split(/\n{2,}/)
            .map((para) => `<p>${escape(para)}</p>`)
            .join(''),
          bioImages: [p.hero, ...p.photos.map((x) => x.src)].filter(Boolean).slice(0, 8),
          socials: p.socials,
          buttons: [{ label: 'View Profile', href: partnerHref(p.slug) }],
        }),
      () => {
        if (!active) return;
        done.current.onError('Could not load this partner. Please try again.');
        done.current.onClose();
      },
    );
    return () => {
      active = false;
    };
  }, [slug]);
  return card ? (
    <BioModal card={card} variant="wps" onClose={onClose} />
  ) : (
    <div className={c.toast} role="status">
      Loading…
    </div>
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
        <button type="button" className={c.apply} onClick={onClose}>
          Back to Jobs
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
        <ResumeField file={app.resume} onChoose={app.chooseResume} onRemove={app.removeResume} disabled={Boolean(app.busy)} />
        <label className={c.applyField}>
          <span>
            Portfolio or LinkedIn link <span className={c.optional}>(optional)</span>
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
        <button type="submit" className={c.apply} disabled={Boolean(app.busy)}>
          {app.busy === 'uploading' ? 'Uploading Resume…' : app.busy ? 'Sending…' : 'Send Application'}
        </button>
      </div>
    </form>
  );
}
