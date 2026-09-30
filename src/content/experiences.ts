// Content for /experiences/ (the index of sport experiences), from the original site.
// Note: the heading and FAQ entries are the placeholder text the live page currently shows.
import type { FaqData, PageHeroData } from './types';
import type { SportTile } from '@/components/sections/SportTiles';
import { upload } from './site';

export const experiencesHero: PageHeroData = {
  title: ['EXPERIENCES'],
  backgroundImage: upload('/2024/03/1704218043632-1.jpg'),
  backgroundColor: '#0a0a0a',
  height: 'fullscreen',
  scrollArrow: true,
};

export const experiencesHeading = 'We Make Beautiful Things';

const tile = (title: string, image: string, href: string, wide?: boolean): SportTile => ({
  title,
  subtitle: 'EXPERIENCES',
  image: upload(image),
  cta: { label: 'Learn More', href },
  wide,
});

export const experienceTiles: SportTile[][] = [
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

const placeholderAnswer =
  'orem ipsum dolor sit amet, consectetur adipiscing elit. In eget bibendum libero. Etiam id velit at enim porttitor facilisis. Vivamus tincidunt lectus at risus pharetra ultrices. In tincidunt turpis at odio dapibus maximus.';

export const experiencesFaq: FaqData = {
  title: "CLP EXPERIENCES FAQ's",
  items: [
    { question: 'What exactly is Salient Service?', answer: placeholderAnswer },
    { question: 'What exactly is Salient Service?', answer: placeholderAnswer },
    { question: 'What exactly is Salient Service?', answer: placeholderAnswer },
    { question: 'Section', answer: '' },
  ],
  viewAll: { label: 'VIEW ALL', href: '#' },
};
