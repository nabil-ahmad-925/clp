import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AuthorArchiveView from '@/components/pages/AuthorArchiveView';
import LiveArchive from '@/components/pages/LiveArchive';
import { archiveParams, getArchive } from '@/content/categories';

// Author archives ("All Posts By ..."), e.g. /author/michael/ and its second page /author/michael/page/2/.
// In the new design of the article lists (AuthorArchiveView).
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
  // The page number (?page=) is only known in the browser: the static HTML has the built-in list.
  return (
    <Suspense fallback={<AuthorArchiveView archive={archive} />}>
      <LiveArchive archive={archive} />
    </Suspense>
  );
}
