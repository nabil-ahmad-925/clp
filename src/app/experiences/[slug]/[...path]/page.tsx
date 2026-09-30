import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BuilderPageView from '@/components/builder/BuilderPageView';
import { builderPaths, getBuilderPage } from '@/content/builder';
import { getPhotoPage, photoPaths } from '@/content/photos';

// Pages below a sport experience: photo albums and galleries (e.g. /experiences/baseball/photos/ and
// /experiences/baseball/photos/nggallery/album/baseball-branded-activations/) and page-builder pages such as
// the sport FAQs (/experiences/baseball/baseball-softball-faq/).
export const dynamicParams = false;

const nested = (paths: string[]) =>
  paths.map((p) => p.split('/').filter(Boolean)).filter((segments) => segments[0] === 'experiences' && segments.length > 2);

export function generateStaticParams() {
  return [...nested(photoPaths), ...nested(builderPaths)].map(([, slug, ...path]) => ({ slug, path }));
}

const pathOf = (slug: string, path: string[]) => `/experiences/${slug}/${path.join('/')}/`;
const findPage = (path: string) => getPhotoPage(path) ?? getBuilderPage(path);

export async function generateMetadata(props: PageProps<'/experiences/[slug]/[...path]'>): Promise<Metadata> {
  const { slug, path } = await props.params;
  const page = findPage(pathOf(slug, path));
  if (!page) return {};
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: pathOf(slug, path) },
  };
}

export default async function ExperienceSubPage(props: PageProps<'/experiences/[slug]/[...path]'>) {
  const { slug, path } = await props.params;
  const page = findPage(pathOf(slug, path));
  if (!page) notFound();
  return <BuilderPageView page={page} />;
}
