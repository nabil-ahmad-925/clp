import type { FeatureRowData } from '@/components/sections/FeatureRow';
import type { Testimonial } from '@/components/sections/TestimonialSlider';
import type { Logo } from '@/components/home/HomeBands';
import type { PageHeroData } from './types';
import { upload } from './site';

export const homeHero: PageHeroData = {
  title: ['REDEFINE YOUR', 'PURPOSE™'],
  height: 'fullscreen',
  backgroundColor: '#2b2b2b',
  video: upload('/2024/03/clp-video.mp4'),
  textEffect: 'rotate-in',
};

export const homeIntro = {
  statement:
    'Compete Like Pros™ empowers athletes, brands, coaches, creators, fans, influencers, parents, and teams through world-class sports, fitness, and entertainment service management.',
  supporting: 'From pro experiences, supplies and resources, we build pathways for talent to thrive - on and off the field.',
};

export const homeHashtag = '#LEAVEYOURFOOTPRINTS';

const logo = (file: string, alt: string): Logo => ({ src: upload(file), width: 900, height: 255, alt });

export const trustedBy = {
  title: 'TRUSTED BY',
  logos: [
    logo('/2024/03/masachusetts.png', 'Commonwealth of Massachusetts'),
    logo('/2024/03/rsm.png', 'RSM'),
    logo('/2024/03/assumption-university.png', 'Assumption University'),
    logo('/2024/03/city-of-boston.png', 'City of Boston'),
    logo('/2024/03/mit-hacking.png', 'MIT Hacking Medicine'),
    logo('/2024/03/titos.png', "Tito's Handmade Vodka"),
  ],
};

export const homeServices: FeatureRowData[] = [
  {
    title: 'BRAND/PRODUCT DEVELOPMENT',
    text: 'Build a brand that stands out. From identity design to co-branded merchandise, we help athletes, creators, and organizations craft solutions that connect.',
    image: upload('/2024/03/CLP-Photos-Brand-Product-Development.png'),
    cta: { label: 'Learn More', href: '/brand-product-development/' },
  },
  {
    title: 'CONTENT CREATION/LICENSING',
    text: 'Tell your story. We create and license content that captures attention, builds connection, and elevates your presence.',
    image: upload('/2024/03/CLP-Photos-Content-Creation.png'),
    cta: { label: 'Learn More', href: '/content-creation-licensing/' },
  },
  {
    title: 'EVENT/PROJECT MANAGEMENT',
    text: 'Flawless execution. From concept to completion, we plan and manage events and projects that deliver results and leave an impression.',
    image: upload('/2024/03/CLP-Photos-Event-Management.png'),
    cta: { label: 'Learn More', href: '/event-project-management/' },
  },
  {
    title: 'FUNDRAISING/RETAILING',
    text: 'Mobilize support. Our fundraising and retail solutions help organizations raise resources and drive revenue—efficiently and at scale.',
    image: upload('/2024/03/CLP-Photos-Fundrasing-Campaigns.png'),
    cta: { label: 'Learn More', href: '/fundraising-retailing/' },
  },
  {
    title: 'NUTRITION/PERFORMANCE PROGRAMMING',
    text: 'Fuel performance. Personalized nutrition and programming designed to maximize potential, minimize injury, and keep athletes performing at their peak.\nTailored plans hydrate and boost energy, strength, and endurance for athletes.',
    image: upload('/2024/03/CLP-Photos-Recovery.png'),
    cta: { label: 'Learn More', href: '/recovery-performance-training/' },
  },
  {
    title: 'PROCUREMENT/LOGISTICS',
    text: 'Streamlined sourcing. We optimize procurement and logistics so you get what you need—on time, on budget, and on point.',
    image: upload('/2024/03/CLP-Photos-Procurement.png'),
    cta: { label: 'Learn More', href: '/procurement-logistics/' },
  },
  {
    title: 'SPORTS TOURISM',
    text: 'Travel with purpose. We design sports travel experiences that combine competition, culture, and adventure—handled end to end.',
    image: upload('/2024/04/sports-tourism.png'),
    cta: { label: 'Learn More', href: '/sports-tourism/' },
  },
];

export const testimonials: { title: string; items: Testimonial[] } = {
  title: 'What our community says!',
  items: [
    {
      quote:
        "“Thrilled with the soccer program! My child's skills have improved remarkably, and the coaches' dedication is truly commendable. Highly recommend!”",
      name: 'Kara Lucas',
      title: 'Fútbol (Soccer Mom)',
      avatar: upload('/2024/03/team7-245x300.jpg'),
      avatarShadow: true,
    },
    {
      quote:
        "“Absolutely love the pickleball community here! Fantastic facilities, friendly players, and top-notch organization. It's been a blast improving my game with such supportive teammates!”",
      name: 'Alex Cohen',
      title: 'Pickleball Player',
      avatar: upload('/2024/03/team-6-245x300.jpg'),
      avatarShadow: true,
    },
    {
      quote:
        "“I'm thoroughly impressed by the exceptional performance of our partnership with CLP this quarter. Their dedication, collaboration, and results have surpassed expectations. Outstanding work, everyone!”",
      name: 'Jake Smith',
      title: 'Facility Manager',
      avatar: upload('/2024/03/team5-269x300.jpg'),
    },
  ],
};
