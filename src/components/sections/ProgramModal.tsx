'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FieldSelect from '@/components/ui/FieldSelect';
import { BUDGETS, YEARS, requestApplication, type ApplicationConfirmation, type ApplicationKind } from '@/content/applications';
import claimOptions from '@/content/data/claimOptions.json';
// The new design's form popup, as "Claim this listing" (ClaimModal).
import styles from './ClaimModal.module.css';

type Props = {
  kind: ApplicationKind;
  /** The listing page's category and menu ("Dieting & Nutrition", "resources"), sent with the form. */
  category?: string;
  section?: 'experiences' | 'resources';
  onClose: () => void;
};

/** The roles a person picks from (one list with the claim form and the API). */
const ROLES = claimOptions.roles.map((r) => ({ value: r, label: r }));
const BUDGET_OPTIONS = BUDGETS.map((b) => ({ value: b, label: b }));
const YEAR_OPTIONS = YEARS.map((y) => ({ value: y, label: y }));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+().\-\s]{5,40}$/;

/** Each form's words: its heading, what happens next and its confirmation. */
const FORMS: Record<
  ApplicationKind,
  { kicker: string; title: string; text: string; message: string; authorize: string; submit: string; hint: string; doneKicker: string; doneTitle: string; done: (email: ReactNode) => ReactNode }
> = {
  community: {
    kicker: 'COMMUNITY LISTING · FREE',
    title: 'Claim Your Listing',
    text: 'Tell us which program is yours. CLP finds its listing, checks you run it and hands it over, so you can keep its details accurate, add photos and link to your own registration.',
    message: 'How can we verify you run this program? (optional)',
    authorize: 'I’m authorized to manage this program’s listing on behalf of the organization.',
    submit: 'Submit Claim',
    hint: 'CLP reviews every claim before handing a listing over, usually within 2 business days.',
    doneKicker: 'CLAIM SUBMITTED',
    doneTitle: 'We’ll Verify Your Claim',
    done: (email) => <>CLP checks that you run the program, then emails {email} to hand the listing over.</>,
  },
  sponsored: {
    kicker: 'SPONSORED PLACEMENT · PAID',
    title: 'Sponsor a Listing',
    text: 'Boost a camp, clinic or league to the top of category pages, in the featured strip and the results. Tell us what to promote and where; CLP replies with dates and pricing.',
    message: 'Anything else we should know? (optional)',
    authorize: 'I’m authorized to promote this program on behalf of the organization.',
    submit: 'Request Sponsorship',
    hint: 'Sponsored placements are always labeled as sponsored. CLP usually replies within 2 business days.',
    doneKicker: 'REQUEST SENT',
    doneTitle: 'We’ll Be in Touch',
    done: (email) => <>CLP emails {email} with the available dates and pricing for your placement.</>,
  },
  partner: {
    kicker: 'CLP PARTNER · BY INVITATION',
    title: 'Apply to Partner',
    text: 'A full partner page, with bookings, check-in and payments through CLP. Tell us about your program; CLP reviews every application and invites its partners.',
    message: 'Why do you want to partner with CLP? (optional)',
    authorize: 'I’m authorized to apply on behalf of the organization.',
    submit: 'Submit Application',
    hint: 'CLP reviews every application, usually within 5 business days.',
    doneKicker: 'APPLICATION SUBMITTED',
    doneTitle: 'Thanks for Applying',
    done: (email) => <>CLP reviews your program and emails {email} with the next steps.</>,
  },
};

const EMPTY = { name: '', email: '', organization: '', role: '', phone: '', website: '', message: '', listing: '', city: '', promote: '', cities: '', dates: '', budget: '', programs: '', years: '', credentials: '' };

/**
 * A "Run a program?" card's form popup (a listing page): Claim Your Listing (a free Community listing), Sponsor a
 * Listing (a paid placement) or Apply to Partner. Who the person is and their organization, then the form's own
 * questions; sent to the applications API, which keeps it and e-mails CLP. The confirmation shows its reference. Esc,
 * the close button or a click outside closes it (not while it is sending).
 */
