import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import PartnerCarousel from '@/components/sections/PartnerCarousel';
import Faq from '@/components/sections/Faq';
import { partnerCategories, partnerTerms, partnershipsFaq, partnershipsHero, partnershipsMeta } from '@/content/partnerships';

export const metadata: Metadata = {
  title: { absolute: partnershipsMeta.title },
  description: partnershipsMeta.description,
  alternates: { canonical: '/partnerships/' },
};

export default function PartnershipsPage() {
  return (
    <>
      <PageHero {...partnershipsHero} />
      <PartnerCarousel items={partnerCategories} termsHtml={partnerTerms} />
      <Faq {...partnershipsFaq} wide />
    </>
  );
}
