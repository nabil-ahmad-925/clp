import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PartnerArchiveView from '@/components/partners/PartnerArchiveView';
import PartnerProfileView from '@/components/partners/PartnerProfileView';
import { getPartnerPage, partnerParams } from '@/content/partners';

// Partner profiles (/clp-partners/<slug>/) and the directory's later pages (/clp-partners/page/<n>/).
export const dynamicParams = false;

export function generateStaticParams() {
  return partnerParams();
}

const pathOf = (path: string[]) => `/clp-partners/${path.join('/')}/`;

export async function generateMetadata(props: PageProps<'/clp-partners/[...path]'>): Promise<Metadata> {
  const { path } = await props.params;
  const page = getPartnerPage(pathOf(path));
  if (!page) return {};
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: pathOf(path) },
  };
}

export default async function PartnerPage(props: PageProps<'/clp-partners/[...path]'>) {
  const { path } = await props.params;
  const page = getPartnerPage(pathOf(path));
  if (!page) notFound();
  return page.kind === 'single' ? <PartnerProfileView page={page} /> : <PartnerArchiveView page={page} />;
}
