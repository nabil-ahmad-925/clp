import Link from 'next/link';
import { WAIVER_URL } from '@/content/documents';
import type { EntryTerms } from '@/content/teamEntry';
import { reviewTimeline } from './reviewTimeline';
import type { EntryDraftState } from './useEntryDraft';
import s from './steps.module.css';

/** Step 5: what happens after applying, the contact details (when not signed in as a partner) and the agreement. */
export default function ReviewStep({ terms, entry }: { terms: EntryTerms; entry: EntryDraftState }) {
  const { draft, update, club } = entry;
  const setContact = (key: keyof typeof draft.contact, value: string) => update({ contact: { ...draft.contact, [key]: value } });
  return (
    <>
      <h2 className={s.heading}>Review and Apply</h2>
      <p className={s.intro}>{club ? 'After you apply, this is what happens. You can follow it under Tournaments in your dashboard.' : 'After you apply, this is what happens. Every update comes by e-mail.'}</p>
      <ol className={s.timeline}>
        {reviewTimeline(terms, club, entry.playerCount, entry.division).map((t, i) => (
          <li key={t.what}>
            <span className={s.dot}>{i + 1}</span>
            <span>
              <span className={s.rowTitle}>{t.what}</span>
              <span className={s.rowSub}>{t.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      {!club && (
        <div className={s.fields}>
          <label className={s.field}>
            Your name
            <input className={s.input} autoComplete="name" maxLength={120} value={draft.contact.name} onChange={(e) => setContact('name', e.target.value)} />
          </label>
          <label className={s.field}>
            E-mail
            <input className={s.input} type="email" autoComplete="email" maxLength={200} value={draft.contact.email} onChange={(e) => setContact('email', e.target.value)} />
          </label>
          <label className={s.field}>
            Phone (optional)
            <input className={s.input} type="tel" autoComplete="tel" maxLength={40} value={draft.contact.phone} onChange={(e) => setContact('phone', e.target.value)} />
          </label>
          <label className={`${s.field} ${s.wide}`}>
            Anything the organizer should know? (optional)
            <textarea className={s.input} rows={2} maxLength={1000} value={draft.notes} onChange={(e) => update({ notes: e.target.value })} />
          </label>
          {/* Not for people: bots fill it in. */}
          <input className={s.trap} tabIndex={-1} autoComplete="off" aria-hidden value={draft.website} onChange={(e) => update({ website: e.target.value })} />
        </div>
      )}
      <label className={s.agree}>
        <input type="checkbox" className={s.check} checked={draft.agreed} onChange={(e) => update({ agreed: e.target.checked })} />
        <span>
          I agree to the CLP{' '}
          <a href={WAIVER_URL} target="_blank" rel="noopener">
            Waiver &amp; Release
          </a>{' '}
          and{' '}
          <Link href="/our-expectations/" target="_blank">
            Expectations &amp; Commitment
          </Link>
          , and I&rsquo;m applying with my team&rsquo;s and their guardians&rsquo; agreement.
        </span>
      </label>
    </>
  );
}
