'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import FieldSelect from '@/components/ui/FieldSelect';
import { ACTIVITIES, BUDGETS, sendRequest, type RequestConfirmation, type RequestKind } from '@/content/requests';
import type { DirectoryItem } from '@/content/types';
import { BADGE } from './BookingModal';
import type { RowFacts } from './DirectoryRow';
import styles from './BookingModal.module.css';
import own from './RequestModal.module.css';

type Props = {
  /** "project": a service's "Start a New Project"; "permit": a government facility's "Permit Now". */
  kind: RequestKind;
  item: DirectoryItem;
  /** The listing's directory. */
  widgetId: number;
  /** Its city and ages, as its card shows them. */
  facts: RowFacts;
  /** A service area's services (its Service filter), for the project form. */
  services?: { value: string; label: string }[];
  onClose: () => void;
};

const BUDGET_OPTIONS = BUDGETS.map((b) => ({ value: b, label: b }));
const ACTIVITY_OPTIONS = ACTIVITIES.map((a) => ({ value: a, label: a }));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+().\-\s]{5,40}$/;
const MAX_PEOPLE = 10000;

/** Today in US Eastern time ("YYYY-MM-DD"), as the bookings API checks dates. */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const longDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/**
 * A listing's request form, in the booking popup's layout (the photo with the listing, the form beside it): a
 * service's "Start a New Project" (the service, budget and project, as competelikepros.com's service inquiries) or a
 * government facility's "Permit Now" (the day, times, group and what it's for). Nothing is booked or paid: the request
 * goes to the host and CLP (the bookings API), who reply by e-mail. Esc, the close button or a click outside closes it
 * (not while it is sending).
 */
