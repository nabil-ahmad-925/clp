'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { contactPartner, saveConversation, sitePath } from '@/content/messages';
import { PartnerApiError, type PartnerPageData } from '@/content/partnerPages';
import { clearDraft, saveDraft, type ContactDraft } from './contactDraft';
import { firstAnswers, type ContactTopic } from './contactTopics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** What's wrong with the form before it's sent ('' when nothing), in the order people fill it in. */
export function formProblem(topic: ContactTopic, fields: Record<string, string>, text: string, sender: { name: string; email: string } | null) {
  const empty = topic.fields.find((f) => f.kind === 'text' && f.required && !fields[f.id]?.trim());
  if (empty) return `Add ${empty.label.toLowerCase()}.`;
  if (sender && !sender.name.trim()) return 'Add your name.';
  if (sender && !EMAIL_RE.test(sender.email.trim())) return 'Add a valid email address.';
  if (!text.trim()) return 'Write your message.';
  return '';
}

/**
 * Step 2's state and sending. A member topic signed out keeps the form (contactDraft) and goes to sign in, coming back
 * to it filled in; a CLP topic signed out asks for a name and e-mail instead. Sent, the conversation is kept on this
 * device (CLP Messages) and its page comes back.
 */
export function useContactForm(page: PartnerPageData, topic: ContactTopic, signedIn: boolean, initial: ContactDraft | null, onSent: (path: string) => void) {
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, string>>(() => ({ ...firstAnswers(topic), ...(initial?.topic === topic.id ? initial.fields : {}) }));
  const [text, setText] = useState(initial?.topic === topic.id ? initial.text : '');
  const [sender, setSender] = useState({ name: '', email: '' });
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const askSender = !topic.member && !signedIn;

  const signIn = () => {
    saveDraft({ slug: page.slug, topic: topic.id, fields, text });
    router.push(`/sign-in/?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = formProblem(topic, fields, text, askSender ? sender : null);
    if (problem) return setError(problem);
    if (topic.member && !signedIn) return signIn();
    setBusy(true);
    setError('');
    try {
      const listingId = topic.fields.flatMap((f) => (f.kind === 'select' ? f.options : [])).find((o) => o.listingId && fields.experience === o.value)?.listingId;
      const link = await contactPartner({ slug: page.slug, topic: topic.id, fields, text: text.trim(), listingId, website, ...(askSender ? { name: sender.name.trim(), email: sender.email.trim() } : {}) }, signedIn);
      const path = sitePath(link);
      saveConversation({ path, name: topic.member ? page.name : 'CLP Partnerships', subject: topic.label, at: new Date().toISOString() });
      clearDraft();
      onSent(path);
    } catch (err) {
      // The sign-in ran out meanwhile: sign in again, the form waits.
      if (err instanceof PartnerApiError && err.status === 401 && topic.member) return signIn();
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return { fields, setFields, text, setText, sender, setSender, askSender, website, setWebsite, busy, error, submit };
}
