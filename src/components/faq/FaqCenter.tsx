'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FAQ_EMAIL, faqHref, faqPlace, faqTopics, type FaqItem } from '@/content/faq';
import rows from './FaqRows.module.css';
import styles from './FaqCenter.module.css';

const ROLES = ['I’m an athlete', 'I’m a parent or guardian', 'I’m a fan', 'I’m a partner or organizer', 'I’m a brand'];

type Entry = FaqItem & { key: string; tag: string };
/** Every question, with where it lives ("EXPERIENCES · BASKETBALL"), for the search. */
const ALL: Entry[] = faqTopics.flatMap((t) =>
  t.subs.flatMap((s) => s.items.map((item, i) => ({ ...item, key: `${t.id}/${s.id}/${i}`, tag: `${t.label} · ${s.label}`.toUpperCase() }))),
);
/** Accents and case aside ("futbol" finds "Fútbol"). */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SEARCH_TEXT = new Map(ALL.map((e) => [e.key, fold(`${e.q} ${e.a.join(' ')} ${e.tag}`)]));

/** An answer: its paragraphs, and its "• " lines as one list. */
function Answer({ blocks }: { blocks: string[] }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length)
      out.push(
        <ul key={out.length}>
          {list.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ul>,
      );
    list = [];
  };
  blocks.forEach((b) => {
    if (b.startsWith('• ')) list.push(b.slice(2));
    else {
      flush();
      out.push(<p key={out.length}>{b}</p>);
    }
  });
  flush();
  return <div className={rows.answer}>{out}</div>;
}

/**
 * The FAQ's body (see FaqView): the search on the heading's edge (across every topic: each answer tagged with its
 * place), the topics as tabs, a topic's parts as a switch, and its questions, each opening on its own. Picking a topic
 * or part shows its address (/faq/<topic>/<part>/) without reloading.
 */
