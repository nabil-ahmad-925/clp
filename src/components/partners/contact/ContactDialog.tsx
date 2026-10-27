'use client';

import { useMemo, useState } from 'react';
import { useSiteUser } from '@/components/account/useSiteUser';
import type { PartnerPageData } from '@/content/partnerPages';
import { CloseButton } from '../page/CloseButton';
import { Overlay } from '../page/Overlay';
import type { ContactDraft } from './contactDraft';
import ContactFormStep from './ContactFormStep';
import ContactSentStep from './ContactSentStep';
import ContactTopicStep from './ContactTopicStep';
import { contactTopics, type TopicId } from './contactTopics';
import c from './contact.module.css';

type Props = {
  page: PartnerPageData;
  experiences: { id: string; title: string }[];
  roles: { title: string }[];
  /** Opens on a topic ("Work with" opens Partnership), or on a form kept while its sender signed in. */
  start?: { topic: TopicId; draft?: ContactDraft };
  onClose: () => void;
};

/**
 * Contact (replaces the old Message window): step 1 asks what it's about, step 2 is that topic's short form, step 3
 * confirms. The topic picks who gets it (clp-api shared/contact.mjs).
 */
export default function ContactDialog({ page, experiences, roles, start, onClose }: Props) {
  const signedIn = Boolean(useSiteUser());
  const topics = useMemo(() => contactTopics(page.short, experiences, roles), [page.short, experiences, roles]);
  const [topicId, setTopicId] = useState<TopicId | null>(start?.topic ?? null);
  const [sent, setSent] = useState('');
  const topic = topics.find((t) => t.id === topicId) ?? null;
  const sub = sent ? 'Message sent' : topic ? 'Step 2 of 2' : 'Usually replies within 1 day';
  return (
    <Overlay onClose={onClose} width={620} label={`Contact ${page.name}`}>
      <div className={c.head}>
        <div className={c.heading}>
          <h2 className={c.title}>Contact {page.name}</h2>
          <span className={c.sub}>{sub}</span>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      {!topic ? (
        <ContactTopicStep topics={topics} short={page.short} onPick={setTopicId} />
      ) : sent ? (
        <ContactSentStep short={page.short} topic={topic} path={sent} onDone={onClose} />
      ) : (
        <ContactFormStep key={topic.id} page={page} topic={topic} signedIn={signedIn} initial={start?.draft ?? null} onBack={() => setTopicId(null)} onSent={setSent} />
      )}
    </Overlay>
  );
}
