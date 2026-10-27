import type { SubscribeInput } from '@/content/subscriptions';
import type { Channel } from './consentText';

/**
 * The Subscribe window's form (the "Partner page: Follow & Contact settings" handoff, Oct 26) and its rules, kept out of
 * the components: who it's for, the topics, the names, how to reach them and the boxes. The button names the first
 * thing missing until everything is done.
 */
export type Who = 'self' | 'child';
export type SubscribeFormState = {
  who: Who;
  childName: string;
  topics: string[];
  firstName: string;
  lastName: string;
  /** The channel toggles (only shown with the CLP SMS add-on; without it, email is the only one). */
  email: boolean;
  sms: boolean;
  emailAddress: string;
  phone: string;
  agree: { age: boolean; email: boolean; sms: boolean };
  clp: boolean;
};

export const TOPICS = [
  { id: 'sessions', title: 'New sessions & events', line: 'Pickup, clinics and socials', summary: 'new sessions & events' },
  { id: 'drops', title: 'Drops & deals', line: 'New merch and member discounts', summary: 'drops & deals' },
  { id: 'news', title: 'Updates & News', line: 'Stories and announcements', summary: 'Updates & News' },
  { id: 'jobs', title: 'Jobs & volunteering', line: 'New roles and ways to help', summary: 'jobs & volunteering' },
];

// As the API checks it (clp-api shared/subscriptions.mjs).
const EMAIL_RE = /^[^\s@#]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
/** A US mobile number: 10 digits, or 11 starting with 1. */
export const validPhone = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 || (d.length === 11 && d.startsWith('1'));
};

/** The form as it opens: for themself, the first two topics, email on, every box unticked. */
export const initialForm = (prefill: { firstName?: string; lastName?: string; email?: string } = {}): SubscribeFormState => ({
  who: 'self',
  childName: '',
  topics: ['sessions', 'drops'],
  firstName: prefill.firstName ?? '',
  lastName: prefill.lastName ?? '',
  email: true,
  sms: false,
  emailAddress: prefill.email ?? '',
  phone: '',
  agree: { age: false, email: false, sms: false },
  clp: false,
});

/** The channels picked: email only without the SMS add-on. */
export const channelsOf = (f: SubscribeFormState, smsAddon: boolean): Channel[] => (smsAddon ? (['email', 'sms'] as const).filter((c) => f[c]) : ['email']);

/** Switching who it's for clears the age box (its wording changes) and the child's name. */
export const switchWho = (f: SubscribeFormState, who: Who): SubscribeFormState => (who === f.who ? f : { ...f, who, childName: '', agree: { ...f.agree, age: false } });

/** The first thing missing, in the handoff's order ('' when ready). */
export function missingItem(f: SubscribeFormState, smsAddon: boolean): string {
  const channels = channelsOf(f, smsAddon);
  if (!f.topics.length) return 'Pick at least one topic';
  if (!f.firstName.trim() || !f.lastName.trim()) return 'Add your first and last name';
  if (f.who === 'child' && !f.childName.trim()) return 'Add the child’s first name';
  if (!channels.length) return 'Pick email or text';
  if (channels.includes('email') && !EMAIL_RE.test(f.emailAddress.trim())) return 'Add your email';
  if (channels.includes('sms') && !validPhone(f.phone)) return 'Add your mobile number';
  if (!f.agree.age || channels.some((c) => !f.agree[c])) return 'Check the boxes to agree';
  return '';
}

/** "You'll get new sessions & events, drops & deals by email and text." (for a child: "… for Leo from SAE …"). */
export function summaryOf(topics: string[], channels: Channel[], child: string, short: string) {
  const list = TOPICS.filter((t) => topics.includes(t.id)).map((t) => t.summary).join(', ');
  const ways = channels.map((c) => (c === 'sms' ? 'text' : 'email')).join(' and ');
  return `You’ll get ${list}${child ? ` for ${child} from ${short}` : ''} by ${ways}.`;
}

/** What the API takes. `clp`: the CLP box ticked, for the channels it showed. */
export const toInput = (f: SubscribeFormState, smsAddon: boolean, pageUrl: string, website: string): SubscribeInput => {
  const channels = channelsOf(f, smsAddon);
  return {
    who: f.who,
    childName: f.who === 'child' ? f.childName.trim() : '',
    topics: f.topics,
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    channels,
    email: channels.includes('email') ? f.emailAddress.trim() : '',
    phone: channels.includes('sms') ? f.phone.trim() : '',
    agree: { age: f.agree.age, ...Object.fromEntries(channels.map((c) => [c, f.agree[c]])) },
    clp: f.clp,
    pageUrl,
    website,
  };
};
