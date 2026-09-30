import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BuilderPageView from '@/components/builder/BuilderPageView';
import { getBuilderPage } from '@/content/builder';

// /book-a-session/ itself: an empty page on the original (its booking pages live one level down).
export function generateMetadata(): Metadata {
  const page = getBuilderPage('/book-a-session/');
  return page ? { title: { absolute: page.meta.title }, alternates: { canonical: '/book-a-session/' } } : {};
}

export default function BookASessionIndex() {
  const page = getBuilderPage('/book-a-session/');
  if (!page) notFound();
  return <BuilderPageView page={page} />;
}
