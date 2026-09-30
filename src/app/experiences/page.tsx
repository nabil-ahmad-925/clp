import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import StatementBand from '@/components/sections/StatementBand';
import SportTiles from '@/components/sections/SportTiles';
import Faq from '@/components/sections/Faq';
import { experienceTiles, experiencesFaq, experiencesHeading, experiencesHero } from '@/content/experiences';

export const metadata: Metadata = {
  title: { absolute: 'EXPERIENCES - Compete Like Pros™' },
  alternates: { canonical: '/experiences/' },
};

export default function ExperiencesPage() {
  return (
    <>
      <PageHero {...experiencesHero} />
      <StatementBand text={experiencesHeading} variant="plain" />
      {experienceTiles.map((row, i) => (
        <SportTiles key={i} tiles={row} />
      ))}
      <Faq {...experiencesFaq} />
    </>
  );
}
