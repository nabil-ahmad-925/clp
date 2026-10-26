'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { fetchAvailability, joinWaitlist, savePlace, type JoinedWaitlist } from '@/content/listings';
import type { DirectoryItem } from '@/content/types';
import type { RowFacts } from './DirectoryRow';
import styles from './WaitlistModal.module.css';

type Props = {
  item: DirectoryItem;
  widgetId: number | string;
  facts: RowFacts;
  /** The full day they're joining (from the booking popup); else the listing's first full day. */
  date?: string;
  onClose: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Days of a dated listing offered (as the booking popup's). */
const MAX_DAYS = 21;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const longDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const clock = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const hours = (n: number) => `${n} hour${n === 1 ? '' : 's'}`;

/**
 * "Join the waitlist" (the design's popup on a sold-out listing): name, mobile, email and the spots needed, how it
 * works, then "You're #N on the waitlist". Nothing is paid. The place is saved on this device so the card shows it.
 */
export default function WaitlistModal({ item, widgetId, facts, date: given, onClose }: Props) {
  const now = today();
  const settings = item.waitlist ?? { claimHours: 2, mode: 'next' as const };
  // A dated listing's days from today; an undated one is joined for the day picked in the booking popup.
  const days =
    item.startDate && (item.endDate ?? item.startDate) >= now
      ? Array.from({ length: MAX_DAYS }, (_, i) => addDays(item.startDate! < now ? now : item.startDate!, i)).filter((d) => d <= (item.endDate ?? item.startDate!))
      : given
        ? [given]
        : [];
  const [full, setFull] = useState<string[] | null>(given ? [given] : days.length === 1 ? days : null);
  const [date, setDate] = useState(given ?? (days.length === 1 ? days[0] : ''));
  const [form, setForm] = useState({ name: '', phone: '', email: '', website: '' });
  const [people, setPeople] = useState(1);
  const [partial, setPartial] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<JoinedWaitlist | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const most = Math.max(1, Math.min(item.capacity ?? 8, 8));

  // Several days: which are full (only those can be joined).
  const daysKey = days.join(',');
  useEffect(() => {
    if (full || !daysKey) return;
    let active = true;
    fetchAvailability(Number(widgetId), item.id, daysKey.split(',')).then((a) => {
      if (!active) return;
      const f = daysKey.split(',').filter((d) => a.capacity && a.left[d] === 0);
      setFull(f);
      setDate((d) => d || f[0] || '');
    });
    return () => {
      active = false;
    };
  }, [full, daysKey, widgetId, item.id]);

  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
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

  const missing = !date
    ? full && !full.length
      ? 'This listing has open spots. Book it instead.'
      : 'Pick a day.'
    : !form.name.trim()
      ? 'Enter your name.'
      : !EMAIL.test(form.email.trim())
        ? 'Enter a valid email address.'
        : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError('');
    try {
      const joined = await joinWaitlist({
        widgetId,
        listingId: item.id,
        date,
        people,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        partial: people > 1 ? partial : undefined,
        website: form.website,
      });
      savePlace(`${widgetId}.${item.id}`, { id: joined.waitlist.id, token: joined.token, position: joined.waitlist.position ?? 1, date, at: new Date().toISOString() });
      setDone(joined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the waitlist. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const meta = [item.subtitle, date ? `${longDay(date)}${item.startTime ? `, ${clock(item.startTime)}` : ''}` : facts.months, facts.city].filter(Boolean).join(' · ');
  const window_ = hours(settings.claimHours);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label="Join the waitlist" tabIndex={-1}>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          ×
        </button>
        {!done ? (
          <form className={styles.stack} onSubmit={submit} noValidate>
            <span className={styles.kicker}>SOLD OUT · WAITLIST OPEN</span>
            <span className={styles.title}>{item.title}</span>
            {meta && <span className={styles.meta}>{meta}</span>}
            {days.length > 1 && (
              <label className={styles.field}>
                <span className={styles.label}>Day</span>
                <select className={styles.input} value={date} disabled={!full?.length} onChange={(e) => setDate(e.target.value)}>
                  {!full && <option value="">Checking the days…</option>}
                  {full?.map((d) => (
                    <option key={d} value={d}>
                      {longDay(d)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={styles.grid}>
              <input className={styles.input} type="text" placeholder="Full name" aria-label="Full name" autoComplete="name" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={styles.input} type="tel" placeholder="Mobile (optional)" aria-label="Mobile" autoComplete="tel" maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={styles.input} type="email" placeholder="Email" aria-label="Email" autoComplete="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <select className={styles.input} aria-label="Spots needed" value={people} onChange={(e) => setPeople(Number(e.target.value))}>
                {Array.from({ length: most }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} spot{n === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
              {/* Not for people: bots fill it in. */}
              <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            {people > 1 && (
              <label className={styles.check}>
                <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
                <span>
                  <strong>Offer me part of my group</strong>
                  <br />
                  If only 1 spot opens, I still want it. Off means we wait until all {people} spots open together.
                </span>
              </label>
            )}
            <div className={styles.how}>
              <strong>How it works</strong>
              <span>1. You&rsquo;re added to the line. No payment now.</span>
              {settings.mode === 'pick' ? (
                <>
                  <span>2. If a spot opens, the host picks who gets it.</span>
                  <span>3. If it&rsquo;s you, you get an email and have {window_} to book.</span>
                </>
              ) : settings.mode === 'all' ? (
                <>
                  <span>2. If a spot opens, everyone on the waitlist gets an email.</span>
                  <span>3. The first to book gets the spot.</span>
                </>
              ) : (
                <>
                  <span>2. If a spot opens, you get an email.</span>
                  <span>3. You have {window_} to book before it goes to the next person.</span>
                </>
              )}
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={styles.primary} disabled={Boolean(missing) || sending}>
              {sending ? 'Joining…' : 'Join the Waitlist'}
            </button>
            {missing && <span className={styles.hint}>{missing}</span>}
          </form>
        ) : (
          <div className={`${styles.stack} ${styles.done}`}>
            <span className={styles.tick} aria-hidden>
              ✓
            </span>
            <span className={styles.doneTitle}>You&rsquo;re #{done.waitlist.position ?? 1} on the waitlist</span>
            <span className={styles.doneText}>
              We saved {done.waitlist.people} spot{done.waitlist.people === 1 ? '' : 's'} in line for {item.title}.{' '}
              {settings.mode === 'all'
                ? 'If someone cancels or the host adds spots, you’ll get an email. The first to book gets it.'
                : settings.mode === 'pick'
                  ? `If a spot opens and the host picks you, you’ll get an email and have ${window_} to book.`
                  : `If someone cancels or the host adds spots, you’ll get an email and have ${window_} to book.`}{' '}
              You can leave the waitlist any time from the link in your email.
            </span>
            <button type="button" className={styles.secondary} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
