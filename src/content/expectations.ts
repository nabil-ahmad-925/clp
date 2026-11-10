// Content for /our-expectations/ (the Expectations & Commitment handoff, Oct 15, 2026). The per-role copy is in
// expectationsRoles.ts. The policy wording still needs CLP's final legal review.

/** Bump with clp-api shared/expectations.mjs EXPECTATIONS_VERSION: everyone is asked to agree again. */
export const EXPECTATIONS_VERSION = '2.0';
export const EXPECTATIONS_UPDATED = 'Oct 15, 2026';

export const expectationsMeta = {
  title: 'Expectations & Commitment - Compete Like Pros™',
  description:
    'What you can count on from CLP, and what we ask of everyone who plays, hosts or cheers at a CLP experience, in person or online.',
};

export const expectationsHero = {
  eyebrow: 'EXPECTATIONS & COMMITMENT',
  title: 'Safe, fair and fun for everyone.',
  blurb: 'What you can count on from CLP, and what we ask of everyone who plays, hosts or cheers at a CLP experience, in person or online.',
  meta: `3 minute read · Updated ${EXPECTATIONS_UPDATED} · Version ${EXPECTATIONS_VERSION}`,
};

/** A line with its bold lead ("Show up on time," + "checked in, with a signed waiver."). */
export type Point = { b: string; t: string };
/** An expandable row. */
export type Row = { q: string; a: string };
export type LadderStep = { t: string; d: string; color: string };

export type SectionId = 'short' | 'promise' | 'side' | 'event' | 'safety' | 'rules' | 'faq';
/** The sections in reading order. `sub` names the reader where it says {who}. */
export const SECTIONS: { id: SectionId; title: string; sub: string }[] = [
  { id: 'short', title: 'The Short Version', sub: 'The six things that matter most for {who}.' },
  { id: 'promise', title: 'Our Promise', sub: 'What you can count on from CLP, every time.' },
  { id: 'side', title: 'Your Side', sub: 'What we ask of {who}.' },
  { id: 'event', title: 'At Every Event', sub: 'The basics for every game, clinic, event and livestream.' },
  { id: 'safety', title: 'Safety & Reporting', sub: 'See something? Say something. Anyone can report, and you can stay anonymous.' },
  { id: 'rules', title: 'If Rules Are Broken', sub: 'Most things are fixed with a conversation. Safety issues can skip straight to removal.' },
  { id: 'faq', title: 'FAQ', sub: 'Quick answers for {who} and everyone.' },
];

export const promises: Row[] = [
  { q: 'Cleared coaches and hosts', a: 'Anyone who works with kids passes a background check and SafeSport training, and is re-checked on a schedule.' },
  { q: 'Safe messaging', a: 'Youth messages always include a parent or guardian. Phone numbers and emails stay private on both sides.' },
  { q: 'Your photos, your choice', a: 'Youth photos stay private unless a parent signs a release. Ask us to remove any photo of you.' },
  { q: 'Honest reviews', a: 'Only people who attended, or parents with a member account, can leave a review.' },
  { q: 'Secure payments, clear refunds', a: 'Checkout is handled by CLP. Cancellation and refund rules are shown before you pay.' },
  { q: 'Real people, fast answers', a: 'Questions answered within 1 business day. Safety reports within 24 hours.' },
];

export const eventRules: Row[] = [
  { q: 'Banners & signs', a: 'Welcome if they support the event. Nothing obscene, offensive, unrelated to the event, view-blocking or dangerous, in person or online.' },
  { q: 'Alcohol and drugs', a: 'Not allowed at CLP experiences, and never at youth sessions. Some 21+ events may allow alcohol where the venue is licensed.' },
  { q: 'Weapons', a: 'Not allowed, of any kind, at any CLP experience.' },
  { q: 'The right gear', a: 'Cleats or turf shoes for the surface. Shin guards for youth sessions.' },
  { q: 'Being on time', a: 'Arrive 10 minutes early to check in. Late arrivals join at the host’s call.' },
  { q: 'Weather', a: 'Hosts make the call for safety. Lightning means everyone off the field for 30 minutes.' },
  { q: 'Pets', a: 'Leashed pets on the sidelines only where the venue allows. Never on the field.' },
  { q: 'Leave it better', a: 'Take your trash and follow the venue’s rules.' },
];

export const safetySteps: Point[] = [
  { b: 'Tell us what happened.', t: 'Use “Report a concern”, a message thread or your booking. Add photos if you have them.' },
  { b: 'We respond within 24 hours.', t: 'Our Trust & Safety team reviews every report. Urgent ones go first.' },
  { b: 'We follow up.', t: 'We’ll tell you what we did, unless sharing would put someone at risk.' },
];

export const ladder: LadderStep[] = [
  { t: 'Reminder', d: 'A friendly note from the host or CLP about what went wrong.', color: '#8A6F33' },
  { t: 'Warning', d: 'A written warning on your account.', color: '#C77D1F' },
  { t: 'Removal', d: 'Removed from a session or event, without a refund.', color: '#B03A2E' },
  { t: 'Suspension or ban', d: 'Suspended or banned from CLP. Partners may lose their listing and page.', color: '#5E1621' },
];

export const APPEAL_LINE = 'Think we got it wrong? Reply to the decision email within 14 days and someone new on the CLP team will review it.';

/** Where "Report a concern" and "ask us" go (CLP support; the e-mail app opens with the subject written). */
export const SAFETY_EMAIL = 'support@competelikepros.com';
