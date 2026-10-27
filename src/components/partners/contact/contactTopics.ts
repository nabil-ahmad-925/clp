/**
 * Contact's six topics (the "Partner page: Follow & Contact settings" handoff, Oct 26): each card's title and line,
 * then its form's help line, fields, message placeholder, rule box, button and what happens next. The API checks the
 * same fields and options (clp-api shared/contact.mjs).
 */
export type TopicId = 'session' | 'order' | 'partner' | 'press' | 'jobs' | 'other';
export type ContactOption = { value: string; label: string; listingId?: string };
export type ContactField = { id: string; label: string } & ({ kind: 'select'; options: ContactOption[] } | { kind: 'text'; placeholder: string; max: number; required: boolean });
export type ContactTopic = {
  id: TopicId;
  label: string;
  line: string;
  help: string;
  fields: ContactField[];
  placeholder: string;
  rule: string;
  /** A member topic: needs a CLP account (signed out, the button signs in first). Else it goes to CLP Partnerships. */
  member: boolean;
  /** The button of a topic that goes to CLP (member topics: Send Message or Sign In to Send). */
  clpCta: string;
  after: string;
};

const select = (id: string, label: string, values: string[]): ContactField => ({ id, label, kind: 'select', options: values.map((v) => ({ value: v, label: v })) });
const text = (id: string, label: string, placeholder: string, max: number, required = false): ContactField => ({ id, label, kind: 'text', placeholder, max, required });

/** The topics for a partner: its short name, its live experiences ("Which one?") and its open roles ("Which role?"). */
export function contactTopics(short: string, experiences: { id: string; title: string }[], roles: { title: string }[]): ContactTopic[] {
  const adult = 'For adults with a CLP member account. Under 18? Ask a parent or guardian to reach out. Your email and phone stay private.';
  const viaClp = `Goes to the CLP Partnerships team, who manage partnerships for ${short}. Your contact details stay with CLP.`;
  const member = { member: true, rule: adult, clpCta: '' };
  return [
    {
      id: 'session',
      label: 'A session or experience',
      line: 'Questions before you book, or about one you booked',
      help: `Ask about a session or event. Already booked? Message ${short} from your booking so they have your details.`,
      fields: [{ id: 'experience', label: 'Which one?', kind: 'select', options: [...experiences.map((e) => ({ value: e.title, label: e.title, listingId: e.id })), { value: 'Something not listed', label: 'Something not listed' }] }],
      placeholder: 'Hi! Do you run a women’s-only session?',
      after: `${short} usually replies within 1 day. You’ll get the answer in CLP Messages.`,
      ...member,
    },
    {
      id: 'order',
      label: `An order from the ${short} store`,
      line: 'Sizing, shipping, returns or a problem',
      help: `Add your order number so ${short} can find it right away. Orders are made and shipped by CLP.`,
      fields: [text('orderNumber', 'Order number', '#1042', 30), select('need', 'What do you need help with?', ['Sizing or exchange', 'Where’s my order?', 'Return or refund', 'Damaged or wrong item', 'Something else'])],
      placeholder: `Tell ${short} what happened.`,
      after: `${short} and the CLP store team will see this with your order details. Most order questions are answered within 1 day.`,
      ...member,
    },
    {
      id: 'partner',
      label: 'Partnership or sponsorship',
      line: 'Brands, facilities, clubs and creators · handled by CLP',
      help: `Tell us who you are and what you’d like to do with ${short}. The CLP Partnerships team works out the details with you and brings ${short} in when it’s a fit.`,
      fields: [
        text('company', 'Your company, club or name', 'e.g. Your brand', 120, true),
        select('kind', 'What kind of partnership?', ['Sponsorship', 'Event or activation', 'Content or a video', 'Product test', 'Something else']),
        select('when', 'When?', ['This month', 'In the next 3 months', 'Later this year', 'Not sure yet']),
      ],
      placeholder: `Who you are, what you’d like to do with ${short}, and your timing.`,
      rule: viaClp,
      member: false,
      clpCta: 'Send to CLP Partnerships',
      after: `The CLP Partnerships team has your request and will reply within 2 business days in CLP Messages. We’ll keep ${short} in the loop.`,
    },
    {
      id: 'press',
      label: 'Press, writing or content',
      line: 'An interview, article, guest post or shoot · handled by CLP',
      help: `Writing about ${short}, want to contribute to their Updates & News, or planning a shoot? CLP coordinates press and content for ${short}.`,
      fields: [
        text('outlet', 'Outlet or your name', 'e.g. Your publication', 120, true),
        select('work', 'What are you working on?', ['Article or interview', `Guest post for ${short} Updates & News`, 'Photo or video shoot', 'Podcast', 'Something else']),
        text('deadline', 'Deadline', 'e.g. Nov 1', 60),
      ],
      placeholder: `Tell us about the story and what you need from ${short}.`,
      rule: viaClp,
      member: false,
      clpCta: 'Send to CLP',
      after: 'CLP has your request and will reply within 2 business days in CLP Messages. Photos of players under 18 need a parent’s release.',
    },
    {
      id: 'jobs',
      label: 'Jobs or volunteering',
      line: 'A role you saw, or helping at an event',
      help: 'Ask about a role before you apply, or offer to help. To apply, use “View & Apply” on the Jobs tab.',
      fields: [select('role', 'Which role?', [...roles.map((r) => r.title), 'General interest'])],
      placeholder: 'A little about you and your question.',
      after: `${short}’s hiring team will see this in CLP Messages.`,
      ...member,
    },
    {
      id: 'other',
      label: 'Something else',
      line: 'Anything that doesn’t fit above',
      help: `Ask ${short} anything.`,
      fields: [],
      placeholder: `Your question for ${short}.`,
      after: `${short} usually replies within 1 day in CLP Messages.`,
      ...member,
    },
  ];
}

/** The button: a CLP topic's own, else Send Message signed in and Sign In to Send signed out. */
export const ctaOf = (topic: ContactTopic, signedIn: boolean) => topic.clpCta || (signedIn ? 'Send Message' : 'Sign In to Send');

/** A topic's starting answers: each drop-down's first option, text fields empty. */
export const firstAnswers = (topic: ContactTopic): Record<string, string> =>
  Object.fromEntries(topic.fields.map((f) => [f.id, f.kind === 'select' ? (f.options[0]?.value ?? '') : '']));
