// Content for /partnerships/ (the "Partnerships · category directory" design).

export const partnershipsMeta = {
  title: 'PARTNERSHIPS - Compete Like Pros™',
  description: 'The clubs, coaches and brands behind CLP. Every partner has a page on CLP where you can book sessions, shop their store, see their photos and videos, and message them.',
};

export const partnershipsHero = {
  eyebrow: 'PARTNERSHIPS',
  title: 'The clubs, coaches and brands behind CLP.',
  blurb: 'Every partner has a page on CLP where you can book sessions, shop their store, see their photos and videos, and message them.',
};

/** Under the partners' results: their offers can link out. */
export const partnershipsDisclaimer =
  'Some partner offers link to the partner’s own website, where their privacy and security policies apply. CLP may earn a commission on some purchases and isn’t responsible for third-party content or products.';

/** "Ways to partner with CLP": who applies (the switch), their questions, what they get and the application's partner type. */
export type PartnerWay = { id: string; label: string; cta: string; partnerType: string; perks: string[]; questions: { q: string; a: string }[] };

export const partnerWays: PartnerWay[] = [
  {
    id: 'athlete',
    label: 'Athletes & creators',
    cta: 'Apply as an athlete',
    partnerType: 'athlete',
    perks: ['Your own page with bio, photos and videos', 'Paid appearances, clinics and brand deals', 'A merch store, no inventory needed', 'Content with CLP events and partners'],
    questions: [
      {
        q: 'Who can partner as an athlete?',
        a: 'Athletes who love sports and entertainment and want to promote the game, take part in events and work with CLP on initiatives, from current pros to local creators.',
      },
      { q: 'How do brand deals work?', a: 'Brands find you through your page. Offers come through CLP Messages, and you choose what to accept.' },
      { q: 'Do I need a big following?', a: 'No. We look for people who show up for their community. Your page grows with every event.' },
    ],
  },
  {
    id: 'brand',
    label: 'Brands',
    cta: 'Apply as a brand',
    partnerType: 'brand',
    perks: ['Sponsorships and co-branded events', 'Product collaborations and testing', 'Digital campaigns across CLP channels', 'Reporting on reach and sales'],
    questions: [
      { q: 'What partnership options do brands have?', a: 'Sponsorships, co-branded events, product collaborations and digital marketing across CLP experiences and channels.' },
      { q: 'Can we offer discounts to CLP members?', a: 'Yes. Member discounts show on your page and in the CLP Shop, and you see how many were used.' },
      {
        q: 'Can we be featured?',
        a: 'Featured spots on the home page and this page are picked by CLP each month. Paid placement at the top of sport pages is also available.',
      },
    ],
  },
  {
    id: 'operator',
    label: 'Clubs, coaches & facilities',
    cta: 'Apply as an operator',
    partnerType: 'club',
    perks: ['Bookings, check-in and payouts', 'A page and your own store', 'Messages and session updates', 'Help filling sessions and fields'],
    questions: [
      {
        q: 'What can owners and trainers do with CLP?',
        a: 'Experienced owners and trainers run training programs, clinics and workshops, create content and coach at CLP events, all booked and paid through CLP.',
      },
      {
        q: 'Do coaches working with kids need clearance?',
        a: 'Yes. Every coach or host on a youth session passes a background check and SafeSport training before the session goes live.',
      },
      { q: 'What does it cost?', a: 'No monthly fee to start. CLP takes a small fee on bookings and store sales, shown before you go live.' },
    ],
  },
  {
    id: 'org',
    label: 'Schools & organizations',
    cta: 'Apply as an organization',
    partnerType: 'org',
    perks: ['Host events and programs with CLP', 'Volunteer and service hours', 'Fundraising through your store', 'A page for your community'],
    questions: [
      { q: 'Which organizations can partner?', a: 'Schools, clubs, community centers and nonprofits that want to promote the sport, host events and build programs.' },
      { q: 'Can students volunteer or get service hours?', a: 'Yes. Volunteer shifts are posted on your page and hours are tracked for students and members.' },
      { q: 'Can we raise money through CLP?', a: 'Yes. Sell custom merch from your store and run fundraising events with tickets on CLP.' },
    ],
  },
];