export default function FaqCenter({ topic: initialTopic, sub: initialSub }: { topic: string; sub: string }) {
  const [place, setPlace] = useState({ topic: initialTopic, sub: initialSub });
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { topic, sub } = faqPlace(place.topic, place.sub);
  // Phones: the topics are one row that scrolls sideways, kept on the chosen one.
  const tabs = useRef<HTMLElement>(null);
  useEffect(() => {
    const row = tabs.current;
    const on = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (row && on && row.scrollWidth > row.clientWidth) row.scrollTo({ left: on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2 });
  }, [topic.id]);

  const go = (topicId: string, subId?: string) => {
    const next = faqPlace(topicId, subId);
    setPlace({ topic: next.topic.id, sub: next.sub.id });
    setOpen({});
    window.history.replaceState(null, '', faqHref(next.topic.id, next.sub.id));
  };

  const needle = fold(q.trim());
  const shown: Entry[] = needle
    ? ALL.filter((e) => needle.split(/\s+/).every((w) => SEARCH_TEXT.get(e.key)!.includes(w)))
    : sub.items.map((item, i) => ({ ...item, key: `${topic.id}/${sub.id}/${i}`, tag: '' }));

  return (
    <div className={styles.page}>
      <div className={styles.searchSlot}>
        <form className={styles.search} role="search" onSubmit={(e) => e.preventDefault()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            aria-label="Search questions"
            placeholder="Search questions, e.g. refunds, waivers, payouts"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className={styles.clear} onClick={() => setQ('')}>
              Clear
            </button>
          )}
        </form>
      </div>

      {!needle && (
        <nav ref={tabs} className={styles.tabs} aria-label="FAQ topics">
          {faqTopics.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.tab} ${t.id === topic.id ? styles.tabOn : ''}`}
              aria-current={t.id === topic.id ? 'true' : undefined}
              onClick={() => go(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <section className={styles.body}>
        {needle ? (
          <span className={styles.count} role="status">
            <strong>
              {shown.length} result{shown.length === 1 ? '' : 's'}
            </strong>{' '}
            for “{q.trim()}”
          </span>
        ) : (
          <>
            <div className={styles.head}>
              <h2 className={styles.title}>{topic.label}</h2>
              <span className={styles.sub}>{topic.sub}</span>
            </div>
            {topic.subs.length > 1 && (
              <div className={styles.parts} role="group" aria-label={`${topic.label} topics`}>
                {topic.subs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={s.id === sub.id}
                    className={`${styles.part} ${s.id === sub.id ? styles.partOn : ''}`}
                    onClick={() => go(topic.id, s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {shown.length > 0 ? (
          <div className={rows.list}>
            {shown.map((e) => {
              const isOpen = Boolean(open[e.key]);
              const id = `faq-${e.key.replace(/[^a-z0-9]+/gi, '-')}`;
              return (
                <div key={e.key} className={rows.item}>
                  <button
                    type="button"
                    className={rows.question}
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen({ ...open, [e.key]: !isOpen })}
                  >
                    <span className={rows.questionText}>
                      {e.tag && <span className={rows.tag}>{e.tag}</span>}
                      <span className={rows.q}>{e.q}</span>
                    </span>
                    <span className={rows.sign} aria-hidden>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <div id={id} hidden={!isOpen}>
                    <Answer blocks={e.a} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>No matches. Try another word, or ask us below.</p>
        )}
      </section>

      <Ask />
    </div>
  );
}

/** "Still have a question?": the question goes to CLP by email (the visitor's email app opens with it written). */
function Ask() {
  const [state, setState] = useState<'closed' | 'open' | 'sent'>('closed');
  const [form, setForm] = useState({ name: '', email: '', role: ROLES[0], question: '' });
  const [tried, setTried] = useState(false);
  const valid = form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) && form.question.trim();
  const send = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    const subject = `FAQ question from ${form.name.trim()}`;
    const body = `${form.question.trim()}\n\n${form.name.trim()} · ${form.role}\n${form.email.trim()}`;
    window.location.href = `mailto:${FAQ_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setState('sent');
  };
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className={styles.askWrap}>
      <div className={styles.ask}>
        <h2 className={styles.askTitle}>Still have a question?</h2>
        <span className={styles.askSub}>Our team usually replies within 1 business day.</span>
        {state === 'closed' && (
          <div className={styles.askActions}>
            <button type="button" className={styles.askPrimary} onClick={() => setState('open')}>
              Ask a Question
            </button>
            <a className={styles.askSecondary} href={`mailto:${FAQ_EMAIL}`}>
              Email Us
            </a>
          </div>
        )}
        {state === 'open' && (
          <form className={styles.askForm} onSubmit={send} noValidate>
            <div className={styles.askRow}>
              <input
                type="text"
                aria-label="Name"
                placeholder="Name"
                autoComplete="name"
                maxLength={100}
                value={form.name}
                onChange={set('name')}
                aria-invalid={tried && !form.name.trim()}
              />
              <input
                type="email"
                aria-label="Email"
                placeholder="Email"
                autoComplete="email"
                maxLength={254}
                value={form.email}
                onChange={set('email')}
                aria-invalid={tried && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())}
              />
            </div>
            <select aria-label="I am" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <textarea
              rows={3}
              aria-label="Your question"
              placeholder="Your question"
              maxLength={2000}
              value={form.question}
              onChange={set('question')}
              aria-invalid={tried && !form.question.trim()}
            />
            {tried && !valid && (
              <span className={styles.askError} role="alert">
                Enter your name, a valid email and your question.
              </span>
            )}
            <button type="submit" className={styles.askPrimary}>
              Send
            </button>
          </form>
        )}
        {state === 'sent' && (
          <strong className={styles.askDone} role="status">
            Your email app opened with your question: send it from there and we’ll get back to you by email.
          </strong>
        )}
      </div>
    </section>
  );
}
