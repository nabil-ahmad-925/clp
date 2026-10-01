import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryArchiveView from '@/components/pages/CategoryArchiveView';
import { archiveParams, getArchive } from '@/content/categories';

// Author archives ("All Posts By ..."), e.g. /author/michael/ and its second page /author/michael/page/2/.
// They share the category archive template.
export const dynamicParams = false;

export function generateStaticParams() {
  return archiveParams('author');
}

const pathOf = (path: string[]) => `/author/${path.join('/')}/`;

export async function generateMetadata(props: PageProps<'/author/[...path]'>): Promise<Metadata> {
  const { path } = await props.params;
  const archive = getArchive(pathOf(path));
  if (!archive) return {};
  return {
    title: { absolute: archive.meta.title },
    description: archive.meta.description || undefined,
    alternates: { canonical: pathOf(path) },
  };
}

export default async function AuthorPage(props: PageProps<'/author/[...path]'>) {
  const { path } = await props.params;
  const archive = getArchive(pathOf(path));
  if (!archive) notFound();
  return <CategoryArchiveView archive={archive} />;
}
