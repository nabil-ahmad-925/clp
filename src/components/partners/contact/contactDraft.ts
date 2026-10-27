import type { TopicId } from './contactTopics';

/**
 * A Contact form waiting for its sender to sign in: kept in this tab (sessionStorage) while they sign in or create an
 * account, then the partner page opens it again, filled in. Storage blocked: they type it again.
 */
export type ContactDraft = { slug: string; topic: TopicId; fields: Record<string, string>; text: string };
const KEY = 'clp-contact-draft';

export function saveDraft(draft: ContactDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked: the form starts empty after signing in.
  }
}

/** The draft for this partner's page, if one waits. */
export function draftFor(slug: string): ContactDraft | null {
  try {
    const d = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as ContactDraft | null;
    return d && d.slug === slug && typeof d.topic === 'string' && typeof d.text === 'string' && d.fields && typeof d.fields === 'object' ? d : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing kept.
  }
}
