import Link from 'next/link';
import { channelWords, consentText, type Channel } from './consentText';
import type { SubscribeFormState } from './subscribeForm';
import u from './subscribe.module.css';

type Props = {
  form: SubscribeFormState;
  partnerName: string;
  short: string;
  channels: Channel[];
  /** The chosen channels the signed-in member already gets CLP's updates on (their box isn't shown again). */
  clpAlready: Channel[];
  onChange: (patch: Partial<SubscribeFormState>) => void;
};

/**
 * 3. The consent boxes (required, unticked at first): the age box worded by who it's for, then one per chosen channel.
 * Below a divider, CLP's own optional box for the channels without a CLP consent yet; it never blocks Subscribe.
 */
export default function ConsentBoxes({ form, partnerName, short, channels, clpAlready, onChange }: Props) {
  const agree = (key: keyof SubscribeFormState['agree']) => (e: { target: { checked: boolean } }) => onChange({ agree: { ...form.agree, [key]: e.target.checked } });
  const clpNew = channels.filter((ch) => !clpAlready.includes(ch));
  const clpHad = channels.filter((ch) => clpAlready.includes(ch));
  return (
    <div className={u.section}>
      <div className={u.boxes}>
        <label className={u.box}>
          <input type="checkbox" checked={form.agree.age} onChange={agree('age')} />
          <span>{consentText.age(form.who, form.childName.trim())}</span>
        </label>
        {channels.map((ch) => (
          <label key={ch} className={u.box}>
            <input type="checkbox" checked={form.agree[ch]} onChange={agree(ch)} />
            <span>{consentText[ch](partnerName)}</span>
          </label>
        ))}
        <span className={u.divider} />
        <span className={u.optional}>Optional · Compete Like Pros</span>
        {clpNew.length > 0 && (
          <label className={u.box}>
            <input type="checkbox" checked={form.clp} onChange={(e) => onChange({ clp: e.target.checked })} />
            <span>{consentText.clp(short, clpNew)}</span>
          </label>
        )}
        {clpHad.length > 0 && (
          <span className={u.already}>
            You already get updates from Compete Like Pros by {channelWords(clpHad)}, from when you subscribed to another partner. <Link href="/sign-in/">Manage</Link>
          </span>
        )}
      </div>
      <span className={u.legal}>
        Messages are sent by Compete Like Pros on behalf of {partnerName}. See the <Link href="/terms-conditions/">Terms</Link>, <Link href="/privacy-cookies/">Privacy Policy</Link> and SMS &amp; Email
        Alerts.
      </span>
    </div>
  );
}
