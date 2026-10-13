'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { partnerHref, reviewEligibility, sendReview, type ReviewEligibility } from '@/content/partnerPages';
import s from './bookingReview.module.css';

/**
 * Under a booking (the guest's link): once they were checked in at a CLP Partner's session, they can rate it and write
 * a review (once). It shows on the partner's page as a verified review.
 */
export default function BookingReview({ id, token }: { id: string; token: string }) {
  const [state, setState] = useState<ReviewEligibility | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    reviewEligibility(id, token).then(
      (r) => active && setState(r),
      () => {},
    );
    return () => {
      active = false;
    };
  }, [id, token]);

  if (!state || state.reason === 'not-partner') return null;
  const partner = state.partner;
  const link = partner?.live ? (
    <Link href={partnerHref(partner.slug)} className={s.link}>
      {partner.name}’s page →
    </Link>
  ) : null;

  if (state.review) {
    return (
      <div className={s.box}>
        <span className={s.kicker}>YOUR REVIEW</span>
        <span className={s.stars}>{'★'.repeat(state.review.rating)}</span>
        <span>{state.review.text}</span>
        {link}
      </div>
    );
  }
  if (!state.canReview) return <p className={s.muted}>After your session, once you’re checked in, you can review it here.</p>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setError('Choose a rating.');
    if (!text.trim()) return setError('Write a few words about it.');
    setBusy(true);
    setError('');
    try {
      const r = await sendReview(id, token, rating, text.trim());
      setState({ ...state, canReview: false, reason: 'reviewed', review: r.review });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={s.box} onSubmit={submit}>
      <span className={s.kicker}>HOW WAS IT?</span>
      <strong>Review your session{partner ? ` with ${partner.name}` : ''}</strong>
      <span className={s.picker} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? '' : 's'}`} className={n <= rating ? s.on : ''} onClick={() => setRating(n)}>
            ★
          </button>
        ))}
      </span>
      <textarea className={s.input} rows={4} maxLength={1000} placeholder="What did you like? Anything to improve?" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your review" />
      {error && <span className={s.error}>{error}</span>}
      <button type="submit" className={s.submit} disabled={busy}>
        {busy ? 'Sending…' : 'Post Review'}
      </button>
      <span className={s.muted}>Shown on their page as a verified review, with your first name and initial.</span>
    </form>
  );
}
