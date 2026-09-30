import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BuilderPageView from '@/components/builder/BuilderPageView';
import { builderPaths, getBuilderPage } from '@/content/builder';

// Two-segment page-builder pages outside the sections that have their own folders: the service pages'
// inquiry forms, article grids and photo grids (e.g. /brand-product-development/inquiry/).
export const dynamicParams = false;

const OWN_FOLDERS = ['experiences', 'book-a-session'];

export function generateStaticParams() {
  return builderPaths
    .map((p) => p.split('/').filter(Boolean))
    .filter((parts) => parts.length === 2 && !OWN_FOLDERS.includes(parts[0]))
    .map(([slug, sub]) => ({ slug, sub }));
}

export async function generateMetadata(props: PageProps<'/[slug]/[sub]'>): Promise<Metadata> {
  const { slug, sub } = await props.params;
  const page = getBuilderPage(`/${slug}/${sub}/`);
  if (!page) return {};
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: `/${slug}/${sub}/` },
  };
}

export default async function NestedBuilderPage(props: PageProps<'/[slug]/[sub]'>) {
  const { slug, sub } = await props.params;
  const page = getBuilderPage(`/${slug}/${sub}/`);
  if (!page) notFound();
  return <BuilderPageView page={page} />;
}
