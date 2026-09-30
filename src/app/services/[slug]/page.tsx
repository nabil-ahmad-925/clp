import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ServiceDetailView from '@/components/pages/ServiceDetailView';
import { getServiceDetailPage, serviceDetailPages } from '@/content/serviceDetails';

export const dynamicParams = false;

export function generateStaticParams() {
  return serviceDetailPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<'/services/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getServiceDetailPage(slug);
  if (!page) return {};
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: `/services/${slug}/` },
  };
}

export default async function ServiceDetailRoute(props: PageProps<'/services/[slug]'>) {
  const { slug } = await props.params;
  const page = getServiceDetailPage(slug);
  if (!page) notFound();
  return <ServiceDetailView page={page} />;
}