export default function ProgramModal({ kind, category, section, onClose }: Props) {
  const copy = FORMS[kind];
  const [form, setForm] = useState(EMPTY);
  const [authorized, setAuthorized] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [sent, setSent] = useState<ApplicationConfirmation | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Scroll locked behind it, Esc closes it, focus starts in it (once: the parent's re-renders don't move the focus).
  // While the form is being sent it stays open.
  const closeRef = useRef(onClose);
  const sendingRef = useRef(false);
  useEffect(() => {
    closeRef.current = () => !sendingRef.current && onClose();
    sendingRef.current = sending;
  });
  useEffect(() => {
    document.body.classList.add('menu-open');
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const required = (value: string, message: string) => (!value.trim() ? message : '');
  const errors = {
    name: required(form.name, 'Enter your name.'),
    email: !EMAIL.test(form.email.trim()) ? 'Enter a valid work email.' : '',
    organization: required(form.organization, 'Enter the organization or program.'),
    role: !form.role ? 'Choose your role.' : '',
    phone: form.phone.trim() && !PHONE.test(form.phone.trim()) ? 'Enter the phone number with digits only.' : '',
    city: kind !== 'sponsored' ? required(form.city, 'Enter the city.') : '',
    promote: kind === 'sponsored' ? required(form.promote, 'Enter the camp, clinic or league to promote.') : '',
    cities: kind === 'sponsored' ? required(form.cities, 'Enter the cities to target.') : '',
    programs: kind === 'partner' ? required(form.programs, 'Tell us about the programs you run.') : '',
    authorized: !authorized ? 'Confirm you’re authorized to act for the organization.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || sending) return;
    setSending(true);
    setFailure('');
    const value = (key: keyof typeof form) => form[key].trim() || undefined;
    try {
      setSent(
        await requestApplication({
          kind,
          page: window.location.pathname,
          category: category || undefined,
          section,
          name: form.name.trim(),
          email: form.email.trim(),
          organization: form.organization.trim(),
          role: form.role,
          phone: value('phone'),
          website: value('website'),
          message: value('message'),
          authorized,
          ...(kind === 'community' && { listing: value('listing'), city: value('city') }),
          ...(kind === 'sponsored' && { promote: value('promote'), cities: value('cities'), dates: value('dates'), budget: value('budget') }),
          ...(kind === 'partner' && { city: value('city'), programs: value('programs'), years: value('years'), credentials: value('credentials') }),
        }),
      );
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Could not send the form. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const error = (key: keyof typeof errors) =>
    tried && errors[key] ? (
      <span className={styles.fieldError} role="alert">
        {errors[key]}
      </span>
    ) : null;
  const input = (key: keyof typeof form & keyof typeof errors, label: string, extra: { max: number; autoComplete?: string; wide?: boolean }) => (
    <label className={`${styles.field} ${extra.wide ? styles.wide : ''}`}>
      {label}
      <input
        className={styles.input}
        autoComplete={extra.autoComplete ?? 'off'}
        maxLength={extra.max}
        value={form[key]}
        onChange={set(key)}
        aria-invalid={tried && Boolean(errors[key])}
      />
      {error(key)}
    </label>
  );
  const optional = (key: keyof typeof form, label: string, max: number, wide = false) => (
    <label className={`${styles.field} ${wide ? styles.wide : ''}`}>
      {label}
      <input className={styles.input} autoComplete="off" maxLength={max} value={form[key]} onChange={set(key)} />
    </label>
  );
  const select = (key: 'role' | 'budget' | 'years', label: string, options: { value: string; label: string }[]) => (
    <div className={styles.field}>
      <span>{label}</span>
      <FieldSelect
        label={label}
        className={styles.input}
        value={form[key]}
        options={options}
        invalid={key === 'role' && tried && Boolean(errors.role)}
        onChange={(v) => setForm({ ...form, [key]: v })}
      />
      {key === 'role' && error('role')}
    </div>
  );

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={copy.title} tabIndex={-1}>
        <button type="button" className={styles.close} aria-label="Close" disabled={sending} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {sent ? (
          <div className={styles.layout}>
            <div className={styles.body}>
              <div className={styles.stack}>
                <span className={styles.doneKicker}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {copy.doneKicker}
                </span>
                <span className={styles.title}>{copy.doneTitle}</span>
                <span className={styles.text}>{copy.done(<strong>{sent.email}</strong>)}</span>
                <span className={styles.reference}>
                  Reference <strong>{sent.id.replace(/^ap-/, '').slice(0, 8).toUpperCase()}</strong>
                </span>
              </div>
            </div>
            <div className={styles.footer}>
              <button type="button" className={styles.primary} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.layout} onSubmit={submit} noValidate>
            <div className={styles.body}>
              <div className={styles.stack}>
                <span className={styles.kicker}>{copy.kicker}</span>
                <span className={styles.title}>{copy.title}</span>
                <span className={styles.text}>{copy.text}</span>

                <div className={styles.fields}>
                  {input('name', 'Full name', { max: 120, autoComplete: 'name' })}
                  <label className={styles.field}>
                    Work email
                    <input
                      className={styles.input}
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      value={form.email}
                      onChange={set('email')}
                      aria-invalid={tried && Boolean(errors.email)}
                    />
                    {error('email')}
                  </label>
                  {input('organization', 'Organization or program', { max: 200, autoComplete: 'organization' })}
                  {select('role', 'Your role', ROLES)}
                  <label className={styles.field}>
                    Phone (optional)
                    <input
                      className={styles.input}
                      type="tel"
                      autoComplete="tel"
                      maxLength={40}
                      value={form.phone}
                      onChange={set('phone')}
                      aria-invalid={tried && Boolean(errors.phone)}
                    />
                    {error('phone')}
                  </label>
                  <label className={styles.field}>
                    Website or social page (optional)
                    <input className={styles.input} type="url" inputMode="url" placeholder="https://" maxLength={300} value={form.website} onChange={set('website')} />
                  </label>

                  {kind === 'community' && (
                    <>
                      {optional('listing', 'Your listing on CLP: name or link (optional)', 300)}
                      {input('city', 'City', { max: 120, autoComplete: 'address-level2' })}
                    </>
                  )}
                  {kind === 'sponsored' && (
                    <>
                      {input('promote', 'Camp, clinic or league to promote', { max: 200, wide: true })}
                      {input('cities', 'Cities to target', { max: 300 })}
                      {optional('dates', 'Preferred dates (optional)', 120)}
                      {select('budget', 'Monthly budget (optional)', BUDGET_OPTIONS)}
                    </>
                  )}
                  {kind === 'partner' && (
                    <>
                      {input('city', 'City', { max: 120, autoComplete: 'address-level2' })}
                      {select('years', 'Running for (optional)', YEAR_OPTIONS)}
                      <label className={`${styles.field} ${styles.wide}`}>
                        Programs you run
                        <textarea
                          className={styles.input}
                          rows={3}
                          maxLength={1000}
                          placeholder="Camps, clinics, lessons, leagues… and who they’re for"
                          value={form.programs}
                          onChange={set('programs')}
                          aria-invalid={tried && Boolean(errors.programs)}
                        />
                        {error('programs')}
                      </label>
                      {optional('credentials', 'Licenses or certifications (optional)', 500, true)}
                    </>
                  )}

                  <label className={`${styles.field} ${styles.wide}`}>
                    {copy.message}
                    <textarea className={styles.input} rows={3} maxLength={1000} value={form.message} onChange={set('message')} />
                  </label>
                </div>

                <label className={styles.check}>
                  <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} />
                  <span className={styles.box} aria-hidden />
                  <span>{copy.authorize}</span>
                </label>
                {error('authorized')}
              </div>
            </div>
            {/* Always in view under the form. */}
            <div className={styles.footer}>
              {failure && (
                <span className={styles.fieldError} role="alert">
                  {failure}
                </span>
              )}
              <button type="submit" className={styles.primary} disabled={sending}>
                {sending ? 'Sending…' : copy.submit}
              </button>
              <span className={styles.hint}>{copy.hint}</span>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
