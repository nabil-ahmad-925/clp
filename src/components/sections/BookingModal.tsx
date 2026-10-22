'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { downloadCalendarFile } from '@/content/calendar';
import { agePolicy, bookingPageHref, CANCEL_TIME, directionsHref, fetchAvailability, requestBooking, type NewBooking } from '@/content/listings';
import { WAIVER_URL } from '@/content/documents';
import type { DirectoryItem, Provider } from '@/content/types';
import type { RowFacts } from './DirectoryRow';
import styles from './BookingModal.module.css';

type Props = {
  item: DirectoryItem;
  /** The listing's directory (the request names it with the listing's id). */
  widgetId: number;
  /** The listing's city, ages, dates and price (see TeamDirectory). */
  facts: RowFacts;
  onClose: () => void;
  /** A full day of a listing with a waitlist: join it for that day (the waitlist popup). */
  onJoinWaitlist?: (date: string) => void;
};

/** The site's Waiver & Release (as in the footer) and Expectations & Commitment pages. */
const WAIVER = WAIVER_URL;
const EXPECTATIONS = '/our-expectations/';
/** Days offered for a listing running over many days; people per booking. */
const MAX_DAYS = 21;
/** Free cancellation by the guest: up to this many days before (as the bookings API's CANCEL_DAYS). */
const CANCEL_DAYS = 2;
const MAX_PEOPLE = 20;
/** Who hosts it, on the photo and under "Hosted by" (a facility without a partner is booked through CLP). */
export const BADGE: Record<Provider, string> = { clp: 'COMPETE LIKE PROS', partner: 'CLP PARTNER', community: 'COMMUNITY', sponsored: 'SPONSORED' };
const HOST_META: Record<Provider, string> = {
  clp: 'Compete Like Pros · verified',
  partner: 'CLP Partner · verified',
  community: 'Booked through Compete Like Pros',
  sponsored: 'Sponsored · booked through Compete Like Pros',
};

/** Today in US Eastern time ("YYYY-MM-DD"), as the bookings API checks dates. */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const dayParts = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    /** "Sat, Oct 24" */
    short: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
  };
};
const clock = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const dollars = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const people = (adults: number, kids: number) =>
  [adults ? `${adults} adult${adults === 1 ? '' : 's'}` : '', kids ? `${kids} kid${kids === 1 ? '' : 's'}` : ''].filter(Boolean).join(' + ') || '0 people';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Step = 'details' | 'book' | 'done';

/**
 * "Book Now" (CLP Partner and Compete Like Pros listings; the new design's booking popup): the listing's details,
 * then the day, who's coming (the listing's age rule decides adults and kids), the contact details and the waiver, and
 * "You're booked": the guest is booked at once (the bookings API holds their spots) and sees where to go, the exact
 * address and check-in instructions being private to booked guests. Payment isn't taken online. Esc or the close
 * button closes it.
 */
