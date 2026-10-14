// The FAQ (/faq/): CLP's questions and answers, by topic (Experiences, Partnerships, Resources, Expectations &
// Commitments, Our Services) and, within each, by sport, partner, audience or service. faq.json holds the knowledge
// base's content (faq.competelikepros.com) as it was; an answer is its paragraphs, a list's items starting with "• ".
import data from './data/faq.json';

export type FaqItem = { q: string; a: string[] };
export type FaqSub = { id: string; label: string; items: FaqItem[] };
export type FaqTopic = { id: string; label: string; sub: string; subs: FaqSub[] };

export const faqTopics: FaqTopic[] = data.topics;

/** Where questions the FAQ doesn't answer go ("Still have a question?"). */
export const FAQ_EMAIL = 'support@competelikepros.com';

export const faqMeta = {
  title: 'FAQ: Compete Like Pros™',
  description: 'Answers about CLP experiences, partnerships, resources, our services and what we expect from everyone in the CLP community.',
};

/** A topic's page, or one of its parts' (/faq/experiences/baseball/); no topic: the FAQ's first page. */
export const faqHref = (topic?: string, sub?: string) => (topic ? `/faq/${topic}/${sub ? `${sub}/` : ''}` : '/faq/');

/** The topic and part a path names (the first of each when it names none or one that isn't there). */
export const faqPlace = (topic?: string, sub?: string) => {
  const t = faqTopics.find((x) => x.id === topic) ?? faqTopics[0];
  const s = t.subs.find((x) => x.id === sub) ?? t.subs[0];
  return { topic: t, sub: s };
};
