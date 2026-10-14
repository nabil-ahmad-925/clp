import type { Metadata } from 'next';
import ListingHero from '@/components/sections/ListingHero';
import { faqHref, faqMeta, faqPlace } from '@/content/faq';
import FaqCenter from './FaqCenter';

/** The FAQ page's title and description, for a topic's part (its own page) or the FAQ itself. */
export const faqMetadata = (topic?: string, sub?: string): Metadata => {
  const place = faqPlace(topic, sub);
  const named = topic ? `${place.topic.label}${sub ? ` · ${place.sub.label}` : ''} FAQ` : '';
  return {
    title: { absolute: named ? `${named}: Compete Like Pros™` : faqMeta.title },
    description: named ? `${place.topic.sub} Answers from CLP.` : faqMeta.description,
    alternates: { canonical: faqHref(topic, sub) },
  };
};

/**
 * The FAQ (the new design): "How can we help?" on black with the search on its edge, the topics as tabs, a topic's
 * parts (its sports, partners, audiences or services) as a switch, the questions opening one by one, and "Still have a
 * question?". Each topic and part has its own address (/faq/<topic>/<part>/), opened on it.
 */
export default function FaqView({ topic, sub }: { topic?: string; sub?: string }) {
  const place = faqPlace(topic, sub);
  return (
    <>
      <ListingHero
        title={['How can we help?']}
        blurb="Answers about experiences, partnerships, resources, our services and what we expect from everyone in the CLP community."
      />
      <FaqCenter topic={place.topic.id} sub={place.sub.id} />
    </>
  );
}
