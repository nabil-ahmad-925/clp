'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import ListingHero from '@/components/sections/ListingHero';
import { WAIVER_URL } from '@/content/documents';
import { bookingPageHref, claimWaitlistSpot, fetchWaitlistPlace, forgetPlace, leaveWaitlist, savedPlaces, type WaitlistPlace } from '@/content/listings';
import styles from './GuestBooking.module.css';

/** The site's Waiver & Release (as in the footer) and Expectations & Commitment pages, as the booking popup's. */
const WAIVER = WAIVER_URL;
const EXPECTATIONS = '/our-expectations/';
const longDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const clock = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const dollars = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
/** "Oct 21, 3:40 PM ET". */
const ends = (iso: string) => `${new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET`;
const left = (iso: string, now: number) => {
  const m = Math.max(0, Math.round((Date.parse(iso) - now) / 6e4));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

const STATUS: Record<WaitlistPlace['status'], { label: (w: WaitlistPlace) => string; className: string }> = {
  waiting: { label: (w) => `You’re #${w.position ?? 1} on the waitlist`, className: styles.requested },
  offered: { label: () => 'A spot is held for you', className: styles.confirmed },
  booked: { label: () => 'Booked from the waitlist', className: styles.confirmed },
  expired: { label: () => 'Your time to book ended', className: styles.cancelled },
  removed: { label: () => 'Off the waitlist', className: styles.cancelled },
  left: { label: () => 'You left the waitlist', className: styles.cancelled },
  closed: { label: () => 'This day has passed', className: styles.cancelled },
};

type State = { status: 'loading' } | { status: 'invalid' } | { status: 'error'; message: string } | { status: 'ready'; place: WaitlistPlace };

/**
 * Their place on a sold-out day's waitlist, opened from their waitlist e-mails (/booking/?waitlist=…&token=…): their
 * place in line, the spots held for them (with the time left) and booking them (who's coming and the waiver, as the
 * booking popup), or leaving the line.
 */
export default function GuestWaitlist({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !token) return;
    let active = true;
    fetchWaitlistPlace(id, token).then(
      (place) => active && setState(place ? { status: 'ready', place } : { status: 'invalid' }),
      (err) => active && setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load your place in line.' }),
    );
    return () => {
      active = false;
    };
  }, [id, token, attempt]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const current: State = !id || !token ? { status: 'invalid' } : state;
  // The card on the listing pages forgets a place that's over.
  const over = current.status === 'ready' && !['waiting', 'offered'].includes(current.place.status);
  useEffect(() => {
    if (!over) return;
    const saved = Object.entries(savedPlaces()).find(([, p]) => p.id === id);
    if (saved) forgetPlace(saved[0]);
  }, [over, id]);

  const leave = async () => {
    setBusy(true);
    setError('');
    try {
      setState({ status: 'ready', place: await leaveWaitlist(id, token) });
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave the waitlist.');
    } finally {
      setBusy(false);
    }
  };
  // Booked from it: their booking page (the claim answers with it).
  const openBooking = async () => {
    setBusy(true);
    try {
      const r = await claimWaitlistSpot(id, token, { adults: 0, kids: 0, waiver: false });
      router.push(bookingPageHref(r.booking.id, r.token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open your booking.');
      setBusy(false);
    }
  };

  return (
    <>
      <ListingHero title={['Your waitlist']} blurb={current.status === 'ready' ? current.place.listingTitle : undefined} />
      <div className={styles.page} data-header-tone="dark">
        <div className={styles.card}>
          {current.status === 'loading' && (
            <p className={styles.muted} role="status">
              Loading your place in line…
            </p>
          )}
          {current.status === 'invalid' && (
            <div className={styles.stack}>
              <span className={styles.title}>This Link Isn&rsquo;t Valid</span>
              <p className={styles.muted}>Open the link from your latest waitlist e-mail, or reply to that e-mail to reach the host.</p>
              <Link href="/experiences/" className={styles.secondary}>
                Browse Experiences
              </Link>
            </div>
          )}
          {current.status === 'error' && (
            <div className={styles.stack}>
              <p className={styles.error} role="alert">
                {current.message}
              </p>
              <button type="button" className={styles.secondary} onClick={() => setAttempt((n) => n + 1)}>
                Try Again
              </button>
            </div>
          )}
          {current.status === 'ready' && (
            <div className={styles.stack}>
              <span className={`${styles.badge} ${STATUS[current.place.status].className}`}>{STATUS[current.place.status].label(current.place)}</span>
              <span className={styles.title}>{current.place.listingTitle}</span>
              {current.place.listingSubtitle && <span className={styles.muted}>Hosted by {current.place.listingSubtitle}</span>}
              <dl className={styles.facts}>
                <dt>When</dt>
                <dd>
                  {longDay(current.place.date)}
                  {current.place.startTime ? ` · ${clock(current.place.startTime)}${current.place.endTime ? ` – ${clock(current.place.endTime)}` : ''}` : ''}
                </dd>
                <dt>Spots</dt>
                <dd>
                  {current.place.people}
                  {current.place.partial && current.place.people > 1 ? ', or fewer if that’s all that opens' : ''}
                </dd>
                {current.place.position && (
                  <>
                    <dt>In line</dt>
                    <dd>#{current.place.position}</dd>
                  </>
                )}
                <dt>Name</dt>
                <dd>
                  {current.place.name} · {current.place.email}
                </dd>
              </dl>

              {current.place.status === 'waiting' && (
                <p className={styles.muted}>
                  {current.place.mode === 'all'
                    ? 'When a spot opens, we email everyone on the waitlist. The first to book gets it.'
                    : current.place.mode === 'pick'
                      ? `When a spot opens, the host picks who gets it. If it’s you, we email you and you have ${current.place.claimHours ?? 2} hours to book.`
                      : `When a spot opens, we email you and you have ${current.place.claimHours ?? 2} hours to book before it goes to the next person.`}{' '}
                  Nothing is charged.
                </p>
              )}
              {current.place.status === 'offered' && current.place.offerExpiresAt && (
                <p className={styles.muted}>
                  <strong>
                    {current.place.offeredSpots === 1 ? '1 spot is' : `${current.place.offeredSpots} spots are`} held for you until {ends(current.place.offerExpiresAt)} ({left(current.place.offerExpiresAt, now)} left).
                  </strong>{' '}
                  Book before then or it goes to the next person.
                </p>
              )}
              {(current.place.status === 'offered' || (current.place.status === 'waiting' && current.place.mode === 'all')) && (
                <ClaimForm
                  place={current.place}
                  onBooked={(bookingId, bookingToken) => router.push(bookingPageHref(bookingId, bookingToken))}
                  onEnded={() => setAttempt((n) => n + 1)}
                  id={id}
                  token={token}
                />
              )}
              {current.place.status === 'expired' && <p className={styles.muted}>The spot went to the next person. Nothing was charged.</p>}
              {current.place.status === 'booked' && (
                <button type="button" className={styles.secondary} disabled={busy} onClick={openBooking}>
                  {busy ? 'Opening…' : 'See Your Booking'}
                </button>
              )}
              {(current.place.status === 'waiting' || current.place.status === 'offered') &&
                (confirming ? (
                  <div className={styles.confirm} role="group" aria-label="Leave the waitlist?">
                    <span className={styles.confirmText}>Leave the waitlist? You lose your place in line{current.place.status === 'offered' ? ' and the spot held for you goes to the next person' : ''}.</span>
                    <div className={styles.actions}>
                      <button type="button" className={styles.danger} disabled={busy} onClick={leave}>
                        {busy ? 'Leaving…' : 'Yes, Leave It'}
                      </button>
                      <button type="button" className={styles.secondary} disabled={busy} onClick={() => setConfirming(false)}>
                        Stay in Line
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={styles.secondary} onClick={() => setConfirming(true)}>
                    Leave the Waitlist
                  </button>
                ))}
              {!['waiting', 'offered', 'booked'].includes(current.place.status) && (
                <Link href="/experiences/" className={styles.secondary}>
                  Find Another Experience
                </Link>
              )}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Booking the held (or open) spots: who's coming within them, the listing's age rule and the waiver. */
function ClaimForm({ place, id, token, onBooked, onEnded }: { place: WaitlistPlace; id: string; token: string; onBooked: (id: string, token: string) => void; onEnded: () => void }) {
  const most = place.status === 'offered' ? (place.offeredSpots ?? place.people) : place.people;
  const policy = place.ages;
  const [adults, setAdults] = useState(policy.kind === 'youth' ? 0 : Math.min(most, 1));
  const [kids, setKids] = useState(policy.kind === 'youth' ? Math.min(most, 1) : 0);
  const [ageOk, setAgeOk] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [waiver, setWaiver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const count = adults + kids;
  const per = place.pricePer ?? null;
  const missing =
    count < 1
      ? 'Add at least one person.'
      : policy.kind === 'adult' && !ageOk
        ? `Confirm everyone is ${policy.minAge} or older.`
        : kids > 0 && !guardian
          ? 'Confirm you’re the parent or guardian.'
          : !waiver
            ? 'Agree to the waiver to continue.'
            : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await claimWaitlistSpot(id, token, {
        adults,
        kids,
        waiver,
        guardian: kids > 0 ? guardian : undefined,
        ageConfirmed: policy.kind === 'adult' ? ageOk : undefined,
      });
      onBooked(r.booking.id, r.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book your spot.');
      if ((err as { status?: number }).status === 410) onEnded();
      setBusy(false);
    }
  };

  const counter = (label: string, value: number, set: (n: number) => void, disabled: boolean) => (
    <div className={styles.counterRow}>
      <span>{label}</span>
      <span className={styles.counter}>
        <button type="button" aria-label={`Remove one: ${label}`} disabled={disabled || value <= 0} onClick={() => set(value - 1)}>
          −
        </button>
        <span aria-live="polite">{value}</span>
        <button type="button" aria-label={`Add one: ${label}`} disabled={disabled || count >= most} onClick={() => set(value + 1)}>
          +
        </button>
      </span>
    </div>
  );
  const check = (on: boolean, set: (v: boolean) => void, children: ReactNode) => (
    <label className={styles.checkRow}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span>{children}</span>
    </label>
  );

  return (
    <form className={styles.claim} onSubmit={submit} noValidate>
      <span className={styles.claimTitle}>Who&rsquo;s Coming?</span>
      <span className={styles.muted}>
        Up to {most} {most === 1 ? 'person' : 'people'}
        {per != null && per > 0 ? ` · ${dollars(per)} per person, paid to the host` : ''}
      </span>
      {counter(policy.kind === 'adult' ? `Adults (${policy.minAge}+)` : 'Adults (18+)', adults, setAdults, policy.kind === 'youth')}
      {counter('Kids (under 18)', kids, setKids, policy.kind === 'adult')}
      {policy.kind === 'adult' && check(ageOk, setAgeOk, <>Everyone in my group is {policy.minAge} or older and will bring a valid photo ID.</>)}
      {kids > 0 && check(guardian, setGuardian, <>I&rsquo;m the parent or legal guardian of every minor in my group, and I&rsquo;m booking on their behalf.</>)}
      {check(
        waiver,
        setWaiver,
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
        </>,
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={Boolean(missing) || busy}>
        {busy ? 'Booking…' : place.status === 'offered' ? 'Book My Spot' : 'Book If a Spot Is Open'}
      </button>
      <span className={styles.muted}>{missing || 'No payment online: you pay the host directly.'}</span>
    </form>
  );
}
