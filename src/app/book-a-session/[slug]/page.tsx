import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BuilderPageView from '@/components/builder/BuilderPageView';
import { builderPaths, getBuilderPage } from '@/content/builder';

// Page-builder pages under /book-a-session/ (e.g. /book-a-session/baseball-experience/, the baseball
// facilities directory the sport page's "View all" leads to).
export const dynamicParams = false;

export function generateStaticParams() {
  return builderPaths.filter((p) => p.startsWith('/book-a-session/')).map((p) => ({ slug: p.split('/')[2] }));
}

export async function generateMetadata(props: PageProps<'/book-a-session/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getBuilderPage(`/book-a-session/${slug}/`);
  if (!page) return {};
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: `/book-a-session/${slug}/` },
  };
}

export default async function BookASessionPage(props: PageProps<'/book-a-session/[slug]'>) {
  const { slug } = await props.params;
  const page = getBuilderPage(`/book-a-session/${slug}/`);
  if (!page) notFound();
  return <BuilderPageView page={page} />;
}
