'use client';

import { useState, type FormEvent } from 'react';
import styles from './About.module.css';

type Props = { email: string; types: string[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * "START A PROJECT" (new design): the big circle opens a short form; "Send" opens the visitor's email app with the
 * project filled in, to CLP's contact address (the site sends no forms itself).
 */
export default function StartProject({ email, types }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', type: types[0], details: '' });
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const valid = form.name.trim() && EMAIL.test(form.email.trim()) && form.details.trim();

  const send = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    const subject = `Project: ${form.type} (${form.name.trim()})`;
    const body = `${form.details.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (!open) {
    return (
      <button type="button" className={styles.circle} onClick={() => setOpen(true)}>
        START A
        <br />
        PROJECT
      </button>
    );
  }
  return (
    <div className={styles.projectForm}>
      {sent ? (
        <div className={styles.sent}>
          <strong>Your email is ready to send.</strong>
          <span>
            If your email app didn&rsquo;t open, write to us at <a href={`mailto:${email}`}>{email}</a>. We&rsquo;ll be in touch within 2 business days.
          </span>
        </div>
      ) : (
        <form className={styles.formStack} onSubmit={send} noValidate>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="Name"
              aria-label="Name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={tried && !form.name.trim()}
            />
            <input
              className={styles.input}
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={tried && !EMAIL.test(form.email.trim())}
            />
          </div>
          <select className={styles.input} aria-label="Project type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <textarea
            className={styles.input}
            rows={4}
            placeholder="Tell us about it"
            aria-label="Details"
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            aria-invalid={tried && !form.details.trim()}
          />
          {tried && !valid && <span className={styles.formError}>Add your name, a valid email and a few words about the project.</span>}
          <button type="submit" className={styles.send}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}
