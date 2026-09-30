import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryArchiveView from '@/components/pages/CategoryArchiveView';
import { categoryArchives, getCategoryArchive } from '@/content/categories';

// Blog category archives, e.g. /category/event-project-management/ (the Event / Project Management
// service page's "Articles" tile).
export const dynamicParams = false;

export function generateStaticParams() {
  return categoryArchives.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(props: PageProps<'/category/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const archive = getCategoryArchive(slug);
  if (!archive) return {};
  return {
    title: { absolute: archive.meta.title },
    description: archive.meta.description || undefined,
    alternates: { canonical: `/category/${slug}/` },
  };
}

export default async function CategoryPage(props: PageProps<'/category/[slug]'>) {
  const { slug } = await props.params;
  const archive = getCategoryArchive(slug);
  if (!archive) notFound();
  return <CategoryArchiveView archive={archive} />;
}
