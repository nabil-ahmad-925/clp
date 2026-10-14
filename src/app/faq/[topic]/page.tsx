import FaqView, { faqMetadata } from '@/components/faq/FaqView';
import { faqTopics } from '@/content/faq';

type Params = { topic: string };

export const dynamicParams = false;
export const generateStaticParams = (): Params[] => faqTopics.map((t) => ({ topic: t.id }));
export const generateMetadata = async ({ params }: { params: Promise<Params> }) => faqMetadata((await params).topic);

export default async function FaqTopicPage({ params }: { params: Promise<Params> }) {
  return <FaqView topic={(await params).topic} />;
}
