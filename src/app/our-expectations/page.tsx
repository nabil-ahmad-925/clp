import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import PrinciplesSlider from '@/components/sections/PrinciplesSlider';
import Faq from '@/components/sections/Faq';
import Section from '@/components/ui/Section';
import { expectationsFaq, expectationsHero, expectationsMeta, expectationsQuote, principles } from '@/content/expectations';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: expectationsMeta.title },
  description: expectationsMeta.description,
  alternates: { canonical: '/our-expectations/' },
};

export default function ExpectationsPage() {
  return (
    <>
      <PageHero {...expectationsHero} />
      <Section tone="light" background="var(--gold)" className={styles.quoteBand}>
        <h2 className={styles.quote}>{expectationsQuote.quote}</h2>
        <p className={styles.commitment}>{expectationsQuote.commitment}</p>
      </Section>
      <PrinciplesSlider slides={principles} />
      <Faq {...expectationsFaq} wide />
    </>
  );
}
