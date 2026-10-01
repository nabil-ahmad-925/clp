// Content for /partnerships/, from the original site.
import type { FaqData, PageHeroData } from './types';

export const partnershipsMeta = {
  title: 'PARTNERSHIPS - Compete Like Pros™',
  description:
    'General Offer Terms: By clicking on partner links, you agree and acknowledge that you will be leaving the Compete Like Pros™ (CLP) powered by Soxcessful®',
};

export const partnershipsHero: PageHeroData = {
  title: ['PARTNERSHIPS'],
  backgroundColor: '#0a0a0a',
  height: 500,
};

export type PartnerCategory = { title: string[]; href: string };

const category = (title: string[], slug: string): PartnerCategory => ({ title, href: `/portfolio/${slug}/` });

export const partnerCategories: PartnerCategory[] = [
  category(['Advancement & Educational', 'Partners'], 'advancement-educational-partners'),
  category(['Athletes, Brands &', 'Influencers Partners'], 'athletes-brands-influencers-partners'),
  category(['Clubs & Teams Partners'], 'clubs-teams-partners'),
  category(['Community Engagement', '& Volunteering Partners'], 'community-engagement-volunteering-partners'),
  category(['Dieting & Nutrition Partners'], 'dieting-nutrition-partners'),
  category(['Equipment & Supplies Partners'], 'equipment-supplies-partners'),
  category(['Facilities & Parks Partners'], 'facilities-parks-partners'),
  category(['Food & Beverages Partners'], 'food-beverages-partners'),
  category(['Injury Prevention &', 'Recovery Partners'], 'injury-prevention-recovery-partners'),
  category(['Performance Training &', 'Coaching Partners'], 'performance-training-coaching-partners'),
  category(['Software & Tech Partners'], 'software-tech-partners'),
  category(['Travel & Logistics Partners'], 'travel-logistics-partners'),
];

export const partnerTerms =
  '<p><strong>General Offer Terms:</strong> By clicking on partner links, you agree and acknowledge that you will be leaving the Compete Like Pros™ (CLP) powered by Soxcessful® website and be connected to the third party’s website. Any information, including any personal data, that you may enter after clicking on the links will be provided to the third party and subject to the privacy and security polices of them . Compete Like Pros™ (CLP) powered by Soxcessful® may earn commission from any purchases but is not responsible for the information, content or products found on the third party website(s).</p>';

export const partnershipsFaq: FaqData = {
  title: "PARTNERSHIPS FAQ's",
  items: [
    {
      question: 'Do you offer partnership opportunities for athletes?',
      answer:
        'Yes, we welcome partnerships with athletes who are passionate about entertainment & sports, and are keen to promote our brand, participate in events, and collaborate on initiatives that benefit the entertainment & sports industries.',
    },
    {
      question: 'How can brands collaborate with your company?',
      answer:
        'We offer sponsorship opportunities, co-branded events, product collaborations, and digital marketing opportunities to help brands reach their audience and boost brand awareness.',
    },
    {
      question: 'Are there opportunities for operational owners/trainers to work with your company?',
      answer:
        'Certainly, we value partnerships with experienced operational owners/trainers who can contribute to our training programs, clinics, and educational resources. Participants and coaches can collaborate on content creation, workshops, and coaching services.',
    },
    {
      question: 'Can organizations collaborate on entertainment & sports initiatives with your company?',
      answer:
        'To grow the sport, we actively look for partners such as schools, clubs, community centers, and nonprofits to promote, host events, and develop programs.',
    },
  ],
  viewAll: { label: 'VIEW ALL', href: 'https://faq.competelikepros.com/partnerships/' },
};
