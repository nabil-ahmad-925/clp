// Content for /experiences/ (the index of sport experiences): laid out as a sport's page, from the sports' own pages.
import type { SportsIndexPage } from './types';
import type { SportTile } from '@/components/sections/SportTiles';
import { upload } from './site';
import { sportPages } from './sports';


const tile = (title: string, image: string, href: string, wide?: boolean): SportTile => ({
  title,
  subtitle: 'EXPERIENCES',
  image: upload(image),
  cta: { label: 'Learn More', href },
  wide,
});

/** The sports' tiles (the original index's two rows): the photos and links of the sports' bands below. */
const experienceTiles: SportTile[][] = [
  [
    tile('BASEBALL & SOFTBALL', '/2024/03/Baseball-Action.png', '/experiences/baseball/'),
    tile('BASKETBALL', '/2024/03/Basketball-Action.png', '/experiences/basketball-2/', true),
    tile('ESPORTS', '/2024/03/Esports-Action.png', '/experiences/esports/', true),
  ],
  [
    tile('FÚTBOL (SOCCER)', '/2024/03/Futobl-Action.png', '/experiences/futbol/', true),
    tile('TENNIS & PICKLEBALL', '/2024/03/Pickleball-Action.png', '/experiences/tennis-picklebal/'),
    tile('GOLFING', '/2024/03/Golf-Action.png', '/experiences/golfing/', true),
  ],
];

/** Each sport's line on its band. */
const SPORT_TEXT: Record<string, string> = {
  'BASEBALL & SOFTBALL': 'Camps, clinics, leagues and trips for every level, from first-timers to travel-ball veterans.',
  BASKETBALL: 'Tournaments, camps, private lessons and pickup runs to play, learn and compete.',
  ESPORTS: 'Tournaments, training and private coaching to level up your competitive gaming.',
  'FÚTBOL (SOCCER)': 'Clinics, camps, leagues and tournaments that challenge your game on and off the ball.',
  'TENNIS & PICKLEBALL': 'Lessons, leagues, trips and open play for players of every level.',
  GOLFING: 'Lessons, leagues, clinics and trips to sharpen your swing and your mental game.',
};

const sportsPages = sportPages.filter((p) => p.section === 'experiences');

export const experiencesIndex: SportsIndexPage = {
  hero: {
    title: ['EXPERIENCES'],
    backgroundImage: upload('/2024/03/1704218043632-1.jpg'),
    backgroundColor: '#0a0a0a',
    height: 'fullscreen',
    scrollArrow: true,
  },
  // A quote from each sport's page (its first).
  quotes: sportsPages.flatMap((p) => p.quotes.slice(0, 1)),
  // A band per sport, as a sport page has a band per category.
  sports: experienceTiles.flat().map((t) => ({
    title: `${t.title} EXPERIENCES`,
    text: SPORT_TEXT[t.title] ?? '',
    image: t.image,
    cta: { label: 'Learn More', href: t.cta.href },
  })),
  // Each sport's first question (what it offers), with the FAQ site's link.
  faq: {
    title: "CLP EXPERIENCES FAQ's",
    items: sportsPages.flatMap((p) => p.faq.items.slice(0, 1)),
    viewAll: { label: 'VIEW ALL', href: '/faq/experiences/' },
  },
};
