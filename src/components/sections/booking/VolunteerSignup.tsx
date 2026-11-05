'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { fetchOpportunity, sendVolunteerRequest, type Opportunity } from '@/content/volunteer';
import styles from '../BookingModal.module.css';
import ShiftPicker from './ShiftPicker';

type Props = { widgetId: number; listingId: string; host: string; onBack: () => void; onClose: () => void };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLANK = { name: '', email: '', phone: '', note: '', guardianName: '', guardianEmail: '', website: '' };

/** Register on a Volunteering listing: pick a shift, say who you are, and its organizer reviews it. */
export default function VolunteerSignup({ widgetId, listingId, host, onBack, onClose }: Props) {
  const [opportunity, setOpportunity] = useState<Opportunity | null | undefined>(undefined);
  const [failed, setFailed] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [form, setForm] = useState(BLANK);
  const [under18, setUnder18] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => {
    let active = true;
    fetchOpportunity(String(widgetId), listingId).then(
      (o) => active && setOpportunity(o),
      (err: Error) => active && setFailed(err.message),
    );
    return () => {
      active = false;
    };
  }, [widgetId, listingId]);
  const set = (key: keyof typeof BLANK) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const shifts = opportunity?.shifts ?? [];
  const missing =
    shifts.length > 0 && !shiftId
      ? 'Pick a shift.'
      : !form.name.trim()
        ? 'Enter your name.'
        : !EMAIL.test(form.email.trim())
          ? 'Enter a valid email address.'
          : under18 && !form.guardianName.trim()
            ? 'Enter your parent or guardian’s name.'
            : under18 && !EMAIL.test(form.guardianEmail.trim())
              ? 'Enter your parent or guardian’s email.'
              : !agreed
                ? 'Agree to the waiver to continue.'
                : '';
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError('');
    try {
      await sendVolunteerRequest({ widgetId: String(widgetId), listingId, shiftId: shiftId || undefined, ...form, under18, agreed });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request.');
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
  if (sent) {
    return (
      <div className={styles.step}>
        <div className={styles.body} data-scroll>
          <div className={styles.done}>
            <span className={styles.doneKicker}>REQUEST SENT</span>
            <span className={styles.doneTitle}>Thanks For Stepping Up</span>
            <span className={styles.doneText}>{host} reviews your request and emails you with what’s next.</span>
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
          {failed && <span className={styles.error}>{failed}</span>}
          {opportunity === null && <span className={styles.error}>This one isn’t taking volunteers right now.</span>}
          {shifts.length > 0 && <ShiftPicker shifts={shifts} chosen={shiftId} onChoose={setShiftId} />}
          <div className={styles.section}>
            <span className={styles.label}>Your Details</span>
            <div className={styles.fields}>
              {field('name', 'Full name')}
              {field('email', 'Email', 'email')}
              {field('phone', 'Phone (optional)', 'tel')}
            </div>
            <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(x) => set('website')(x.target.value)} />
          </div>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            Why do you want to help? (optional)
            <textarea className={styles.input} rows={2} maxLength={1000} value={form.note} onChange={(x) => set('note')(x.target.value)} />
          </label>
          {check(under18, setUnder18, 'I’m under 18')}
          {under18 && (
            <div className={styles.fields}>
              {field('guardianName', 'Parent or guardian’s name')}
              {field('guardianEmail', 'Parent or guardian’s email', 'email')}
            </div>
          )}
          {check(agreed, setAgreed, 'I agree to the CLP Waiver & Release and Expectations & Commitment.')}
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </div>
      <div className={styles.footer}>
        <button type="submit" className={styles.primary} disabled={Boolean(missing) || sending || opportunity === null || Boolean(failed)}>
          {sending ? 'Sending…' : 'Register'}
        </button>
        <span className={styles.hint}>{missing || `${host} reviews every request.`}</span>
      </div>
    </form>
  );
}
