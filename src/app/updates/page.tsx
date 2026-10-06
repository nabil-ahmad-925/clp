import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import LivePostSection from '@/components/sections/LivePostSection';
import { ARTICLE_CATEGORIES } from '@/content/articles';
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
        // Each section is a category: the one whose page its "View all" opens.
        <LivePostSection key={section.title} {...section} category={ARTICLE_CATEGORIES.find((c) => c.page === section.viewAll.href)?.slug} />
      ))}
    </>
  );
}
