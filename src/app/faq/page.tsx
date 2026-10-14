import FaqView, { faqMetadata } from '@/components/faq/FaqView';

export const metadata = faqMetadata();

export default function FaqPage() {
  return <FaqView />;
}
