// Content for /resources/ (the index of the sports' resources): laid out as a sport's page, as /experiences/.
import type { SportsIndexPage } from './types';
import { mainNav, upload } from './site';
import { sportPages } from './sports';

/** Each sport's line on its band (its resources' categories). */
const SPORT_TEXT: Record<string, string> = {
  'Baseball & Softball': 'Nutrition, injury prevention, mental performance and strength programs for players and parents.',
  Basketball: 'Fueling, recovery, mindset and strength training to play faster, longer and healthier.',
  Esports: 'Nutrition, injury prevention, mental resilience and conditioning for competitive gamers.',
  'Fútbol (Soccer)': 'Diet plans, injury prevention, mental resilience and conditioning for every position.',
  Golfing: 'Nutrition, injury prevention, the mental game and strength programs that protect your swing.',
  Pickleball: 'Recovery, nutrition, mindset and conditioning to keep you on the court.',
};

/** The sports as the Resources menu lists them ("For Basketball"), with their resources page. */
const sports = (mainNav.find((n) => n.href === '/resources/')?.children ?? []).flatMap((link) => {
  const page = sportPages.find((p) => p.section === 'resources' && link.href === `/resources/${p.slug}/`);
  return page ? [{ name: link.label.replace(/^For /, ''), href: link.href, page }] : [];
});

export const resourcesIndex: SportsIndexPage = {
  hero: {
    title: ['RESOURCES'],
    backgroundImage: upload('/2024/03/CLP-Photos-Recovery.png'),
    backgroundColor: '#0a0a0a',
    height: 'fullscreen',
    scrollArrow: true,
  },
  // A quote from each sport's page (its first).
  quotes: sports.flatMap((s) => s.page.quotes.slice(0, 1)),
  // A band per sport: its resources page's photo, name, line and "Learn More".
  sports: sports.map((s) => ({
    title: `${s.name.toUpperCase()} RESOURCES`,
    text: SPORT_TEXT[s.name] ?? '',
    image: s.page.hero.backgroundImage,
    cta: { label: 'Learn More', href: s.href },
  })),
  // The sports' resources pages ask about experiences; these are about the resources (as the listing pages work).
  faq: {
    title: "CLP RESOURCES FAQ's",
    items: [
      {
        question: 'What resources does CLP offer?',
        answer:
          'Dieting and nutrition, injury prevention and recovery, mental health and resilience, and strength and conditioning programs for every sport, plus jobs and internships and product reviews.',
      },
      {
        question: 'Who provides them?',
        answer:
          'Sports dietitians, physical therapists, athletic trainers, sport psychologists, counselors and strength coaches. CLP Partners are verified, and licensed or certified providers are marked on their listing.',
      },
      {
        question: 'What do the CLP Partner, Sponsored and Community labels mean?',
        answer:
          'CLP Partners are verified and book on CLP. Sponsored listings are paid placements and are always labeled. Community listings come from public information and link to the provider’s own page.',
      },
      {
        question: 'How do I book a session?',
        answer:
          'Open a listing: CLP Partner listings have Book Now to book on CLP, and other listings link to the provider’s own registration.',
      },
      {
        question: 'Are resources only for athletes?',
        answer: 'No. Parents, coaches and teams use them too, from youth players to pros.',
      },
      {
        question: 'How can I list my practice or program?',
        answer:
          'Use “Run a Program?” at the bottom of any resources category to claim your free Community listing, sponsor a listing or apply to become a CLP Partner.',
      },
    ],
    viewAll: { label: 'VIEW ALL', href: 'https://faq.competelikepros.com/', newTab: true },
  },
};
