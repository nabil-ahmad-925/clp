'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LuArrowUpDown,
  LuBadgeCheck,
  LuBriefcase,
  LuBuilding2,
  LuCalendar,
  LuDollarSign,
  LuMapPin,
  LuSearch,
  LuShapes,
  LuShieldCheck,
  LuVolleyball,
} from 'react-icons/lu';
import BecomePartner from '@/components/partners/BecomePartner';
import { NO_SEARCH, fold, useSharedSearch, type Search } from '@/components/sections/DirectorySearch';
import t from '@/components/sections/TeamDirectory.module.css';
import FilterChip from '@/components/ui/FilterChip';
import { AppliedPill } from '@/components/ui/FilterPopover';
import MobileFilters from '@/components/ui/MobileFilters';
import Pager from '@/components/ui/Pager';
import PillSelect from '@/components/ui/PillSelect';
import {
  JOB_CATEGORIES,
  JOB_TYPES,
  JOB_WORKPLACES,
  fetchJob,
  fetchJobs,
  jobCategoryLabel,
  jobDate,
  jobTypeLabel,
  payText,
  placeText,
  postedAgo,
  type Job,
} from '@/content/jobs';
import { ADMIN_URL, PARTNER_SPORTS, partnerHref } from '@/content/partnerPages';
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
  { value: 'closing', label: 'Closing soon' },
  { value: 'az', label: 'Title: A to Z' },
] as const;
type JobSort = (typeof SORTS)[number]['value'];
const ORDER: Record<JobSort, (a: Job, b: Job) => number> = {
  newest: (a, b) => b.postedAt.localeCompare(a.postedAt),
  // Those with a deadline first, the nearest first.
  closing: (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || b.postedAt.localeCompare(a.postedAt),
  az: (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
};

/**
 * Jobs & Internships (/jobs/, the Resources' jobs category; the listing pages' design): the search on the heading's edge
 * (role, organization; city, or "Remote"), Sport, Job type, Kind of role and Workplace filters (?sport=<id> picks the
 * sport, as each sport's Resources page links here), the roles as cards, the pager, and a role opening in a popup
 * (?job=<id>, to share). The last page ends with "Hiring?" (posting as a CLP partner).
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
  const [page, setPage] = useState({ key: '', index: 0 });
  const [jobId, setJobId] = useState(() => params.get('job') ?? '');
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

  /** The address keeps the filters, sort and open role, to share or come back to. */
  const remember = (f: Filters, s: JobSort, job: string) => {
    const url = new URL(window.location.href);
    (Object.keys(PARAMS) as (keyof Filters)[]).forEach((k) => {
      url.searchParams.delete(PARAMS[k]);
      f[k].forEach((v) => url.searchParams.append(PARAMS[k], v));
    });
    if (s === 'newest') url.searchParams.delete('sort');
    else url.searchParams.set('sort', s);
    if (job) url.searchParams.set('job', job);
    else url.searchParams.delete('job');
    window.history.replaceState(null, '', url);
  };
  const apply = (next: Filters) => {
    setFilters(next);
    setOpen(null);
    remember(next, sort, jobId);
  };
  const chooseSort = (next: JobSort) => {
    setSort(next);
    remember(filters, next, jobId);
  };
  const openJob = (id: string) => {
    setJobId(id);
    remember(filters, sort, id);
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

  const options = (k: keyof Filters, list: { id: string; label: string }[]) =>
    list.map((o) => ({ value: o.id, label: o.label, count: count({ ...filters, [k]: [o.id] }) }));
  const chips: { k: keyof Filters; name: string; heading: string; plural: string; icon: React.ReactNode; options: ReturnType<typeof options> }[] = [
    { k: 'sports', name: 'Sport', heading: 'Sport', plural: 'sports', icon: <LuVolleyball />, options: options('sports', PARTNER_SPORTS) },
    { k: 'types', name: 'Job Type', heading: 'Job type', plural: 'types', icon: <LuBriefcase />, options: options('types', JOB_TYPES) },
    { k: 'roles', name: 'Role', heading: 'Kind of role', plural: 'roles', icon: <LuShapes />, options: options('roles', JOB_CATEGORIES) },
    { k: 'workplaces', name: 'Workplace', heading: 'Workplace', plural: 'workplaces', icon: <LuBuilding2 />, options: options('workplaces', JOB_WORKPLACES) },
  ];
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
          <div className={t.sortSlot}>
            <span className={t.sortDesktop}>
              <PillSelect value={sort} options={SORTS} onChange={chooseSort} label="Sort jobs" icon={<LuArrowUpDown />} />
            </span>
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
          <div className={t.listingGrid}>
            {pageItems.map((j) => (
              <JobCard key={j.id} job={j} onOpen={() => openJob(j.id)} />
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

      {jobId && <JobDialog id={jobId} job={selected} onClose={() => openJob('')} />}
    </div>
  );
}

/** Who posted it: the partner's logo (or initials) on their colour, CLP's mark, or the organization's initials. */
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
      {p?.logo ? <Image src={p.logo} alt="" width={size} height={size} /> : (p?.mono ?? (job.clp ? 'CLP' : initials))}
    </span>
  );
}

/** A role's card (the listing card's frame, text only): who's hiring, the role, its facts and when it was posted. */
function JobCard({ job: j, onOpen }: { job: Job; onOpen: () => void }) {
  const pay = payText(j);
  return (
    <button type="button" className={c.card} onClick={onOpen} aria-haspopup="dialog">
      <span className={c.cardTop}>
        <OrgMark job={j} size={48} />
        <span className={c.org}>
          <span className={c.orgName}>{j.organization}</span>
          {(j.partner || j.clp) && (
            <span className={c.verified}>
              <LuBadgeCheck aria-hidden /> {j.clp ? 'CLP' : 'CLP Partner'}
            </span>
          )}
        </span>
      </span>
      <span className={c.kind}>{jobCategoryLabel(j.category)}</span>
      <span className={c.title}>{j.title}</span>
      <span className={c.tags}>
        <span className={`${c.tag} ${j.type === 'internship' ? c.tagGold : ''}`}>{jobTypeLabel(j.type)}</span>
        {j.sports.slice(0, 2).map((s) => (
          <span key={s} className={c.tag}>
            {sportLabel(s)}
          </span>
        ))}
        {j.sports.length > 2 && <span className={c.tag}>+{j.sports.length - 2}</span>}
      </span>
      <span className={c.facts}>
        <span className={c.fact}>
          <LuMapPin aria-hidden /> {placeText(j)}
        </span>
        {pay && (
          <span className={c.fact}>
            <LuDollarSign aria-hidden /> {pay}
          </span>
        )}
      </span>
      <span className={c.footer}>
        <span className={c.posted}>{postedAgo(j.postedAt)}</span>
        {j.deadline ? <span className={c.deadline}>Apply by {jobDate(j.deadline)}</span> : null}
        <span className={c.cta}>
          View Job{' '}
          <span className="glyph" aria-hidden>
            →
          </span>
        </span>
      </span>
    </button>
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
 * A role in full (its own address, ?job=<id>): who, where, pay, what it is, requirements and how to apply: a partner's
 * with "Apply with CLP" (the application form), CLP's own by its link or e-mail.
 */
function JobDialog({ id, job: listed, onClose }: { id: string; job?: Job; onClose: () => void }) {
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

  const pay = job ? payText(job) : '';
  const mailto = job?.applyEmail ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}` : '';
  return createPortal(
    <div className={c.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={c.dialog} role="dialog" aria-modal="true" aria-label={job?.title ?? 'Job'} tabIndex={-1}>
        <button type="button" className={c.close} aria-label="Close" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {!job ? (
          <div className={c.dialogBody}>
            <p className={c.dialogNote}>{error || 'Loading…'}</p>
          </div>
        ) : applying && !job.clp ? (
          <ApplyWithClp job={job} onBack={() => setApplying(false)} onClose={onClose} />
        ) : (
          <>
            <div className={c.dialogBody}>
              <div className={c.dialogHead}>
                <OrgMark job={job} size={64} />
                <span className={c.org}>
                  <span className={c.orgName}>{job.organization}</span>
                  {job.partner ? (
                    <Link className={c.orgLink} href={partnerHref(job.partner.slug)}>
                      <LuBadgeCheck aria-hidden /> CLP Partner · View page
                    </Link>
                  ) : job.clp ? (
                    <span className={c.verified}>
                      <LuBadgeCheck aria-hidden /> Compete Like Pros
                    </span>
                  ) : null}
                </span>
              </div>
              <span className={c.kind}>{jobCategoryLabel(job.category)}</span>
              <h2 className={c.dialogTitle}>{job.title}</h2>
              <div className={c.facts4}>
                <span className={c.factBox}>
                  <LuMapPin aria-hidden />
                  <span>
                    <strong>Where</strong>
                    {placeText(job)}
                  </span>
                </span>
                <span className={c.factBox}>
                  <LuBriefcase aria-hidden />
                  <span>
                    <strong>Type</strong>
                    {jobTypeLabel(job.type)}
                  </span>
                </span>
                <span className={c.factBox}>
                  <LuDollarSign aria-hidden />
                  <span>
                    <strong>Pay</strong>
                    {pay || 'Not listed'}
                  </span>
                </span>
                <span className={c.factBox}>
                  <LuCalendar aria-hidden />
                  <span>
                    <strong>Apply by</strong>
                    {job.deadline ? jobDate(job.deadline) : 'Open until filled'}
                  </span>
                </span>
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
              <h3 className={c.dialogH3}>About the role</h3>
              <p className={c.text}>{job.description}</p>
              {job.requirements && (
                <>
                  <h3 className={c.dialogH3}>Requirements</h3>
                  <p className={c.text}>{job.requirements}</p>
                </>
              )}
              {job.backgroundCheck && (
                <p className={c.check}>
                  <LuShieldCheck aria-hidden /> This role works with youth: a background check is required before you start.
                </p>
              )}
              <span className={c.postedLine}>Posted {jobDate(job.postedAt)}</span>
            </div>
            <div className={c.dialogFoot}>
              {!job.clp && (
                <button type="button" className={c.apply} onClick={() => setApplying(true)}>
                  Apply with CLP
                </button>
              )}
              {job.applyUrl && (
                <a className={c.apply} href={job.applyUrl} target="_blank" rel="noopener">
                  Apply Now ↗
                </a>
              )}
              {mailto && (
                <a className={job.applyUrl ? c.applySecondary : c.apply} href={mailto}>
                  {job.applyUrl ? 'Email Instead' : 'Apply by Email'}
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** "Apply with CLP" on a partner's role: the application (a conversation with them on CLP Messages), then "sent". */
function ApplyWithClp({ job, onBack, onClose }: { job: Job; onBack: () => void; onClose: () => void }) {
  const app = useJobApplication(job, job.organization);
  const { form, set } = app;
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
