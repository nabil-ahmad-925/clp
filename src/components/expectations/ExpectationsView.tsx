import type { Metadata } from 'next';
import ListingHero from '@/components/sections/ListingHero';
import { expectationsHero, expectationsMeta } from '@/content/expectations';
import ExpectationsCenter from './ExpectationsCenter';

export const expectationsMetadata: Metadata = {
  title: { absolute: expectationsMeta.title },
  description: expectationsMeta.description,
  alternates: { canonical: '/our-expectations/' },
};

/**
 * Expectations & Commitment (the Oct 15, 2026 handoff), built on the FAQ page's layout: the black heading with its gold
 * label and meta line, "I'm a" on its edge, the sections as tabs, and the gold agreement band.
 */
export default function ExpectationsView() {
  return (
    <>
      <ListingHero eyebrow={expectationsHero.eyebrow} title={[expectationsHero.title]} blurb={expectationsHero.blurb} meta={expectationsHero.meta} />
      <ExpectationsCenter />
    </>
  );
}
