// Content for /about-us/, from the original site.
import type { PageHeroData } from './types';
import { SITE_URL, upload } from './site';

export const aboutMeta = {
  title: 'About Us | Compete Like Pros™',
  description:
    'CLP is The Game Changer—empowering athletes, creators, and communities through world-class sports, fitness, and entertainment experiences. #LeaveYourFootprints',
};

export const aboutHero: PageHeroData = {
  title: ['WE ARE GAME CHANGERS'],
  subtitle: { text: 'REDEFINE YOUR PURPOSE ™', small: '#LeaveYourFootprints' },
  backgroundColor: '#0a0a0a',
  height: 500,
};

export type AboutBlock = { title: string; paragraphs: string[] };

export const aboutBlocks: { who: AboutBlock; mission: AboutBlock; vision: AboutBlock } = {
  who: {
    title: 'WHO WE ARE',
    paragraphs: [
      'Compete Like Pros™ is where performance meets purpose. We’re not just part of the game—we’re building the future of it. CLP empowers athletes, creators, and communities through world-class sports, fitness, and entertainment experiences. From training and tournaments to brand activations and recovery programs, we create dynamic ecosystems that help talent thrive—on and off the field.',
      'We combine the visionary drive of a Creator and the fearless edge of an Outlaw. The result? A brand that challenges conventions, rewrites the rules, and opens new paths for those ready to rise.',
    ],
  },
  mission: {
    title: 'OUR MISSION',
    paragraphs: [
      'Our mission is to redefine what it means to compete by creating accessible, high-impact experiences that bring out the best in every athlete, brand, creator, coach, and community we serve. Whether it’s through competitive events, recovery and performance programs, or branded activations, we provide pathways for individuals and groups to grow in confidence, skill, and connection.',
      'We believe success in sports—and in life—is not just about performance, but about purpose. That’s why we focus on developing the whole person: physically, mentally, and creatively. Through expert-led coaching, immersive events, and strategic partnerships, we empower people to push limits, embrace challenges, and build a culture rooted in excellence.',
    ],
  },
  vision: {
    title: 'OUR VISION',
    paragraphs: [
      'We envision a world where sports, fitness, and entertainment transcend borders—connecting people across cultures, skill levels, and industries through shared passion and purpose.Compete Like Pros™ is building a global ecosystem where every participant, from rising talent to elite performer, has access to the tools, support, and platforms they need to thrive.',
      'Our vision is to lead a movement that inspires lifelong learning, fuels healthy competition, and reimagines how athletic and entertainment experiences can be delivered. By uniting innovation, inclusion, and intention, we aim to shape a future where everyone can compete like pros—because greatness should be within reach for all.',
    ],
  },
};

export const howWeWork = {
  title: 'HOW WE WORK',
  steps: [
    {
      title: 'WE IDEATE',
      text: 'Big ideas start here. We collaborate with clients to turn vision into strategy—building concepts that align with your goals and move your audience.',
    },
    {
      title: 'WE PLAN',
      text: 'Every detail matters. We map out every phase, anticipate challenges, and build roadmaps designed to maximize impact and keep projects on track.',
    },
    {
      title: 'WE EXECUTE',
      text: 'Plans mean nothing without execution. We bring ideas to life with precision—on time, on budget, and built to perform.',
    },
  ],
};

export const startProject = {
  label: ['START A', 'PROJECT'],
  href: `${SITE_URL}/services/brand-product-development/`,
};

export const aboutBandImage = upload('/2024/07/Screenshot_203.png');
