import type { Point } from './expectations';

// The parts of /our-expectations/ that follow its "I'm a" switch: the short version, the Always / Never lists, the FAQ
// and the agreement wording. Everything else is the same for everyone (expectations.ts).

export type Audience = 'player' | 'parent' | 'partner';
export const AUDIENCES: Audience[] = ['player', 'parent', 'partner'];

type RoleCopy = { label: string; who: string; short: Point[]; dos: Point[]; donts: Point[] };
const p = (b: string, t: string): Point => ({ b, t });

export const roleCopy: Record<Audience, RoleCopy> = {
  player: {
    label: 'Player',
    who: 'players and families',
    short: [
      p('Show up on time,', 'checked in, with a signed waiver.'),
      p('Respect the host’s call.', 'They run the game and keep it fair.'),
      p('Play hard, play clean.', 'No reckless tackles, no fighting.'),
      p('Zero tolerance', 'for hate, harassment or threats, on the field or online.'),
      p('Keep it on CLP.', 'Book, pay and message through CLP.'),
      p('Speak up.', 'Report anything that feels off. We act within 24 hours.'),
    ],
    dos: [
      p('Arrive 10 minutes early', 'and check in with your ticket or the gate QR.'),
      p('Follow the host’s instructions,', 'including team splits and safety calls.'),
      p('Bring the right gear:', 'cleats or turf shoes, water, a light and a dark shirt.'),
      p('Cancel 24 hours ahead', 'so your spot goes to the waitlist.'),
      p('Look out for each other,', 'especially new players.'),
    ],
    donts: [
      p('Use hateful, abusive or sexual language', 'or gestures, in person or in messages.'),
      p('Play dangerously', 'or keep playing after a host stops the game.'),
      p('Bring alcohol, drugs or weapons', 'to any CLP experience.'),
      p('Record or post other people', 'without asking, and never kids without a release.'),
      p('Pay or arrange sessions off CLP', 'to skip fees or protections.'),
    ],
  },
  parent: {
    label: 'Parent or Guardian',
    who: 'parents and guardians',
    short: [
      p('You book, you’re on the thread.', 'Every message about your child includes you.'),
      p('Hosts are cleared.', 'Coaches who work with kids pass a background check and SafeSport.'),
      p('Check in and check out.', 'Kids only leave with you or an approved pickup.'),
      p('Cheer, don’t coach.', 'Let the coaches coach and the kids play.'),
      p('Photos stay private', 'unless you sign a photo release.'),
      p('Speak up.', 'Report anything that feels off. We act within 24 hours.'),
    ],
    dos: [
      p('Sign waivers and releases before the session', 'so check-in is quick.'),
      p('Drop off and pick up on time,', 'and tell the host if someone else is collecting.'),
      p('Share health info that matters', '(allergies, recent injuries) in the booking.'),
      p('Keep sideline support positive', 'for every player, not just yours.'),
      p('Use CLP Messages', 'to reach coaches and hosts.'),
    ],
    donts: [
      p('Message players who aren’t yours,', 'or ask coaches to message your child directly.'),
      p('Argue with referees or coaches', 'during a session. Talk after, calmly, or report it.'),
      p('Post photos of other kids', 'without their parent’s okay.'),
      p('Leave kids unattended', 'before or after the session.'),
      p('Bring alcohol', 'to youth sessions.'),
    ],
  },
  partner: {
    label: 'Partner or Host',
    who: 'partners and hosts',
    short: [
      p('Safety first, every session.', 'Clear the space, check gear, stop play when needed.'),
      p('Get cleared before you work with kids.', 'Background check and SafeSport for every coach and host.'),
      p('Keep everything on CLP.', 'Bookings, payments and messages stay on the platform.'),
      p('Never message a minor one-on-one.', 'A guardian is always on the thread.'),
      p('Be on time and organized.', 'Start check-in early and follow the session plan.'),
      p('Report incidents within 24 hours.', 'Even small ones. It protects you too.'),
    ],
    dos: [
      p('Keep your listings accurate:', 'dates, ages, prices, location and what to bring.'),
      p('Check everyone in', 'and block anyone without a signed waiver.'),
      p('Welcome every level and background', 'and keep teams balanced.'),
      p('Keep credentials current:', 'insurance, certifications and clearances.'),
      p('Respond to messages and reviews', 'within 2 business days.'),
    ],
    donts: [
      p('Contact participants off CLP', 'or ask for payment outside the platform.'),
      p('Let uncleared staff', 'work with youth sessions.'),
      p('Share participant data', 'or add people to lists they didn’t opt into.'),
      p('Cancel without notice.', 'Use Bookings so everyone is told.'),
      p('Display banners or signs', 'that are offensive, off-topic, block views or are unsafe.'),
    ],
  },
};

/** The FAQ: each question for one role, or for everyone. */
export type RoleFaq = { role: Audience | 'all'; q: string; a: string };
export const roleFaqs: RoleFaq[] = [
  { role: 'player', q: 'What happens if I’m late?', a: 'Check in as soon as you arrive. Once a game has started, the host decides if you can join. If you’re running more than 15 minutes late, message the host from your booking.' },
  { role: 'player', q: 'Can I bring a friend who isn’t booked?', a: 'Yes, if there’s space. They can scan the gate QR, sign the waiver and pay on their phone in about a minute.' },
  { role: 'parent', q: 'How do you keep young athletes safe?', a: 'Every coach and host who works with kids passes a background check and SafeSport training. Messages about your child always include you, kids check out only to you or an approved pickup, and youth photos stay private unless you sign a release.' },
  { role: 'parent', q: 'How will coaches communicate with me?', a: 'Through CLP Messages and session updates by app, email or text, in your preferred language: reminders, field changes and anything you need to sign.' },
  { role: 'partner', q: 'What can operators expect from a CLP partnership?', a: 'A page and store on CLP, bookings and check-in, payouts through Stripe, marketing support and featured placement when you qualify. In return, we ask you to follow everything on this page.' },
  { role: 'partner', q: 'How do you support community engagement for athletes?', a: 'We help partners run open play, clinics and events, connect them with local brands and facilities, and promote their sessions to the CLP community.' },
  { role: 'all', q: 'How do I report a concern?', a: 'Use “Report a concern” on this page, in any message thread, or from your booking. You can stay anonymous. We respond to safety reports within 24 hours.' },
  { role: 'all', q: 'Are banners and signs allowed?', a: 'Yes, if they support the event. Anything obscene, offensive, unrelated to the event, view-blocking or dangerous isn’t allowed at CLP experiences, in person or online.' },
];

/** The role's questions, then everyone's, matching every word of `query` (case and accents aside). */
export function faqsFor(role: Audience, query: string) {
  const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = fold(query.trim()).split(/\s+/).filter(Boolean);
  return roleFaqs.filter((f) => (f.role === role || f.role === 'all') && words.every((w) => fold(`${f.q} ${f.a}`).includes(w)));
}

/** The agreement band's wording for the role. */
export const agreeCopy = (role: Audience) =>
  role === 'partner'
    ? { text: 'I’ve read the Expectations & Commitment and agree to follow them as a CLP partner or host.', note: 'Saved to your partner agreement with the date and version.' }
    : { text: 'I’ve read the Expectations & Commitment and agree to follow them.', note: 'Saved to your CLP account. We’ll only ask again when this page changes.' };
