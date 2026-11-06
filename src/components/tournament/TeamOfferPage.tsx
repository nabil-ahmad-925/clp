'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { answerOffer, fetchOffer, messageOf, type SpotOffer } from '@/content/tournament';
import PageHero from '@/components/sections/PageHero';
import s from './tournament.module.css';

const when = (at: string) => new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** A waitlisted team's link: take the freed spot or pass. Whoever takes it is checked again before it's confirmed. */
export default function TeamOfferPage() {
  const params = useSearchParams();
  const id = params.get('offer') ?? '';
  const owner = params.get('owner') ?? '';
  const token = params.get('token') ?? '';
  const [offer, setOffer] = useState<SpotOffer | null>(null);
  const [error, setError] = useState('');
  const [answered, setAnswered] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetchOffer(id, owner, token).then(
      (o) => active && setOffer(o),
      (err) => active && setError(messageOf(err, 'This offer isn’t open any more.')),
    );
    return () => {
      active = false;
    };
  }, [id, owner, token]);
  const answer = async (a: 'accept' | 'decline') => {
    setBusy(true);
    setError('');
    try {
      await answerOffer(id, owner, token, a);
      setAnswered(a);
    } catch (err) {
      setError(messageOf(err, 'Could not save your answer.'));
    } finally {
      setBusy(false);
    }
  };
  if (answered) {
    return (
      <>
        <PageHero title={[answered === 'accept' ? 'You Took The Spot' : 'Thanks For Letting Us Know']} height={300} backgroundColor="#0a0a0a" />
        <main className={s.page}>
          <p>{answered === 'accept' ? `${offer?.organizerName} checks your roster and documents again, then confirms it.` : 'The spot goes to the next team.'}</p>
        </main>
      </>
    );
  }
  if (!offer) return <><PageHero title={[error ? 'Offer Closed' : 'Your Spot Offer']} height={300} backgroundColor="#0a0a0a" /><main className={s.page}>{error ? <p role="alert">{error}</p> : <p role="status">Loading…</p>}</main></>;
  return (
    <>
    <PageHero title={['A Spot Opened Up']} height={300} backgroundColor="#0a0a0a" />
    <main className={s.page}>
      <p>
        {offer.teamName} can take a spot in {offer.divisionName} at {offer.tournamentName}. This offer ends {when(offer.expiresAt)}.
      </p>
      {offer.deposit > 0 && <p className={s.muted}>A ${offer.deposit} deposit is due. Nothing is charged here: {offer.organizerName} tells you how to pay.</p>}
      {error && <p role="alert">{error}</p>}
      <button type="button" className={s.cta} disabled={busy} onClick={() => answer('accept')}>
        Take The Spot
      </button>
      <button type="button" className={`${s.cta} ${s.ghost}`} disabled={busy} onClick={() => answer('decline')}>
        Pass
      </button>
    </main>
    </>
  );
}
