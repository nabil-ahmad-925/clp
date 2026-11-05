import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SentApplication } from '@/content/teamEntry';
import s from './summary.module.css';

/** Sent: what happens next, and where to go. */
export default function EntryDone({ sent, organizer, club }: { sent: SentApplication; organizer: string; club: boolean }) {
  const router = useRouter();
  const waiting = sent.status === 'waitlist';
  // Back where they came from (the listing), else home.
  const goBack = () => (window.history.length > 1 ? router.back() : router.push('/'));
  return (
    <div className={s.done} role="status">
      <span className={s.doneKicker}>{waiting ? 'On The Waitlist' : 'Application Sent'}</span>
      <h2 className={s.doneTitle}>
        {sent.teamName} applied to {sent.tournamentName}
      </h2>
      <p className={s.doneText}>
        {sent.divisionName}. {waiting ? `${organizer} offers a spot if one opens and ${club ? 'messages you on CLP' : 'e-mails you'}.` : `${organizer} reviews it and ${club ? 'messages you on CLP' : 'e-mails you'} with their decision.`} Nothing is charged now.
      </p>
      {!club && sent.contactEmail && <p className={s.doneText}>{sent.emailed === false ? `We couldn’t e-mail ${sent.contactEmail} a copy, but your application is in.` : `A copy is on its way to ${sent.contactEmail}.`}</p>}
      {club && <p className={s.doneText}>Follow it under Tournaments in your dashboard.</p>}
      <div className={s.doneActions}>
        <button type="button" className={s.doneLink} onClick={goBack}>
          Back to Listings
        </button>
        <Link className={s.doneLink} href="/">
          Home
        </Link>
      </div>
    </div>
  );
}
