'use client';

import { useState, type FormEvent } from 'react';
import { bookService, type ServiceBooking as Booked, type ServicePlan } from '@/content/service';
import styles from '../BookingModal.module.css';
import ServiceSlotPicker, { type Slot } from './ServiceSlotPicker';

type Props = { widgetId: number; listingId: string; plan: ServicePlan; onBack: () => void; onClose: () => void };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const YEAR = /^(19|20)\d{2}$/;
const BLANK = { name: '', born: '', email: '', phone: '', guardianName: '', note: '', website: '' };
const minorBorn = (born: string) => YEAR.test(born) && new Date().getFullYear() - Number(born) < 18;

function missingFrom(plan: ServicePlan, slot: Slot | null, form: typeof BLANK, agreed: boolean) {
  if (plan.kind !== 'pack' && !slot?.time) return plan.kind === 'group' ? 'Pick a session.' : 'Pick a day and a time.';
  if (!form.name.trim()) return 'Enter the name of who it’s for.';
  if (!YEAR.test(form.born)) return 'Enter their birth year.';
  const minor = minorBorn(form.born);
  if (minor && !form.guardianName.trim()) return 'Enter the parent or guardian’s name.';
  if (!EMAIL.test(form.email.trim())) return minor ? 'Enter the parent or guardian’s email.' : 'Enter a valid email address.';
  return agreed ? '' : 'Agree to the waiver and the cancellation rules to book.';
}

/**
 * Book a coach's service: when (a 1:1's open time or a small group's session; a pack has no date), who it's for (a
 * parent books for an under-18) and the waiver. It lands on the coach's Appointments at once and the family is e-mailed.
 */
export default function ServiceBooking({ widgetId, listingId, plan, onBack, onClose }: Props) {
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState(BLANK);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Booked | null>(null);
  const set = (key: keyof typeof BLANK) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const minor = minorBorn(form.born);
  const missing = missingFrom(plan, slot, form, agreed);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError('');
    try {
      setDone(await bookService({ widgetId: String(widgetId), listingId, ...(slot ?? {}), ...form, guardianName: minor ? form.guardianName : undefined, born: Number(form.born), agreed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book this.');
    } finally {
      setSending(false);
    }
  };
  const field = (key: keyof typeof BLANK, label: string, type = 'text') => (
    <label className={styles.field}>
      {label}
      <input className={styles.input} type={type} maxLength={200} value={form[key]} onChange={(x) => set(key)(x.target.value)} />
    </label>
  );
  if (done) {
    return (
      <div className={styles.step}>
        <div className={styles.body} data-scroll>
          <div className={styles.done}>
            <span className={styles.doneKicker}>{plan.kind === 'pack' ? 'PACK RESERVED' : 'YOU’RE BOOKED'}</span>
            <span className={styles.doneTitle}>{done.service}</span>
            <span className={styles.doneText}>
              {done.when ? `${done.when} with ${plan.providerName}. ` : ''}
              {plan.kind === 'pack' ? `${plan.providerName} gets in touch about paying, then you book sessions with it.` : plan.price ? `It’s paid to ${plan.providerName} on the day.` : 'It’s free.'}
              {done.emailed ? ` A confirmation went to ${done.email}.` : ' We couldn’t send your confirmation email, so keep this page or note the time.'}
            </span>
          </div>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.primary} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }
  return (
    <form className={styles.step} onSubmit={submit} noValidate>
      <div className={styles.body} data-scroll>
        <div className={styles.stack}>
          <button type="button" className={styles.back} onClick={onBack}>
            <span className="glyph" aria-hidden>←</span> Back to Details
          </button>
          {plan.kind !== 'pack' && <ServiceSlotPicker plan={plan} value={slot} onChange={setSlot} />}
          <div className={styles.section}>
            <span className={styles.label}>Who It&rsquo;s For</span>
            <div className={styles.fields}>
              {field('name', 'Full name')}
              {field('born', 'Birth year')}
              {minor && field('guardianName', 'Parent or guardian’s name')}
              {field('email', minor ? 'Parent or guardian’s email' : 'Email', 'email')}
              {field('phone', 'Phone (optional)', 'tel')}
            </div>
            <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(x) => set('website')(x.target.value)} />
          </div>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            Anything the coach should know? (optional)
            <textarea className={styles.input} rows={2} maxLength={1000} value={form.note} onChange={(x) => set('note')(x.target.value)} />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={agreed} onChange={(x) => setAgreed(x.target.checked)} />
            <span className={styles.box} aria-hidden />
            <span>I agree to the CLP Waiver &amp; Release and to {plan.providerName}&rsquo;s cancellation rules (free until {plan.freeCancelHours} hours before).</span>
          </label>
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </div>
      <div className={styles.footer}>
        <button type="submit" className={styles.primary} disabled={Boolean(missing) || sending}>
          {sending ? 'Booking…' : plan.kind === 'pack' ? 'Reserve This Pack' : 'Confirm Booking'}
        </button>
        <span className={styles.hint}>{missing || 'Nothing is charged here.'}</span>
      </div>
    </form>
  );
}