export default function RequestModal({ kind, item, widgetId, facts, services = [], onClose }: Props) {
  const permit = kind === 'permit';
  const ownService = services.find((s) => item.tags.includes(s.value)) ?? services[0];
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    service: ownService?.label ?? '',
    budget: '',
    date: '',
    startTime: '',
    endTime: '',
    people: '',
    activity: '',
    details: '',
  });
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [sent, setSent] = useState<RequestConfirmation | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const now = today();
  const label = permit ? 'Permit Now' : item.cardButton?.action === 'project' && item.cardButton.label ? item.cardButton.label : 'Start a New Project';
  const host = item.subtitle || 'Compete Like Pros';

  // Scroll locked behind it, Esc closes it, focus starts in it (once: the parent's re-renders don't move the focus).
  // While the request is being sent it stays open.
  const closeRef = useRef(onClose);
  const sendingRef = useRef(false);
  useEffect(() => {
    closeRef.current = () => !sendingRef.current && onClose();
    sendingRef.current = sending;
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
  // The confirmation starts at its top.
  useEffect(() => {
    dialog.current?.querySelector('[data-scroll]')?.scrollTo({ top: 0 });
  }, [sent]);

  const people = Number(form.people);
  const errors: Record<string, string> = permit
    ? {
        date: !form.date ? 'Choose the day you need it.' : form.date < now ? 'Choose a day from today on.' : '',
        time: form.endTime && !form.startTime ? 'Add the start time too.' : form.startTime && form.endTime && form.endTime <= form.startTime ? 'The end time must be after the start time.' : '',
        people: !Number.isInteger(people) || people < 1 || people > MAX_PEOPLE ? 'Enter how many people.' : '',
        activity: !form.activity ? 'Choose what it’s for.' : '',
      }
    : {
        service: !form.service ? 'Choose a service.' : '',
        budget: !form.budget ? 'Choose a budget.' : '',
      };
  const contactErrors = {
    name: !form.name.trim() ? 'Enter your name.' : '',
    email: !EMAIL.test(form.email.trim()) ? 'Enter a valid email.' : '',
    phone: form.phone.trim() && !PHONE.test(form.phone.trim()) ? 'Enter the phone number with digits only.' : '',
  };
  const all: Record<string, string> = { ...errors, ...contactErrors };
  const valid = Object.values(all).every((e) => !e);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const error = (key: string) =>
    tried && all[key] ? (
      <span className={own.fieldError} role="alert">
        {all[key]}
      </span>
    ) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || sending) return;
    setSending(true);
    setFailure('');
    const contact = {
      widgetId,
      listingId: item.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      organization: form.organization.trim() || undefined,
      details: form.details.trim() || undefined,
    };
    try {
      setSent(
        await sendRequest(
          permit
            ? { ...contact, kind, date: form.date, startTime: form.startTime || undefined, endTime: form.endTime || undefined, people, activity: form.activity }
            : { ...contact, kind, service: form.service, budget: form.budget },
        ),
      );
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={`${label}: ${item.title}`} tabIndex={-1}>
        <button type="button" className={styles.close} aria-label="Close" disabled={sending} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className={styles.photo}>
          {item.image && <Image className={styles.photoImage} src={item.image} alt="" fill sizes="(max-width: 767px) 100vw, 460px" />}
          <span className={styles.photoShade} aria-hidden />
          <div className={styles.photoText}>
            <span className={styles.badge}>{permit ? 'GOVERNMENT FACILITY' : BADGE[item.provider ?? 'partner']}</span>
            {item.subtitle && <span className={styles.photoProvider}>{item.subtitle}</span>}
            <span className={styles.photoTitle}>{item.title}</span>
            {(facts.city || facts.ages) && <span className={styles.photoMeta}>{[facts.city, facts.ages].filter(Boolean).join(' · ')}</span>}
          </div>
        </div>

        <div className={styles.panel}>
          {sent ? (
            <div className={styles.step}>
              <div className={styles.body} data-scroll>
                <div className={styles.done}>
                  <span className={styles.doneKicker}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    REQUEST SENT
                  </span>
                  <span className={styles.doneTitle}>{permit ? 'Your Permit Request Is In' : 'We’ll Be in Touch'}</span>
                  <span className={styles.doneText}>
                    {permit ? (
                      <>
                        Your request to use <strong>{sent.listingTitle}</strong> on {longDay(form.date)} is in. We check the day with the permit office and
                        reply to <strong>{sent.email}</strong> with the next steps, usually within 2 business days.
                      </>
                    ) : (
                      <>
                        Your project request for <strong>{sent.listingTitle}</strong> is in. {host} replies to <strong>{sent.email}</strong>, usually within 2
                        business days, to plan it with you.
                      </>
                    )}
                  </span>
                  <span className={own.reference}>
                    Request reference <strong>{sent.id.replace(/^rq-/, '').slice(0, 8).toUpperCase()}</strong>
                  </span>
                  <button type="button" className={styles.backLink} onClick={onClose}>
                    Back to Listings
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className={styles.step} onSubmit={submit} noValidate>
              <div className={styles.body} data-scroll>
                <div className={styles.stack}>
                  <div className={styles.section}>
                    <span className={styles.kicker}>{permit ? 'REQUEST A PERMIT' : label.toUpperCase()}</span>
                    <p className={styles.about}>
                      {permit
                        ? 'This facility is run by the city, so groups need a permit to use it. Tell us when and what for, and we help you get it.'
                        : 'Tell us what you need and your budget. The team gets back to you to plan the project with you.'}
                    </p>
                  </div>

                  {permit ? (
                    <div className={styles.section}>
                      <span className={styles.label}>When and What For</span>
                      <div className={styles.fields}>
                        <label className={`${styles.field} ${styles.fieldWide}`}>
                          Day
                          <input
                            className={styles.input}
                            type="date"
                            min={now}
                            max={addDays(now, 730)}
                            value={form.date}
                            onChange={set('date')}
                            aria-invalid={tried && Boolean(all.date)}
                          />
                          {error('date')}
                        </label>
                        <label className={styles.field}>
                          Start time (optional)
                          <input className={styles.input} type="time" value={form.startTime} onChange={set('startTime')} aria-invalid={tried && Boolean(all.time)} />
                        </label>
                        <label className={styles.field}>
                          End time (optional)
                          <input className={styles.input} type="time" value={form.endTime} onChange={set('endTime')} aria-invalid={tried && Boolean(all.time)} />
                        </label>
                        {tried && all.time && <span className={`${own.fieldError} ${styles.fieldWide}`}>{all.time}</span>}
                        <label className={styles.field}>
                          People
                          <input
                            className={styles.input}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={MAX_PEOPLE}
                            value={form.people}
                            onChange={set('people')}
                            aria-invalid={tried && Boolean(all.people)}
                          />
                          {error('people')}
                        </label>
                        <div className={styles.field}>
                          <span>What it&rsquo;s for</span>
                          <FieldSelect
                            label="What it’s for"
                            className={styles.input}
                            value={form.activity}
                            options={ACTIVITY_OPTIONS}
                            invalid={tried && Boolean(all.activity)}
                            onChange={(activity) => setForm({ ...form, activity })}
                          />
                          {error('activity')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.section}>
                      <span className={styles.label}>Your Project</span>
                      <div className={styles.fields}>
                        <div className={styles.field}>
                          <span>Service</span>
                          <FieldSelect
                            label="Service"
                            className={styles.input}
                            value={form.service}
                            options={services.map((s) => ({ value: s.label, label: s.label }))}
                            invalid={tried && Boolean(all.service)}
                            onChange={(service) => setForm({ ...form, service })}
                          />
                          {error('service')}
                        </div>
                        <div className={styles.field}>
                          <span>Budget</span>
                          <FieldSelect
                            label="Budget"
                            className={styles.input}
                            value={form.budget}
                            options={BUDGET_OPTIONS}
                            invalid={tried && Boolean(all.budget)}
                            onChange={(budget) => setForm({ ...form, budget })}
                          />
                          {error('budget')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.section}>
                    <span className={styles.label}>Your Details</span>
                    <div className={styles.fields}>
                      <label className={styles.field}>
                        Full name
                        <input className={styles.input} autoComplete="name" maxLength={120} value={form.name} onChange={set('name')} aria-invalid={tried && Boolean(all.name)} />
                        {error('name')}
                      </label>
                      <label className={styles.field}>
                        Email
                        <input
                          className={styles.input}
                          type="email"
                          autoComplete="email"
                          maxLength={200}
                          value={form.email}
                          onChange={set('email')}
                          aria-invalid={tried && Boolean(all.email)}
                        />
                        {error('email')}
                      </label>
                      <label className={styles.field}>
                        Phone (optional)
                        <input className={styles.input} type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={set('phone')} aria-invalid={tried && Boolean(all.phone)} />
                        {error('phone')}
                      </label>
                      <label className={styles.field}>
                        Team or organization (optional)
                        <input className={styles.input} autoComplete="organization" maxLength={200} value={form.organization} onChange={set('organization')} />
                      </label>
                      <label className={`${styles.field} ${styles.fieldWide}`}>
                        {permit ? 'Anything else we should know? (optional)' : 'About the project (optional)'}
                        <textarea className={styles.input} rows={3} maxLength={2000} value={form.details} onChange={set('details')} />
                      </label>
                    </div>
                  </div>

                  {permit && item.permitUrl && (
                    <span className={styles.hint}>
                      Prefer to apply yourself?{' '}
                      <a className={own.link} href={item.permitUrl} target="_blank" rel="noopener">
                        Apply on the permit office&rsquo;s page <span className="glyph" aria-hidden>↗</span>
                      </a>
                    </span>
                  )}
                </div>
              </div>
              {/* The button stays in view at the foot of the popup. */}
              <div className={styles.footer}>
                {failure && (
                  <p className={styles.error} role="alert">
                    {failure}
                  </p>
                )}
                <button type="submit" className={styles.primary} disabled={sending}>
                  {sending ? 'Sending…' : permit ? 'Request Permit' : 'Send Request'}
                </button>
                <span className={styles.hint}>
                  {permit ? 'Nothing is booked or paid now. The permit is issued by the city.' : 'No payment online. The team replies to plan the project and its price with you.'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