export default function BookingModal({ item, widgetId, facts, onClose, onJoinWaitlist }: Props) {
  const [step, setStep] = useState<Step>('details');
  const now = today();
  // The days offered: a dated listing's (from today on), else any day from today (picked in a date field).
  const days =
    item.startDate && (item.endDate ?? item.startDate) >= now
      ? Array.from({ length: MAX_DAYS }, (_, i) => addDays(item.startDate! < now ? now : item.startDate!, i)).filter((d) => d <= (item.endDate ?? item.startDate!))
      : null;
  const ended = Boolean(item.startDate) && !days;
  const policy = agePolicy(item.tags);
  const [date, setDate] = useState(days?.[0] ?? '');
  const [adults, setAdults] = useState(policy.kind === 'youth' ? 0 : 1);
  const [kids, setKids] = useState(policy.kind === 'youth' ? 1 : 0);
  const [ageOk, setAgeOk] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [waiver, setWaiver] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', phone: '', notes: '', website: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<NewBooking | null>(null);
  // Spots left each day (a listing with a capacity); fetched on the booking step, again after a "full" answer.
  const [avail, setAvail] = useState<{ capacity: number | null; left: Record<string, number> }>({ capacity: item.capacity ?? null, left: {} });
  const [availTick, setAvailTick] = useState(0);
  const availDates = days ?? (date ? [date] : []);
  const availKey = availDates.join(',');
  useEffect(() => {
    if (step !== 'book' || !item.capacity || !availKey) return;
    let active = true;
    fetchAvailability(widgetId, item.id, availKey.split(',')).then((a) => active && setAvail(a));
    return () => {
      active = false;
    };
  }, [step, availKey, availTick, widgetId, item.id, item.capacity]);
  /** Spots left on a day (null: no limit, or not known yet). */
  const leftOn = (d: string) => (avail.capacity && d in avail.left ? avail.left[d] : null);
  // A chosen day that turned out full moves to the first one with room.
  useEffect(() => {
    if (!days || leftOn(date) !== 0) return;
    const open = days.find((d) => leftOn(d) !== 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- following the spots that just loaded
    if (open && open !== date) setDate(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when the spots change
  }, [avail]);
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once: the parent's re-renders don't move the focus).
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
  // Each step starts at its top.
  useEffect(() => {
    dialog.current?.querySelector('[data-scroll]')?.scrollTo({ top: 0 });
  }, [step]);

  const per = item.priceMin ?? null;
  const count = adults + kids;
  const spotsLeft = date ? leftOn(date) : null;
  // A full day (or too few spots for the group) of a listing with a waitlist can be waited for.
  const canWait = Boolean(item.waitlist && item.capacity && onJoinWaitlist);
  const waitInstead = canWait && Boolean(date) && spotsLeft !== null && (spotsLeft === 0 || count > spotsLeft);
  const total = per == null ? null : per * count;
  const time = item.startTime ? `${clock(item.startTime)}${item.endTime ? ` – ${clock(item.endTime)}` : ''}` : '';
  // Who runs it: the listing's provider line, else CLP itself.
  const host = item.subtitle || 'Compete Like Pros';
  // What still stops the request (shown on the button's line).
  const missing =
    !date
      ? 'Pick a date.'
      : spotsLeft === 0
        ? 'This day is full. Pick another day.'
      : count < 1
        ? 'Add at least one person.'
        : spotsLeft !== null && count > spotsLeft
          ? `Only ${spotsLeft} spot${spotsLeft === 1 ? ' is' : 's are'} left on this day.`
        : policy.kind === 'adult' && !ageOk
          ? `Confirm everyone is ${policy.minAge} or older.`
          : kids > 0 && !guardian
            ? 'Confirm you’re the parent or guardian.'
            : !contact.name.trim()
              ? 'Enter your name.'
              : !EMAIL.test(contact.email.trim())
                ? 'Enter a valid email address.'
                : !waiver
                  ? 'Agree to the waiver to continue.'
                  : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError('');
    try {
      const booked = await requestBooking({
        widgetId,
        listingId: item.id,
        date,
        adults,
        kids,
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim() || undefined,
        notes: contact.notes.trim() || undefined,
        waiver,
        guardian: kids > 0 ? guardian : undefined,
        ageConfirmed: policy.kind === 'adult' ? ageOk : undefined,
        website: contact.website,
      });
      setDone(booked);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book your spot. Please try again.');
      // Someone may have just taken the last spots: show the days as they are now.
      setAvailTick((n) => n + 1);
    } finally {
      setSending(false);
    }
  };

  const counter = (label: string, note: string, value: number, set: (n: number) => void, min: number, disabled: boolean) => (
    <div className={`${styles.counterRow} ${disabled ? styles.counterOff : ''}`}>
      <span className={styles.counterText}>
        <span className={styles.counterLabel}>{label}</span>
        <span className={styles.counterNote}>{note}</span>
      </span>
      <span className={styles.counter}>
        <button type="button" aria-label={`Remove one: ${label}`} disabled={disabled || value <= min} onClick={() => set(value - 1)}>
          −
        </button>
        <span aria-live="polite">{value}</span>
        <button
          type="button"
          aria-label={`Add one: ${label}`}
          disabled={disabled || count >= MAX_PEOPLE || (spotsLeft !== null && count >= spotsLeft)}
          onClick={() => set(value + 1)}
        >
          +
        </button>
      </span>
    </div>
  );

  const check = (on: boolean, set: (v: boolean) => void, children: ReactNode) => (
    <label className={styles.check}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span className={styles.box} aria-hidden />
      <span>{children}</span>
    </label>
  );

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Book ${item.title}`} tabIndex={-1}>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className={styles.photo}>
          {item.image && <Image className={styles.photoImage} src={item.image} alt="" fill sizes="(max-width: 767px) 100vw, 460px" />}
          <span className={styles.photoShade} aria-hidden />
          <div className={styles.photoText}>
            <span className={styles.badge}>{BADGE[item.provider ?? 'partner']}</span>
            {item.subtitle && <span className={styles.photoProvider}>{item.subtitle}</span>}
            <span className={styles.photoTitle}>{item.title}</span>
            {(facts.city || facts.ages) && <span className={styles.photoMeta}>{[facts.city, facts.ages].filter(Boolean).join(' · ')}</span>}
          </div>
        </div>

        <div className={styles.panel}>
          {step === 'details' && (
            <div className={styles.step}>
              <div className={styles.body} data-scroll>
                <div className={styles.stack}>
                  {(item.excerpt || item.bio) && (
                    <div className={styles.section}>
                      <span className={styles.kicker}>ABOUT THIS EXPERIENCE</span>
                      <p className={styles.about}>{item.excerpt || item.bio}</p>
                    </div>
                  )}
                  <div className={styles.facts}>
                    <div className={styles.fact}>
                      <span className={styles.kicker}>{days && days.length > 1 ? 'DATES' : 'NEXT DATE'}</span>
                      <span className={styles.factValue}>{facts.months || (ended ? 'Ended' : 'Pick your day')}</span>
                    </div>
                    <div className={styles.fact}>
                      <span className={styles.kicker}>TIME</span>
                      <span className={styles.factValue}>{time || 'Set with the host'}</span>
                    </div>
                    <div className={styles.fact}>
                      <span className={styles.kicker}>AGES</span>
                      <span className={styles.factValue}>{facts.ages || (policy.kind === 'adult' ? `${policy.minAge}+` : 'All ages')}</span>
                    </div>
                    <div className={styles.fact}>
                      <span className={styles.kicker}>PRICE</span>
                      <span className={styles.factValue}>{per == null ? 'Contact for pricing' : per === 0 ? 'Free' : `${dollars(per)} per person`}</span>
                    </div>
                  </div>
                  {facts.city && (
                    <div className={styles.note}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      <span>
                        <strong>{facts.city}</strong>
                        <br />
                        The exact address is shared with confirmed attendees after booking, to keep sessions safe for everyone.
                      </span>
                    </div>
                  )}
                  {item.whatToBring && item.whatToBring.length > 0 && (
                    <div className={styles.section}>
                      <span className={styles.kicker}>WHAT TO BRING</span>
                      <ul className={styles.bring}>
                        {item.whatToBring.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={styles.hosted}>
                    <span className={styles.kicker}>HOSTED BY</span>
                    <span className={styles.hostName}>{host}</span>
                    <span className={styles.hostMeta}>{HOST_META[item.provider ?? 'partner']}</span>
                  </div>
                  {ended && <p className={styles.error}>This experience has ended. Check back for new dates.</p>}
                </div>
              </div>
              {!ended && (
                <div className={styles.footer}>
                  <button type="button" className={styles.primary} onClick={() => setStep('book')}>
                    Book Now{per != null && per > 0 ? ` · ${dollars(per)} per person` : ''}
                  </button>
                  <span className={styles.hint}>Free cancellation up to {CANCEL_DAYS} days before.</span>
                </div>
              )}
            </div>
          )}

          {step === 'book' && (
            <form className={styles.step} onSubmit={submit} noValidate>
              <div className={styles.body} data-scroll>
                <div className={styles.stack}>
                  <button type="button" className={styles.back} onClick={() => setStep('details')}>
                    <span className="glyph" aria-hidden>←</span> Back to Details
                  </button>

                  <div className={styles.section}>
                    <span className={styles.label}>Pick a Date</span>
                    {days ? (
                      <div className={styles.days} role="radiogroup" aria-label="Date">
                        {days.map((d) => {
                          const p = dayParts(d);
                          const n = leftOn(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              role="radio"
                              aria-checked={date === d}
                              aria-label={`${p.long}${n === 0 ? (canWait ? ', full, waitlist open' : ', full') : n !== null ? `, ${n} spot${n === 1 ? '' : 's'} left` : ''}`}
                              disabled={n === 0 && !canWait}
                              className={`${styles.day} ${date === d ? styles.dayOn : ''} ${n === 0 ? styles.dayFull : ''}`}
                              onClick={() => setDate(d)}
                            >
                              <span className={styles.dow}>{p.dow}</span>
                              <span>{p.label}</span>
                              {n !== null && <span className={styles.dayLeft}>{n === 0 ? (canWait ? 'Waitlist' : 'Full') : `${n} left`}</span>}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input className={styles.input} type="date" aria-label="Date" min={now} max={addDays(now, 365)} value={date} onChange={(e) => setDate(e.target.value)} />
                    )}
                    {time && <span className={styles.hint}>{time}</span>}
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span className={styles.hint}>
                        {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left on this day
                      </span>
                    )}
                    {!days && spotsLeft === 0 && !canWait && <span className={styles.error}>This day is full. Pick another day.</span>}
                    {spotsLeft === 0 && canWait && <span className={styles.error}>This day is sold out. The waitlist is open.</span>}
                  </div>

                  <div className={styles.section}>
                    <span className={styles.labelRow}>
                      <span className={styles.label}>Who&rsquo;s Coming?</span>
                      <span className={styles.policy}>
                        {policy.kind === 'adult' ? `${policy.minAge}+ ONLY` : policy.kind === 'youth' ? 'KIDS ONLY' : 'ALL AGES WELCOME'}
                      </span>
                    </span>
                    <span className={styles.hint}>{per != null && per > 0 ? `${dollars(per)} per person · ` : ''}each person needs a spot</span>
                    <div className={styles.counters}>
                      {counter(
                        policy.kind === 'adult' ? `Adults (${policy.minAge}+)` : 'Adults (18+)',
                        policy.kind === 'youth' ? 'This one is just for kids' : 'Including you, if you’re playing',
                        adults,
                        setAdults,
                        0,
                        policy.kind === 'youth',
                      )}
                      {counter(
                        'Kids (under 18)',
                        policy.kind === 'adult' ? `Not allowed: this one is ${policy.minAge}+ only` : 'Must be in your care as parent or guardian',
                        kids,
                        setKids,
                        0,
                        policy.kind === 'adult',
                      )}
                    </div>
                  </div>

                  {policy.kind === 'adult' && (
                    <div className={styles.panelNote}>
                      {check(ageOk, setAgeOk, (
                        <>
                          <strong>Everyone in my group is {policy.minAge} or older</strong> and will bring a valid photo ID.
                        </>
                      ))}
                    </div>
                  )}
                  {kids > 0 && (
                    <div className={styles.panelNote}>
                      {check(guardian, setGuardian, (
                        <>
                          <strong>I&rsquo;m the parent or legal guardian</strong> of every minor in my group, and I&rsquo;m booking on their behalf.
                        </>
                      ))}
                    </div>
                  )}

                  <div className={styles.section}>
                    <span className={styles.label}>Your Details</span>
                    <div className={styles.fields}>
                      <label className={styles.field}>
                        Full name
                        <input className={styles.input} autoComplete="name" maxLength={120} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
                      </label>
                      <label className={styles.field}>
                        Email
                        <input className={styles.input} type="email" autoComplete="email" maxLength={200} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                      </label>
                      <label className={styles.field}>
                        Phone (optional)
                        <input className={styles.input} type="tel" autoComplete="tel" maxLength={40} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                      </label>
                      <label className={`${styles.field} ${styles.fieldWide}`}>
                        Anything the host should know? (optional)
                        <textarea className={styles.input} rows={2} maxLength={1000} value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
                      </label>
                      {/* Not for people: bots fill it in. */}
                      <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} />
                    </div>
                  </div>

                  {check(waiver, setWaiver, (
                    <>
                      I agree to the CLP{' '}
                      <a href={WAIVER} target="_blank" rel="noopener">
                        Waiver &amp; Release
                      </a>{' '}
                      and{' '}
                      <Link href={EXPECTATIONS} target="_blank">
                        Expectations &amp; Commitment
                      </Link>
                      .
                    </>
                  ))}
                </div>
              </div>
              {/* The total and the button stay in view at the foot of the popup. */}
              <div className={`${styles.totals} ${styles.footer}`}>
                <span className={styles.totalLine}>
                  {people(adults, kids)}
                  {per != null && <span>× {per === 0 ? 'Free' : dollars(per)}</span>}
                </span>
                <span className={styles.totalMain}>
                  Total<span>{total == null ? 'Set with the host' : total === 0 ? 'Free' : dollars(total)}</span>
                </span>
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
                {waitInstead ? (
                  <>
                    <button type="button" className={styles.primary} onClick={() => onJoinWaitlist!(date)}>
                      Join the Waitlist
                    </button>
                    <span className={styles.hint}>
                      {spotsLeft === 0 ? 'This day is sold out.' : `Only ${spotsLeft} spot${spotsLeft === 1 ? ' is' : 's are'} left.`} Joining is free. We email you if spots open.
                    </span>
                  </>
                ) : (
                  <>
                    <button type="submit" className={styles.primary} disabled={Boolean(missing) || sending}>
                      {sending ? 'Booking…' : 'Confirm Booking'}
                    </button>
                    <span className={styles.hint}>{missing || `No payment online: you pay ${host} directly.`}</span>
                  </>
                )}
              </div>
            </form>
          )}

          {step === 'done' && done && (
            <div className={styles.step}>
              <div className={styles.body} data-scroll>
                <div className={styles.done}>
                  <span className={styles.doneKicker}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    YOU&rsquo;RE BOOKED
                  </span>
                  <span className={styles.doneTitle}>See you on {dayParts(done.booking.date).short}</span>
                  <span className={styles.doneText}>
                    {people(done.booking.adults, done.booking.kids)}
                    {time ? ` · ${time}` : ''}. A confirmation is on its way to your email.
                  </span>
                  <div className={styles.location}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                    <span className={styles.locationText}>
                      <span className={styles.locationKicker}>YOUR LOCATION</span>
                      {facts.city && <strong>{facts.city}</strong>}
                      {done.booking.address ? <span>{done.booking.address}</span> : <span className={styles.locationMuted}>{host} will e-mail you the exact address.</span>}
                      {done.booking.checkInInstructions && <span className={styles.locationMuted}>{done.booking.checkInInstructions}</span>}
                      {done.booking.address && (
                        <a className={styles.directions} href={directionsHref(done.booking.address)} target="_blank" rel="noopener">
                          Get directions <span className="glyph" aria-hidden>↗</span>
                        </a>
                      )}
                    </span>
                  </div>
                  <span className={styles.cancelNote}>
                    {done.booking.canCancel ? (
                      <>
                        <strong>
                          Free cancellation until {dayParts(done.booking.cancelBy).short} at {CANCEL_TIME}.
                        </strong>{' '}
                        <span>Cancel anytime before then from your booking page or the confirmation email.</span>
                      </>
                    ) : (
                      <>
                        <strong>This booking can&rsquo;t be cancelled for free.</strong>{' '}
                        <span>It&rsquo;s less than {CANCEL_DAYS} days away. To change it, reply to your confirmation email.</span>
                      </>
                    )}
                  </span>
                  <div className={styles.doneActions}>
                    <button
                      type="button"
                      className={styles.outline}
                      onClick={() =>
                        downloadCalendarFile(
                          {
                            uid: done.booking.id,
                            title: item.title,
                            date: done.booking.date,
                            startTime: done.booking.startTime,
                            endTime: done.booking.endTime,
                            location: done.booking.address || facts.city,
                            description: [
                              `${people(done.booking.adults, done.booking.kids)} · hosted by ${host}`,
                              done.booking.checkInInstructions ? `Check-in: ${done.booking.checkInInstructions}` : '',
                              `Your booking: ${window.location.origin}${bookingPageHref(done.booking.id, done.token)}`,
                            ]
                              .filter(Boolean)
                              .join('\n'),
                            url: `${window.location.origin}${bookingPageHref(done.booking.id, done.token)}`,
                          },
                          item.title,
                        )
                      }
                    >
                      Add to Calendar
                    </button>
                    <Link href={bookingPageHref(done.booking.id, done.token)} className={styles.dark}>
                      Manage Booking
                    </Link>
                  </div>
                  <button type="button" className={styles.backLink} onClick={onClose}>
                    Back to Listings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
