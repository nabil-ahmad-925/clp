import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SportPageView from '@/components/pages/SportPageView';
import { getSportPage, sportPages } from '@/content/sports';

export const dynamicParams = false;

export function generateStaticParams() {
  return sportPages.filter((p) => p.section === 'resources').map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<'/resources/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getSportPage('resources', slug);
  if (!page) return {};
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: `/resources/${slug}/` },
    openGraph: { title: page.meta.title, description: page.meta.description, images: [page.hero.backgroundImage] },
  };
}

export default async function ResourcePage(props: PageProps<'/resources/[slug]'>) {
  const { slug } = await props.params;
  const page = getSportPage('resources', slug);
  if (!page) notFound();
  return <SportPageView page={page} />;
}
