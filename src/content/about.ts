// Content for /about-us/ (the new design's About page), from the original site and the design.
import { homeServices, trustedBy } from './home';
import { mainNav, upload } from './site';
import { sportPages } from './sports';
import { servicePages } from './services';

export const aboutMeta = {
  title: 'About Us | Compete Like Pros™',
  description:
    'CLP is The Game Changer—empowering athletes, creators, and communities through world-class sports, fitness, and entertainment experiences. #LeaveYourFootprints',
};

export const aboutHero = {
  kicker: 'ABOUT COMPETE LIKE PROS™',
  title: 'We Are Game Changers',
  tagline: 'REDEFINE YOUR PURPOSE™',
  hashtag: '#LeaveYourFootprints',
  image: upload('/2024/03/tt.jpg'),
  actions: [
    { label: 'Start a project', href: '#start' },
    { label: 'Explore experiences', href: '/experiences/' },
  ],
};

/** The gold strip under the heading: what CLP has done and is (counts from the site where it has them). */
export const aboutProof = [
  { value: '47+', label: 'States activated (via Soxcessful®)' },
  { value: String(sportPages.filter((p) => p.section === 'experiences').length), label: 'Sports' },
  { value: String(servicePages.length), label: 'Service areas' },
  { value: 'MA SDP', label: 'Certified supplier' },
];

export const aboutWho = {
  kicker: 'WHO WE ARE',
  title: ['Where performance', 'meets purpose'],
  text: 'Compete Like Pros™ empowers athletes, creators and communities through world-class sports, fitness and entertainment experiences. From training and tournaments to brand activations, team gear and recovery programs, we build ecosystems that help talent thrive on and off the field.',
  traits: [
    { name: 'The Creator', text: 'Visionary drive. We imagine what sport can be and build it.' },
    { name: 'The Outlaw', text: 'Fearless edge. We challenge conventions and rewrite the rules.' },
  ],
  closing: 'The result: a brand that opens new paths for anyone ready to rise.',
};

export const aboutMissionVision = [
  {
    kicker: 'OUR MISSION',
    title: 'Redefine what it means to compete.',
    text: 'We create accessible, high-impact experiences that bring out the best in every athlete, brand, creator, coach and community, developing the whole person physically, mentally and creatively.',
    dark: false,
  },
  {
    kicker: 'OUR VISION',
    title: 'Greatness within reach for all.',
    text: 'A world where sport, fitness and entertainment connect people across cultures, skill levels and industries, and every participant has the tools, support and platform to thrive.',
    dark: true,
  },
];

const serviceImage = (name: string) => homeServices.find((s) => s.title.includes(name))?.image ?? '';
const shop = mainNav.find((n) => n.label === 'SHOP');
const firstResources = mainNav.find((n) => n.href === '/resources/')?.children?.[0]?.href ?? '/resources/';

/** "What we do": CLP's five parts, each with a link to it on the site. */
export const aboutPillars = [
  {
    title: 'Brand activations',
    text: 'Experiential campaigns that put brands in the game with real communities.',
    cta: 'Start a project',
    href: '#start',
    image: serviceImage('EVENT'),
  },
  {
    title: 'Commerce & supplies',
    text: 'Team gear, custom merch and event supplies, sold on CLP and every partner store.',
    cta: 'Shop CLP',
    href: shop?.href ?? '/',
    external: Boolean(shop?.external),
    image: serviceImage('FUNDRAISING'),
  },
  {
    title: 'Experiences',
    text: 'Camps, clinics, pickups, leagues and trips, booked in one place.',
    cta: 'Browse experiences',
    href: '/experiences/',
    image: upload('/2024/03/CLP-Photos-Baseball-Camps.png'),
  },
  {
    title: 'Partner pages',
    text: 'Clubs, athletes and creators get a home for bookings, merch, photos and donations.',
    cta: 'Meet our partners',
    href: '/clp-partners/',
    image: upload('/2024/04/CLP-Photos-Advancement.png'),
  },
  {
    title: 'Resources',
    text: 'Nutrition, recovery, mental health, training and jobs from vetted pros.',
    cta: 'Find resources',
    href: firstResources,
    image: serviceImage('NUTRITION') || serviceImage('RECOVERY'),
  },
];

export const howWeWork = {
  kicker: 'HOW WE WORK',
  title: 'Ideate. Plan. Execute.',
  steps: [
    { title: 'We Ideate', text: 'Big ideas start here. We turn your vision into strategy, building concepts that align with your goals and move your audience.' },
    { title: 'We Plan', text: 'Every detail matters. We map every phase, anticipate challenges and build roadmaps that keep projects on track.' },
    { title: 'We Execute', text: 'Plans mean nothing without execution. We bring ideas to life on time, on budget and built to perform.' },
  ],
};

export const aboutServe = {
  kicker: 'WHO WE SERVE',
  title: 'Built for everyone in the game',
  groups: [
    { title: 'Athletes', text: 'Train, compete, get seen' },
    { title: 'Brands', text: 'Activations that connect' },
    { title: 'Cities & orgs', text: 'Community programming' },
    { title: 'Clubs & teams', text: 'Fill rosters, sell merch' },
    { title: 'Coaches & pros', text: 'Grow your practice' },
    { title: 'Creators', text: 'Meet fans, launch collabs' },
    { title: 'Parents', text: 'Safe, vetted programs' },
    { title: 'Schools', text: 'Programs & official stores' },
  ],
};

export const aboutTrusted = {
  kicker: 'TRUSTED BY',
  logos: trustedBy.logos,
  text: 'CLP is powered by Soxcessful®, a Boston-based brand activation and experiential marketing company. As a Massachusetts Supplier Diversity Program certified business, CLP partners with brands, schools and cities to bring sport to more communities.',
};

export const startProject = {
  title: ['Let’s build something', 'worth competing for'],
  text: 'Activations, events, programs or a partner page on CLP. Tell us what you’re planning and we’ll take it from idea to game day.',
  image: upload('/2024/07/Screenshot_203.png'),
  /** Where a project request goes (the site's contact address). */
  email: 'hello@soxcessful.com',
  types: ['Brand activation', 'Event or tournament', 'Program or camp', 'Partner page on CLP', 'Something else'],
};
