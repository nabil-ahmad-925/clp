import c from '../contact/contact.module.css';
import type { SubscribeFormState } from './subscribeForm';
import u from './subscribe.module.css';

type Props = { form: SubscribeFormState; short: string; smsAddon: boolean; onChange: (patch: Partial<SubscribeFormState>) => void };

/**
 * 2. Your details and how to reach you: first and last name (the parent's for a child, plus the child's first name).
 * With the CLP SMS add-on, Email and Text message toggles (either or both) each with its field; without it, the email.
 */
export default function ReachFields({ form, short, smsAddon, onChange }: Props) {
  const child = form.who === 'child';
  const email = !smsAddon || form.email;
  return (
    <div className={u.section}>
      <strong className={u.sectionTitle}>{child ? 'Your details (parent or guardian)' : 'Your details'}</strong>
      <div className={c.pair}>
        <label className={c.field}>
          First name
          <input maxLength={60} autoComplete="given-name" value={form.firstName} onChange={(e) => onChange({ firstName: e.target.value })} />
        </label>
        <label className={c.field}>
          Last name
          <input maxLength={60} autoComplete="family-name" value={form.lastName} onChange={(e) => onChange({ lastName: e.target.value })} />
        </label>
      </div>
      {child && (
        <label className={c.field}>
          Child’s first name
          <input maxLength={40} autoComplete="off" value={form.childName} onChange={(e) => onChange({ childName: e.target.value })} />
        </label>
      )}
      {smsAddon && (
        <>
          <strong className={u.sectionTitle}>How should {short} reach you?</strong>
          <div className={u.toggles}>
            <button type="button" className={u.toggle} aria-pressed={form.email} onClick={() => onChange({ email: !form.email, agree: { ...form.agree, email: false } })}>
              Email
            </button>
            <button type="button" className={u.toggle} aria-pressed={form.sms} onClick={() => onChange({ sms: !form.sms, agree: { ...form.agree, sms: false } })}>
              Text Message
            </button>
          </div>
        </>
      )}
      {email && (
        <label className={c.field}>
          Email
          <input type="email" maxLength={200} autoComplete="email" placeholder="you@email.com" value={form.emailAddress} onChange={(e) => onChange({ emailAddress: e.target.value })} />
        </label>
      )}
      {smsAddon && form.sms && (
        <label className={c.field}>
          Mobile number
          <input type="tel" maxLength={20} autoComplete="tel" placeholder="(617) 555-0123" value={form.phone} onChange={(e) => onChange({ phone: e.target.value })} />
        </label>
      )}
    </div>
  );
}
