'use client';

import Link from 'next/link';
import BookingReview from '@/components/partners/BookingReview';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ListingHero from '@/components/sections/ListingHero';
import { CANCEL_TIME, cancelGuestBooking, directionsHref, fetchGuestBooking, type BookingConfirmation } from '@/content/listings';
import styles from './GuestBooking.module.css';

const longDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const clock = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const dollars = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const group = (b: BookingConfirmation) =>
  [b.adults ? `${b.adults} adult${b.adults === 1 ? '' : 's'}` : '', b.kids ? `${b.kids} kid${b.kids === 1 ? '' : 's'}` : ''].filter(Boolean).join(' + ');

const STATUS: Record<BookingConfirmation['status'], { label: string; className: string }> = {
  requested: { label: 'Waiting for the host to confirm', className: styles.requested },
  confirmed: { label: 'You’re booked', className: styles.confirmed },
  cancelled: { label: 'Cancelled', className: styles.cancelled },
};

type State = { status: 'loading' } | { status: 'invalid' } | { status: 'error'; message: string } | { status: 'ready'; booking: BookingConfirmation };

/**
 * The guest's booking, opened from their booking e-mails (the link carries a signature of the booking): its status and
 * details, and Cancel booking while free cancellation is open (up to two days before), confirmed in place.
 */
export default function GuestBooking() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!id || !token) return;
    let active = true;
    fetchGuestBooking(id, token).then(
      (booking) => active && setState(booking ? { status: 'ready', booking } : { status: 'invalid' }),
      (err) => active && setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load your booking.' }),
    );
    return () => {
      active = false;
    };
  }, [id, token, attempt]);

  const current: State = !id || !token ? { status: 'invalid' } : state;

  const cancel = async () => {
    if (current.status !== 'ready') return;
    setCancelling(true);
    setCancelError('');
    try {
      setState({ status: 'ready', booking: await cancelGuestBooking(id, token) });
      setConfirming(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel your booking.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <ListingHero title={['Your booking']} blurb={current.status === 'ready' ? current.booking.listingTitle : undefined} />
      <div className={styles.page} data-header-tone="dark">
        <div className={styles.card}>
          {current.status === 'loading' && (
            <p className={styles.muted} role="status">
              Loading your booking…
            </p>
          )}
          {current.status === 'invalid' && (
            <div className={styles.stack}>
              <span className={styles.title}>This Link Isn&rsquo;t Valid</span>
              <p className={styles.muted}>Open the link from your latest booking e-mail, or reply to that e-mail to reach the host.</p>
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
              <span className={`${styles.badge} ${STATUS[current.booking.status].className}`}>
                {current.booking.status === 'cancelled' && current.booking.cancelledBy === 'guest' ? 'Cancelled by you' : STATUS[current.booking.status].label}
              </span>
              <span className={styles.title}>{current.booking.listingTitle}</span>
              {current.booking.listingSubtitle && <span className={styles.muted}>Hosted by {current.booking.listingSubtitle}</span>}
              <dl className={styles.facts}>
                <dt>When</dt>
                <dd>
                  {longDay(current.booking.date)}
                  {current.booking.startTime ? ` · ${clock(current.booking.startTime)}${current.booking.endTime ? ` – ${clock(current.booking.endTime)}` : ''}` : ''}
                </dd>
                <dt>Who</dt>
                <dd>{group(current.booking)}</dd>
                {current.booking.address && (
                  <>
                    <dt>Where</dt>
                    <dd className={styles.where}>
                      {current.booking.address}
                      {current.booking.checkInInstructions && <span className={styles.checkIn}>{current.booking.checkInInstructions}</span>}
                      <a href={directionsHref(current.booking.address)} target="_blank" rel="noopener" className={styles.directions}>
                        Get directions <span className="glyph" aria-hidden>↗</span>
                      </a>
                    </dd>
                  </>
                )}
                <dt>Total</dt>
                <dd>{current.booking.total == null ? 'Set with the host' : current.booking.total === 0 ? 'Free' : `${dollars(current.booking.total)}, paid to the host`}</dd>
                <dt>Name</dt>
                <dd>
                  {current.booking.name} · {current.booking.email}
                </dd>
              </dl>
              {current.booking.status === 'requested' && <p className={styles.muted}>The host confirms your spot by e-mail, with the exact address.</p>}
              {current.booking.status === 'cancelled' ? (
                <Link href="/experiences/" className={styles.secondary}>
                  Find Another Experience
                </Link>
              ) : current.booking.canCancel ? (
                confirming ? (
                  <div className={styles.confirm} role="group" aria-label="Cancel this booking?">
                    <span className={styles.confirmText}>Cancel this booking? Your spots go to someone else, and the host is told.</span>
                    <div className={styles.actions}>
                      <button type="button" className={styles.danger} disabled={cancelling} onClick={cancel}>
                        {cancelling ? 'Cancelling…' : 'Yes, Cancel It'}
                      </button>
                      <button type="button" className={styles.secondary} disabled={cancelling} onClick={() => setConfirming(false)}>
                        Keep My Booking
                      </button>
                    </div>
                    {cancelError && (
                      <p className={styles.error} role="alert">
                        {cancelError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={styles.stack}>
                    <button type="button" className={styles.secondary} onClick={() => setConfirming(true)}>
                      Cancel Booking
                    </button>
                    <span className={styles.muted}>
                      Free cancellation until {longDay(current.booking.cancelBy)} at {CANCEL_TIME}.
                    </span>
                  </div>
                )
              ) : (
                <p className={styles.muted}>
                  Free cancellation ended on {longDay(current.booking.cancelBy)}. To change your booking, reply to your booking e-mail to reach the host.
                </p>
              )}
              {/* Checked in at a CLP Partner's session: a verified review for their page. */}
              {current.booking.status === 'confirmed' && <BookingReview id={id} token={token} />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
