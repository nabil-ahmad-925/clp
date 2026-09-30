import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import PostSection from '@/components/sections/PostSection';
import { updatesMeta, updatesSections } from '@/content/updates';

export const metadata: Metadata = {
  title: { absolute: updatesMeta.title },
  description: updatesMeta.description,
  alternates: { canonical: '/updates/' },
};

export default function UpdatesPage() {
  return (
    <>
      <PageHero title={['Updates & News']} height={350} backgroundColor="#0a0a0a" />
      {updatesSections.map((section) => (
        <PostSection key={section.title} {...section} />
      ))}
    </>
  );
}
