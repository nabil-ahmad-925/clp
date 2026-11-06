'use client';

import { useState, type FormEvent } from 'react';
import { reserveTrip, type Reservation, type TripPlan } from '@/content/trip';
import styles from '../BookingModal.module.css';

type Props = { widgetId: number; listingId: string; plan: TripPlan; onBack: () => void; onClose: () => void };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLANK = { name: '', born: '', email: '', phone: '', emergencyName: '', emergencyPhone: '', note: '', guardianName: '', guardianEmail: '', website: '' };

const YEAR = /^(19|20)\d{2}$/;
const minorBorn = (born: string) => YEAR.test(born) && new Date().getFullYear() - Number(born) < 18;

function missingFrom(form: typeof BLANK, under18: boolean, agreed: boolean) {
  if (!form.name.trim()) return 'Enter the traveler’s name.';
  if (!YEAR.test(form.born)) return 'Enter the traveler’s birth year.';
  if (!EMAIL.test(form.email.trim())) return 'Enter a valid email address.';
  if (!form.emergencyName.trim() || !form.emergencyPhone.trim()) return 'Add an emergency contact.';
  if (under18 && !form.guardianName.trim()) return 'Enter the parent or guardian’s name.';
  if (under18 && !EMAIL.test(form.guardianEmail.trim())) return 'Enter the parent or guardian’s email.';
  return agreed ? '' : 'Agree to the waiver to continue.';
}

const dayOf = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Reserve one person's spot: who's going and who to call. The host is told and e-mails how to pay. */
export default function TripReserve({ widgetId, listingId, plan, onBack, onClose }: Props) {
  const [form, setForm] = useState(BLANK);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Reservation | null>(null);
  const set = (key: keyof typeof BLANK) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const under18 = minorBorn(form.born);
  const missing = missingFrom(form, under18, agreed);
  const full = plan.left === 0;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError('');
    try {
      setDone(await reserveTrip({ widgetId: String(widgetId), listingId, ...form, born: Number(form.born), agreed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reserve your spot.');
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
  const check = (on: boolean, change: (v: boolean) => void, words: string) => (
    <label className={styles.check}>
      <input type="checkbox" checked={on} onChange={(x) => change(x.target.checked)} />
      <span className={styles.box} aria-hidden />
      <span>{words}</span>
    </label>
  );
  if (done) {
    const waiting = done.status === 'waitlist';
    return (
      <div className={styles.step}>
        <div className={styles.body} data-scroll>
          <div className={styles.done}>
            <span className={styles.doneKicker}>{waiting ? 'ON THE WAITLIST' : 'SPOT HELD'}</span>
            <span className={styles.doneTitle}>{waiting ? 'You’re On The List' : 'Your Spot Is Held'}</span>
            <span className={styles.doneText}>
              {waiting ? `${plan.organizerName} contacts you if a spot opens up.` : `A $${plan.deposit.toLocaleString('en-US')} deposit is due by ${dayOf(done.depositDue ?? '')}. ${plan.organizerName} contacts you about how to pay.`}
              {done.emailed ? '' : ' We couldn’t send your confirmation email, so keep this page or note the date.'}
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
          <div className={styles.section}>
            <span className={styles.label}>Who&rsquo;s Going</span>
            <div className={styles.fields}>
              {field('name', 'Full name')}
              {field('born', 'Birth year')}
              {field('email', 'Email', 'email')}
              {field('phone', 'Phone (optional)', 'tel')}
            </div>
            <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(x) => set('website')(x.target.value)} />
          </div>
          <div className={styles.section}>
            <span className={styles.label}>Emergency Contact</span>
            <div className={styles.fields}>
              {field('emergencyName', 'Name')}
              {field('emergencyPhone', 'Phone', 'tel')}
            </div>
          </div>
          {under18 && (
            <div className={styles.fields}>
              {field('guardianName', 'Parent or guardian’s name')}
              {field('guardianEmail', 'Parent or guardian’s email', 'email')}
            </div>
          )}
          <label className={`${styles.field} ${styles.fieldWide}`}>
            Anything the host should know? (optional)
            <textarea className={styles.input} rows={2} maxLength={1000} value={form.note} onChange={(x) => set('note')(x.target.value)} />
          </label>
          {check(agreed, setAgreed, 'I agree to the CLP Waiver & Release and Expectations & Commitment.')}
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </div>
      <div className={styles.footer}>
        <button type="submit" className={styles.primary} disabled={Boolean(missing) || sending}>
          {sending ? 'Sending…' : full ? 'Join The Waitlist' : 'Reserve My Spot'}
        </button>
        <span className={styles.hint}>{missing || 'One person per reservation. Nothing is charged here.'}</span>
      </div>
    </form>
  );
}
