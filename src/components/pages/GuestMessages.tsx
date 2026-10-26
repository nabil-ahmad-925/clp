'use client';
/* eslint-disable @next/next/no-img-element -- the partner's logo (their own upload), shown as it is. */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  MESSAGES_WS_URL,
  getConversation,
  listenToConversation,
  reportConversation,
  saveConversation,
  savedConversations,
  sendGuestMessage,
  type GuestConversation,
  type SavedConversation,
} from '@/content/messages';
import { partnerHref } from '@/content/partnerPages';
import styles from './GuestMessages.module.css';

/** What the conversation is about, in the guest's words (the partner's inbox calls it "Question from your page"). */
const aboutOf = (thread: GuestConversation['thread']) =>
  thread.kind === 'question' ? 'Your question' : thread.kind === 'intro' ? 'Your partnership intro' : thread.context.label || thread.subject;

const when = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
/** Between checks for new messages while the conversation is open: rarely when they arrive live on their own. */
const POLL_MS = MESSAGES_WS_URL ? 60_000 : 12_000;

/**
 * A guest's conversation (/messages/?thread=…&t=…, the private link from a partner's page, a booking or their e-mail):
 * the partner, what it's about, every message, a reply and "Report a concern to CLP". Without a link: the
 * conversations started on this device.
 */
export default function GuestMessages() {
  const params = useSearchParams();
  const id = params.get('thread') ?? '';
  const t = params.get('t') ?? '';
  return (
    <>
      <section className={styles.top} data-header-tone="light" />
      <div className={styles.page} data-header-tone="dark">
        {id && t ? <Conversation key={id} id={id} t={t} /> : <Saved />}
      </div>
    </>
  );
}

function Saved() {
  const [list] = useState<SavedConversation[]>(() => (typeof window === 'undefined' ? [] : savedConversations()));
  return (
    <div className={styles.card}>
      <span className={styles.kicker}>CLP MESSAGES</span>
      <h1 className={styles.title}>Your Conversations</h1>
      {list.length === 0 ? (
        <p className={styles.muted}>Conversations you start on CLP (a question to a partner, an intro, or a message about your booking) show here on this device. Each one also has its private link.</p>
      ) : (
        <div className={styles.saved}>
          {list.map((c) => (
            <Link key={c.path} href={c.path} className={styles.savedRow}>
              <strong>{c.name}</strong>
              <span>{c.subject}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Conversation({ id, t }: { id: string; t: string }) {
  const [data, setData] = useState<GuestConversation | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState('');
  const [reporting, setReporting] = useState(false);
  const [tick, setTick] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    let live = true;
    getConversation(id, t).then(
      (d) => {
        if (!live) return;
        setData(d);
        setError('');
        saveConversation({ path: `/messages/?thread=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`, name: d.partner.name, subject: aboutOf(d.thread), at: d.thread.lastAt });
      },
      (err) => live && setError(err instanceof Error ? err.message : 'This conversation isn’t available.'),
    );
    const timer = window.setTimeout(() => setTick((n) => n + 1), POLL_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [id, t, tick]);
  // Live: a new message fetches the conversation again at once.
  useEffect(() => listenToConversation(id, t, () => setTick((n) => n + 1)), [id, t]);
  useEffect(() => {
    const n = data?.messages.length ?? 0;
    if (n !== shown.current) {
      shown.current = n;
      end.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [data]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setSendError('');
    try {
      const r = await sendGuestMessage(id, t, text);
      setData((d) => (d ? { ...d, thread: r.thread, messages: [...d.messages, r.message] } : d));
      setText('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>This conversation isn’t available</h1>
        <p className={styles.muted}>Its link may be incomplete. Open it again from your e-mail, or from the page where you started it.</p>
        <Link href="/messages/" className={styles.secondary}>
          Your Conversations
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className={styles.card}>
        <p className={styles.muted} role="status">
          Loading your conversation…
        </p>
      </div>
    );
  }
  const { thread, messages, partner } = data;
  const host = thread.people.find((p) => !p.you);
  return (
    <div className={`${styles.card} ${styles.chatCard}`}>
      <div className={styles.head}>
        <span className={styles.logo} style={partner.color ? { background: partner.color } : undefined}>
          {partner.logo ? <img src={partner.logo} alt="" /> : partner.mono || 'CLP'}
        </span>
        <span className={styles.headText}>
          <strong>{partner.name}</strong>
          <span>{aboutOf(thread)}</span>
        </span>
        {partner.slug && (
          <Link href={partnerHref(partner.slug)} className={styles.secondarySm}>
            View Page
          </Link>
        )}
      </div>
      {thread.youth && <div className={styles.note}>This booking is for someone under 18, so the conversation is with you, the parent or guardian who booked.</div>}
      <div className={styles.messages} aria-live="polite">
        {messages.map((msg) =>
          msg.sys ? (
            <div key={msg.id} className={styles.sys}>
              {msg.text}
            </div>
          ) : (
            <div key={msg.id} className={`${styles.msg} ${msg.mine ? styles.mine : ''}`}>
              <div className={styles.bubble}>{msg.text}</div>
              <span className={styles.meta}>
                {msg.mine ? 'You' : msg.by || host?.name} · {when(msg.at)}
              </span>
            </div>
          ),
        )}
        <div ref={end} />
      </div>
      <div className={styles.composer}>
        {thread.canSend ? (
          <form className={styles.send} onSubmit={send}>
            <textarea
              aria-label="Message"
              placeholder={`Message ${partner.name}`}
              rows={2}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="submit" className={styles.primary} disabled={busy || !text.trim()}>
              {busy ? 'Sending…' : 'Send'}
            </button>
          </form>
        ) : (
          <div className={styles.closed}>{thread.closedWhy}</div>
        )}
        {sendError && (
          <p className={styles.error} role="alert">
            {sendError}
          </p>
        )}
        <div className={styles.foot}>
          <span>
            Your e-mail and phone stay private. Keep this page’s link to yourself: it opens your conversation. <Link href="/messages/">Your Conversations</Link>
          </span>
          <button type="button" className={styles.report} onClick={() => setReporting(true)}>
            Report a Concern to CLP
          </button>
        </div>
      </div>
      {reporting && <ReportForm id={id} t={t} onClose={() => setReporting(false)} />}
    </div>
  );
}

function ReportForm({ id, t, onClose }: { id: string; t: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setState('busy');
    setError('');
    try {
      await reportConversation(id, t, text);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
      setState('idle');
    }
  };
  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && state !== 'busy' && onClose()}>
      <form className={styles.dialog} role="dialog" aria-modal="true" aria-label="Report a concern to CLP" onSubmit={send}>
        <strong className={styles.dialogTitle}>Report a Concern to CLP</strong>
        {state === 'done' ? (
          <>
            <p className={styles.muted}>Thanks. CLP Trust & Safety has your report and answers within 24 hours.</p>
            <button type="button" className={styles.primary} onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <p className={styles.muted}>Tell CLP what happened. They can read this conversation and step in.</p>
            <textarea aria-label="What happened" rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened, and when" />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondary} onClick={onClose} disabled={state === 'busy'}>
                Cancel
              </button>
              <button type="submit" className={styles.danger} disabled={state === 'busy' || !text.trim()}>
                {state === 'busy' ? 'Sending…' : 'Send Report'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
