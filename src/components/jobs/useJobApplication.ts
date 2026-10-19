'use client';

import { useState, type FormEvent } from 'react';
import type { Job } from '@/content/jobs';
import { applyToJob, saveConversation, sitePath } from '@/content/messages';

/** "When can you start?" (the API's choices). */
export const JOB_STARTS = [
  { id: 'now', label: 'Right away' },
  { id: '2weeks', label: 'In 2 weeks' },
  { id: 'month', label: 'Next month' },
] as const;

/**
 * "Apply with CLP" on a partner's job (their page's Jobs, the Jobs & Internships board): the form's state and its
 * sending. The application is a conversation with the partner on CLP Messages: its page (/messages/?thread=…) is kept on
 * this device, and `sent` opens it.
 */
export function useJobApplication(job: Job, partnerName: string) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', link: '', note: '', start: 'now', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ path: string; already: boolean } | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.note.trim()) return setError('Add your name, your e-mail and a few lines about you, please.');
    setBusy(true);
    setError('');
    try {
      const r = await applyToJob({ jobId: job.id, ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), link: form.link.trim(), note: form.note.trim() });
      const path = sitePath(r.link);
      saveConversation({ path, name: partnerName, subject: `Application · ${job.title}`, at: new Date().toISOString() });
      setSent({ path, already: Boolean(r.already) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return { form, set, busy, error, sent, submit };
}
