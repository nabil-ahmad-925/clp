import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ServicePageView from '@/components/pages/ServicePageView';
import LegalPageView from '@/components/pages/LegalPageView';
import BuilderPageView from '@/components/builder/BuilderPageView';
import LivePost from '@/components/pages/LivePost';
import { getServicePage, servicePages } from '@/content/services';
import { getLegalPage, legalPages } from '@/content/legal';
import { builderPaths, getBuilderPage } from '@/content/builder';
import { getPost, postPaths } from '@/content/posts';

// Top-level content pages: the 7 service pages (e.g. /brand-product-development/), the 4 policy pages
// (e.g. /terms-conditions/), blog posts and the page-builder pages (directories, listings, ...) at a
// single-segment path.
// Other top-level pages have their own folders.
export const dynamicParams = false;

export function generateStaticParams() {
  const topLevel = (paths: string[]) => paths.filter((p) => p.split('/').filter(Boolean).length === 1).map((p) => p.replaceAll('/', ''));
  return [...servicePages.map((p) => p.slug), ...legalPages.map((p) => p.slug), ...topLevel(builderPaths), ...topLevel(postPaths)].map(
    (slug) => ({ slug }),
  );
}

const findPage = (slug: string) => {
  const service = getServicePage(slug);
  if (service) return { kind: 'service' as const, page: service };
  const legal = getLegalPage(slug);
  if (legal) return { kind: 'legal' as const, page: legal };
  const builder = getBuilderPage(`/${slug}/`);
  if (builder) return { kind: 'builder' as const, page: builder };
  const post = getPost(`/${slug}/`);
  if (post) return { kind: 'post' as const, page: post };
  return null;
};

export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const found = findPage(slug);
  if (!found) return {};
  const { meta } = found.page;
  return {
    title: { absolute: meta.title },
    description: meta.description || undefined,
    alternates: { canonical: `/${slug}/` },
    openGraph: { title: meta.title, description: meta.description || undefined },
  };
}

export default async function TopLevelPage(props: PageProps<'/[slug]'>) {
  const { slug } = await props.params;
  const found = findPage(slug);
  if (!found) notFound();
  switch (found.kind) {
    case 'service':
      return <ServicePageView page={found.page} />;
    case 'legal':
      return <LegalPageView page={found.page} />;
    case 'builder':
      return <BuilderPageView page={found.page} />;
    case 'post':
      // The built-in copy, replaced in the browser by the article as last saved in the admin.
      return <LivePost slug={slug} post={found.page} />;
  }
}
