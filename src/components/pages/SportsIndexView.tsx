import PageHero from '@/components/sections/PageHero';
import QuoteSlider from '@/components/sections/QuoteSlider';
import FeatureRow from '@/components/sections/FeatureRow';
import Faq from '@/components/sections/Faq';
import type { SportsIndexPage } from '@/content/types';

/**
 * An index of the sports' pages (/experiences/, /resources/), laid out as a sport's page (SportPageView): the heading,
 * a quote per sport, a band per sport and the FAQ.
 */
export default function SportsIndexView({ page }: { page: SportsIndexPage }) {
  return (
    <>
      <PageHero {...page.hero} />
      <QuoteSlider quotes={page.quotes} />
      {page.sports.map((sport) => (
        <FeatureRow key={sport.title} {...sport} />
      ))}
      <Faq {...page.faq} />
    </>
  );
}
