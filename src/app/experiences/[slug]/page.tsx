import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SportPageView from '@/components/pages/SportPageView';
import BuilderPageView from '@/components/builder/BuilderPageView';
import { getSportPage, sportPages } from '@/content/sports';
import { getPhotoPage, photoPaths } from '@/content/photos';
import { builderPaths, getBuilderPage } from '@/content/builder';

export const dynamicParams = false;

// Sport experience pages, plus other pages one level below /experiences/: /experiences/tennis-picklebal/ (the
// misspelt page the Tennis & Pickleball tile links to, showing the pickleball photo album) and page-builder pages
// such as /experiences/advancement-workshops/.
const childSlugs = (paths: string[]) =>
  paths.map((p) => p.split('/').filter(Boolean)).filter((s) => s.length === 2 && s[0] === 'experiences').map((s) => s[1]);

export function generateStaticParams() {
  return [...sportPages.filter((p) => p.section === 'experiences').map((p) => p.slug), ...childSlugs(photoPaths), ...childSlugs(builderPaths)].map((slug) => ({ slug }));
}

const otherPage = (slug: string) => getPhotoPage(`/experiences/${slug}/`) ?? getBuilderPage(`/experiences/${slug}/`);

export async function generateMetadata(props: PageProps<'/experiences/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getSportPage('experiences', slug);
  if (!page) {
    const other = otherPage(slug);
    if (!other) return {};
    return { title: { absolute: other.meta.title }, alternates: { canonical: `/experiences/${slug}/` } };
  }
  return {
    title: { absolute: page.meta.title },
    description: page.meta.description || undefined,
    alternates: { canonical: `/experiences/${slug}/` },
    openGraph: { title: page.meta.title, description: page.meta.description, images: [page.hero.backgroundImage] },
  };
}

export default async function ExperiencePage(props: PageProps<'/experiences/[slug]'>) {
  const { slug } = await props.params;
  const page = getSportPage('experiences', slug);
  if (page) return <SportPageView page={page} />;
  const other = otherPage(slug);
  if (!other) notFound();
  return <BuilderPageView page={other} />;
}
