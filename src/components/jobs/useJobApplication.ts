'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Job } from '@/content/jobs';
import { MAX_RESUME_BYTES, RESUME_TYPES, applyToJob, saveConversation, sitePath, uploadResume } from '@/content/messages';

/** "When can you start?" (the API's choices). */
export const JOB_STARTS = [
  { id: 'now', label: 'Right away' },
  { id: '2weeks', label: 'In 2 weeks' },
  { id: 'month', label: 'Next month' },
] as const;

/** What the resume field takes (the file picker's filter): PDF or Word. */
export const RESUME_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** A file's size as people read it: "820 KB", "2.4 MB". */
export const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/**
 * "Apply with CLP" on a partner's job (their page's Jobs, the Jobs & Internships board): the form's state and its
 * sending. A resume (PDF or Word, 10 MB at most) is checked when chosen and uploaded when the application is sent, then
 * sent with it. The application is a conversation with the partner on CLP Messages: its page (/messages/?thread=…) is
 * kept on this device, and `sent` opens it.
 */
export function useJobApplication(job: Job, partnerName: string) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', link: '', note: '', start: 'now', website: '' });
  const [resume, setResume] = useState<File | null>(null);
  // What's being sent: the resume first (when there is one), then the application.
  const [busy, setBusy] = useState<'' | 'uploading' | 'sending'>('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ path: string; already: boolean } | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const chooseResume = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // The same file can be chosen again after it's removed.
    e.target.value = '';
    if (!file) return;
    const word = /\.(pdf|docx?)$/i.test(file.name);
    if (!RESUME_TYPES.includes(file.type) && !word) return setError('Choose your resume as a PDF or Word file.');
    if (file.size > MAX_RESUME_BYTES) return setError('Your resume must be 10 MB or smaller.');
    setError('');
    setResume(file);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim() || !form.email.trim() || !form.note.trim()) return setError('Add your name, your e-mail and a few lines about you, please.');
    setError('');
    try {
      let uploaded;
      if (resume) {
        setBusy('uploading');
        // A Word file some browsers don't type: typed from its name.
        const typed = resume.type || (/\.pdf$/i.test(resume.name) ? RESUME_TYPES[0] : /\.docx$/i.test(resume.name) ? RESUME_TYPES[2] : RESUME_TYPES[1]);
        uploaded = await uploadResume(job.id, resume.type ? resume : new File([resume], resume.name, { type: typed }));
      }
      setBusy('sending');
      const r = await applyToJob({ jobId: job.id, ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), link: form.link.trim(), note: form.note.trim(), resume: uploaded });
      const path = sitePath(r.link);
      saveConversation({ path, name: partnerName, subject: `Application · ${job.title}`, at: new Date().toISOString() });
      setSent({ path, already: Boolean(r.already) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setBusy('');
    }
  };
  return { form, set, resume, chooseResume, removeResume: () => setResume(null), busy, error, sent, submit };
}
