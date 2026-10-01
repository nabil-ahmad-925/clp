import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryArchiveView from '@/components/pages/CategoryArchiveView';
import { archiveParams, getArchive } from '@/content/categories';

// Blog category archives, top-level and nested, e.g. /category/product-development-reviews/ and
// /category/product-development-reviews/basketball-product-reviews/ (linked from the posts' category labels).
export const dynamicParams = false;

export function generateStaticParams() {
  return archiveParams('category');
}

const pathOf = (path: string[]) => `/category/${path.join('/')}/`;

export async function generateMetadata(props: PageProps<'/category/[...path]'>): Promise<Metadata> {
  const { path } = await props.params;
  const archive = getArchive(pathOf(path));
  if (!archive) return {};
  return {
    title: { absolute: archive.meta.title },
    description: archive.meta.description || undefined,
    alternates: { canonical: pathOf(path) },
  };
}

export default async function CategoryPage(props: PageProps<'/category/[...path]'>) {
  const { path } = await props.params;
  const archive = getArchive(pathOf(path));
  if (!archive) notFound();
  return <CategoryArchiveView archive={archive} />;
}
