// Jobs & Internships (/jobs/, the Resources' jobs category): live roles from CLP partners (CLP reviewed them) and CLP
// itself, from clp-api's jobs Lambda. jobsConfig.json (shared with the API and the admin) has the types, workplaces,
// kinds of role and pay units.
import config from './data/jobsConfig.json';

const API_URL = process.env.NEXT_PUBLIC_LISTINGS_API_URL?.replace(/\/$/, '');

export type JobPartner = { name: string; slug: string; logo: string; mono: string; color: string; hero: string };
export type Job = {
  id: string;
  title: string;
  organization: string;
  category: string;
  type: string;
  workplace: string;
  location: string;
  sports: string[];
  payMin: number | null;
  payMax: number | null;
  payUnit: string;
  /** Its cover photo; '' for none (the partner's page photo shows). */
  image: string;
  /** The small box on its card's photo; '' for none (the partner's logo, else the cover photo). */
  logo: string;
  /** About the role. */
  description: string;
  /** "What you'll do" and "What you need": one per line. */
  duties: string;
  requirements: string;
  /** When it starts (YYYY-MM-DD); '' = as soon as possible. */
  startDate: string;
  applyUrl: string;
  applyEmail: string;
  deadline: string;
  backgroundCheck: boolean;
  postedAt: string;
  /** The CLP partner who posted it (their page is live). */
  partner?: JobPartner;
  /** Posted by CLP itself. */
  clp?: boolean;
};

export const JOB_TYPES = config.types;
export const JOB_WORKPLACES = config.workplaces;
export const JOB_CATEGORIES = config.categories;

const labelOf = (list: { id: string; label: string }[]) => (id: string) => list.find((x) => x.id === id)?.label ?? id;
export const jobTypeLabel = labelOf(JOB_TYPES);
export const workplaceLabel = labelOf(JOB_WORKPLACES);
export const jobCategoryLabel = labelOf(JOB_CATEGORIES);

const dollars = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
/** "$20 – $28 / hour", "From $20 / hour", "Up to $500 / week", "$1,500 stipend"; '' when not given. */
export const payText = (job: Pick<Job, 'payMin' | 'payMax' | 'payUnit'>) => {
  const { payMin: lo, payMax: hi, payUnit: unit } = job;
  if (lo == null && hi == null) return '';
  const amount =
    lo != null && hi != null ? (lo === hi ? dollars(lo) : `${dollars(lo)} – ${dollars(hi)}`) : lo != null ? `From ${dollars(lo)}` : `Up to ${dollars(hi!)}`;
  // A stipend is the total: "$1,500 stipend".
  return unit === 'stipend' ? `${amount} stipend` : unit ? `${amount} / ${unit}` : amount;
};

const UNIT_SHORT: Record<string, string> = { hour: 'hr' };
/** The jobs board's pay: "$25–$30 / hr", "$52,000–$64,000 / year", "From $20 / hr"; '' when not given. */
export const payShort = (job: Pick<Job, 'payMin' | 'payMax' | 'payUnit'>) =>
  payText({ ...job, payUnit: UNIT_SHORT[job.payUnit] ?? job.payUnit }).replace(' – ', '–');

/**
 * About how many hours of work each pay unit is, for "Highest pay" across units: a session about an hour, a day 8, a
 * week 40, a month 173, a year 2,080, a stipend (the total) 12 weeks.
 */
const UNIT_HOURS: Record<string, number> = { hour: 1, session: 1, day: 8, week: 40, month: 173, year: 2080, stipend: 480 };
/** A role's top pay per hour (as near as its unit allows); -1 when not given (last under "Highest pay"). */
export const hourlyPay = (job: Pick<Job, 'payMin' | 'payMax' | 'payUnit'>) => {
  const top = job.payMax ?? job.payMin;
  return top == null ? -1 : top / (UNIT_HOURS[job.payUnit] ?? 1);
};

/** Whole days from today (the reader's) to a YYYY-MM-DD day: 0 today, negative past. */
export const daysUntil = (day: string, now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((new Date(`${day}T00:00:00`).getTime() - start) / 86_400_000);
};

/** "Oct 24" this year, "Jan 15, 2027" another. */
export const shortDate = (day: string, now = new Date()) => {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }) });
};

/** When it starts: "Jan 2027", or "ASAP" (none given, or already passed). */
export const startText = (job: Pick<Job, 'startDate'>) =>
  job.startDate && daysUntil(job.startDate) > 0 ? new Date(`${job.startDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'ASAP';

/** One line each ("What you'll do", "What you need"), any list marks taken off. */
export const lines = (text = '') =>
  text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

/** "Oct 14, 2026" from an ISO time or a YYYY-MM-DD day (that day wherever the reader is). */
export const jobDate = (value: string) => {
  if (!value) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** "Today", "3 days ago", "2 weeks ago", then the date. */
export const postedAgo = (iso: string, now = Date.now()) => {
  const days = Math.floor((now - Date.parse(iso)) / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return jobDate(iso);
};

/** Where a role is: "Remote", "Boston, MA (Hybrid)", "Boston, MA". */
export const placeText = (job: Pick<Job, 'workplace' | 'location'>) =>
  job.workplace === 'remote' ? (job.location ? `Remote · ${job.location}` : 'Remote') : job.workplace === 'hybrid' ? `${job.location} (Hybrid)` : job.location;

/** Waits before retrying a read the API turned away as busy (its Lambdas at their concurrency limit). */
const BUSY_RETRIES_MS = [400, 1000, 2000];

async function read<T>(path: string): Promise<T> {
  if (!API_URL) throw new Error('Jobs aren’t available right now.');
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    } catch {
      throw new Error('Could not reach CLP. Check your connection and try again.');
    }
    if ((res.status === 503 || res.status === 429) && attempt < BUSY_RETRIES_MS.length) {
      await new Promise((r) => setTimeout(r, BUSY_RETRIES_MS[attempt]));
      continue;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
    return body as T;
  }
}

/** The open roles, newest first. */
export const fetchJobs = () => read<{ items: Job[] }>('/jobs').then((r) => r.items);
/** One open role (a shared link to one no longer open: an error). */
export const fetchJob = (id: string) => read<{ job: Job }>(`/jobs/${encodeURIComponent(id)}`).then((r) => r.job);

export const jobsMeta = {
  title: 'Sports Jobs & Internships: Compete Like Pros™',
  description: 'Coaching, events, media and performance jobs and internships with CLP and its partners. Build your career in sports.',
};
