import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PartnerArchiveView from '@/components/partners/PartnerArchiveView';
import { getPartnerPage } from '@/content/partners';

const page = () => getPartnerPage('/clp-partners/');

export function generateMetadata(): Metadata {
  const p = page();
  return p ? { title: { absolute: p.meta.title }, description: p.meta.description || undefined, alternates: { canonical: '/clp-partners/' } } : {};
}

// The partner directory's first page; later pages are /clp-partners/page/<n>/ (see [...path]).
export default function PartnersPage() {
  const p = page();
  if (p?.kind !== 'archive') notFound();
  return <PartnerArchiveView page={p} />;
}
