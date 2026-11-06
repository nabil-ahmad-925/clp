'use client';

import { useState, type FormEvent } from 'react';
import type { EntryTerms } from '@/content/teamEntry';
import { enterIndividual, messageOf, type EnteredIndividual } from '@/content/tournament';
import { isMinor } from './entryRules';
import { money } from './format';
import s from './steps.module.css';

type Props = { widgetId: string; listingId: string; terms: EntryTerms; invite?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLANK = { name: '', born: '', email: '', phone: '', guardianName: '', guardianEmail: '', website: '' };

/** One person entering: into the free-agent pool of a division, or an individual event like a skills challenge. */
export default function IndividualEntry({ widgetId, listingId, terms, invite }: Props) {
  const events = terms.individualEvents ?? [];
  const firstPick = terms.freeAgents ? 'pool' : (events[0]?.id ?? '');
  const [pick, setPick] = useState(firstPick);
  const [divisionId, setDivisionId] = useState(terms.divisions.length === 1 ? terms.divisions[0].id : '');
  const [form, setForm] = useState(BLANK);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<EnteredIndividual | null>(null);
  const set = (key: keyof typeof BLANK) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const born = Number(form.born);
  const minor = /^\d{4}$/.test(form.born) && isMinor(born);
  const pool = pick === 'pool';
  const missing = !pick ? 'Pick what to enter.' : pool && !divisionId ? 'Pick a division.' : !form.name.trim() ? 'Enter the name.' : !/^\d{4}$/.test(form.born) ? 'Enter the birth year.' : !EMAIL.test(form.email.trim()) ? 'Enter a valid e-mail address.' : minor && (!form.guardianName.trim() || !EMAIL.test(form.guardianEmail.trim())) ? 'Add a parent or guardian with their e-mail.' : !agreed ? 'Agree to the waiver to enter.' : '';
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError('');
    try {
      setDone(await enterIndividual({ individual: pool ? 'freeAgent' : 'event', widgetId, listingId, tournamentId: terms.tournamentId, divisionId: pool ? divisionId : undefined, eventId: pool ? undefined : pick, name: form.name.trim(), born, email: form.email.trim(), phone: form.phone.trim() || undefined, guardianName: form.guardianName.trim() || undefined, guardianEmail: form.guardianEmail.trim() || undefined, invite, agreed, website: form.website }));
    } catch (err) {
      setError(messageOf(err, 'Could not send your entry.'));
    } finally {
      setSending(false);
    }
  };
  if (done) {
    return (
      <div className={s.panel} role="status">
        <h2 className={s.heading}>You&rsquo;re In</h2>
        <p className={s.intro}>{done.kind === 'event' ? `${done.name} is entered in ${done.eventName}.` : `${done.name} joined the ${done.divisionName} free-agent pool. The organizer reviews it and places them on a team.`}</p>
      </div>
    );
  }
  const field = (key: keyof typeof BLANK, label: string, type = 'text') => (
    <label className={s.field}>
      {label}
      <input className={s.input} type={type} maxLength={200} value={form[key]} onChange={(x) => set(key)(x.target.value)} />
    </label>
  );
  return (
    <form className={s.panel} onSubmit={submit} noValidate>
      <h2 className={s.heading}>Enter As An Individual</h2>
      <div className={s.divisions} role="radiogroup" aria-label="What to enter">
        {terms.freeAgents && (
          <button type="button" role="radio" aria-checked={pool} className={s.division} onClick={() => setPick('pool')}>
            <span className={s.divisionTop}>
              <strong>Free Agent</strong>
            </span>
            <span className={s.divisionLine}>Join the pool. The organizer places you on a team.</span>
            <span className={s.divisionFee}>{terms.playerFee ? money(terms.playerFee) : 'No entry fee'}</span>
          </button>
        )}
        {events.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={pick === x.id} disabled={x.left === 0} className={s.division} onClick={() => setPick(x.id)}>
            <span className={s.divisionTop}>
              <strong>{x.name}</strong>
            </span>
            <span className={s.divisionLine}>{x.left === 0 ? 'Full' : `${x.left} left`}{x.bornFrom || x.bornTo ? ` · Born ${x.bornFrom ?? ''}${x.bornTo ? ` to ${x.bornTo}` : ' or later'}` : ''}</span>
            <span className={s.divisionFee}>{x.price ? money(x.price) : 'Free'}</span>
          </button>
        ))}
      </div>
      {pool && terms.divisions.length > 1 && (
        <label className={s.field}>
          Division
          <select className={s.input} value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
            <option value="">Pick a division</option>
            {terms.divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className={s.fields}>
        {field('name', 'Full name')}
        {field('born', 'Birth year')}
        {field('email', 'E-mail', 'email')}
        {field('phone', 'Phone (optional)', 'tel')}
        {minor && field('guardianName', 'Parent or guardian')}
        {minor && field('guardianEmail', 'Their e-mail', 'email')}
      </div>
      <input tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: -9999 }} value={form.website} onChange={(x) => set('website')(x.target.value)} />
      <label className={s.row}>
        <input type="checkbox" className={s.check} checked={agreed} onChange={(x) => setAgreed(x.target.checked)} />
        <span className={s.rowText}>I agree to the CLP Waiver &amp; Release and Expectations &amp; Commitment.</span>
      </label>
      {error && <p className={s.hint} role="alert">{error}</p>}
      <div className={s.actions}>
        <button type="submit" className={s.small} disabled={Boolean(missing) || sending}>
          {sending ? 'Sending…' : 'Enter'}
        </button>
        <span className={s.hint}>{missing}</span>
      </div>
    </form>
  );
}
