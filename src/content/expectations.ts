// Content for /our-expectations/, from the original site.
import type { FaqData, PageHeroData } from './types';

export const expectationsMeta = {
  title: 'EXPECTATIONS & COMMITMENT - Compete Like Pros™',
  description:
    'Inclusivity: Create an environment that welcomes participants of all backgrounds and abilities. Embrace diversity to enrich the sports community. Passion for',
};

export const expectationsHero: PageHeroData = {
  title: ['EXPECTATIONS & COMMITMENT'],
  backgroundColor: '#000000',
  height: 500,
};

export const expectationsQuote = {
  quote:
    '“Banners, signs, wearables, or similar items that are obscene or indecent, unrelated to the event, potentially offensive to other patrons, that may block the views of other fans, or that are otherwise considered dangerous or inappropriate are prohibited from all CLP experiences in person or virtually.”',
  commitment:
    'As a result of these principles, our partner operators must commit to providing all participants with an enjoyable, safe, and sustainable experience.',
};

export type Principle = { title: string; paragraphs: string[]; gradient: [string, string] };

export const principles: Principle[] = [
  {
    title: 'Inclusivity and Excellence.',
    paragraphs: [
      'Inclusivity: Create an environment that welcomes participants of all backgrounds and abilities. Embrace diversity to enrich the sports community. Passion for',
      'Excellence: Strive for excellence in every aspect of sports management, from event organization to facility maintenance. A commitment to continuous\nimprovement ensures a top-tier experience for participants.',
    ],
    gradient: ['#0a0a0a', '#000000'],
  },
  {
    title: 'Player-Centric Approach and Community Engagement',
    paragraphs: [
      'Player-Centric Approach: Prioritize the needs and experiences of the players. Tailor programs, facilities,and services to enhance player enjoyment and skill development.',
      'Community Engagement: Actively engage with the local community. Build partnerships that contribute to a vibrant and supportive sports culture, fostering a sense of belonging.',
    ],
    gradient: ['#000000', '#000000'],
  },
  {
    title: 'Safety, Innovation, and Education',
    paragraphs: [
      'Safety and Well-being: Prioritize the safety and well-being of participants. Implement robust safety measures and create an environment that promotes physical and mental health.',
      'Innovation and Adaptability: Embrace innovation in sports programming, technology, and facility management. Stay adaptable to evolving trends to keep the sports experience fresh and relevant.',
      'Education and Development: Foster a culture of continuous learning and skill development, benefiting athletes, coaches, organizers, and staff alike.',
    ],
    gradient: ['#000000', '#000000'],
  },
  {
    title: 'Sustainability, Transparency, and Enjoyment',
    paragraphs: [
      'Sustainability: Integrate environmentally friendly practices into sports operations. Prioritize sustainability in facility design, event planning, and resource management.',
      'Transparency and Integrity: Uphold high standards of transparency and integrity in all aspects of sports management. Clear communication and ethical practices build trust.',
      'Fun and Enjoyment: Cultivate an atmosphere where participants and spectators can derive joy and satisfaction from their engagement with sports.',
    ],
    gradient: ['#000000', '#000000'],
  },
];

export const expectationsFaq: FaqData = {
  title: "EXPECTATIONS & COMMITMENT FAQ's",
  items: [
    {
      question: 'What opportunities does CLP offer for athletes to engage with their communities and make a positive impact?',
      answer:
        'CLP facilitates community engagement initiatives and partnerships for athletes to give back, support charitable causes, and inspire the next generation of athletes through mentorship and outreach programs.',
    },
    {
      question: 'How does CLP ensure the well-being and success of young athletes?',
      answer:
        'CLP prioritizes the holistic development and welfare of young athletes, providing guidance on balancing academics, training, and competitions. We also promote ethical practices, compliance with regulations, and support systems for mental and physical well-being.',
    },
    {
      question: "How does CLP ensure transparency and open communication with parents regarding their child's athletic journey?",
      answer:
        'CLP maintains open channels of communication with parents, providing regular updates, progress reports, and opportunities for parent-athlete consultations to ensure alignment with goals and expectations.',
    },
    {
      question: 'What can operators expect when partnering with CLP?',
      answer:
        'Operators can expect a collaborative partnership with CLP focused on enhancing the overall experience for athletes, coaches, and stakeholders. This includes access to professional services, strategic planning, marketing support, and opportunities for growth and sustainability.',
    },
  ],
  viewAll: { label: 'VIEW ALL', href: 'https://faq.competelikepros.com/expectations-commitments/' },
};
