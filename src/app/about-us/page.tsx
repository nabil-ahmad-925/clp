import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import { Divider, HowWeWork, ImageBand, MorphingCta, TextBlock } from '@/components/about/AboutSections';
import { aboutBandImage, aboutBlocks, aboutHero, aboutMeta, howWeWork, startProject } from '@/content/about';

export const metadata: Metadata = {
  title: { absolute: aboutMeta.title },
  description: aboutMeta.description,
  alternates: { canonical: '/about-us/' },
};

export default function AboutPage() {
  return (
    <>
      <PageHero {...aboutHero} />
      <TextBlock {...aboutBlocks.who} />
      <Divider />
      <TextBlock {...aboutBlocks.mission} fullWidth />
      <Divider />
      <TextBlock {...aboutBlocks.vision} />
      <HowWeWork {...howWeWork} />
      <MorphingCta {...startProject} />
      <ImageBand image={aboutBandImage} />
    </>
  );
}
