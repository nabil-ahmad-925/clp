import type { Metadata } from 'next';
import { FeaturedStories, TopicSection, type HubSection } from '@/components/updates/UpdatesHub';
import { UpdatesHero, UpdatesJoin } from '@/components/updates/UpdatesParts';
import { ARTICLE_CATEGORIES } from '@/content/articles';
import { updatesMeta, updatesSections } from '@/content/updates';

export const metadata: Metadata = {
  title: { absolute: updatesMeta.title },
  description: updatesMeta.description,
  alternates: { canonical: '/updates/' },
};

// Each section is a category: the one whose page its "View all" opens.
const sections: HubSection[] = updatesSections.map((s) => ({
  title: s.title,
  category: ARTICLE_CATEGORIES.find((c) => c.page === s.viewAll.href)?.slug,
  href: s.viewAll.href,
  posts: s.posts,
}));

/** Updates & News (new design): the featured stories, a section per category, then "Write for CLP" and the newsletter. */
export default function UpdatesPage() {
  return (
    <>
      <UpdatesHero />
      <div style={{ background: '#fff' }} data-header-tone="dark">
        <FeaturedStories sections={sections} />
        {sections.map((section) => (
          <TopicSection key={section.title} section={section} />
        ))}
        <UpdatesJoin />
      </div>
    </>
  );
}
