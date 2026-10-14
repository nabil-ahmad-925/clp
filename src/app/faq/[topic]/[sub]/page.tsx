import FaqView, { faqMetadata } from '@/components/faq/FaqView';
import { faqTopics } from '@/content/faq';

type Params = { topic: string; sub: string };

export const dynamicParams = false;
export const generateStaticParams = (): Params[] => faqTopics.flatMap((t) => t.subs.map((s) => ({ topic: t.id, sub: s.id })));
export const generateMetadata = async ({ params }: { params: Promise<Params> }) => {
  const { topic, sub } = await params;
  return faqMetadata(topic, sub);
};

export default async function FaqSubPage({ params }: { params: Promise<Params> }) {
  const { topic, sub } = await params;
  return <FaqView topic={topic} sub={sub} />;
}
