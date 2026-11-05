'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { DAY_OF, markRepliesSeen, repliesOf, tellHost, type DayOfKind } from '@/content/ticket';
import styles from './ticket.module.css';
import { Back, PoweredBy, timeOf, type ScreenProps } from './parts';

const LABEL = Object.fromEntries(DAY_OF) as Record<DayOfKind, string>;

/** Updates & messages (design board 8): what they told the host and the host's replies, and a quick word to the host. */
export default function UpdatesScreen({ ticket: t, id, token, href, onChange }: ScreenProps) {
  const [kind, setKind] = useState<DayOfKind | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const replies = repliesOf(t);
  useEffect(() => markRepliesSeen(id, replies), [id, replies]);
  const feed = [...t.dayOf].reverse();
  const open = t.status === 'confirmed';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!kind) return setError('Choose what it’s about.');
    setBusy(true);
    setError('');
    try {
      onChange(await tellHost(id, token, kind, text));
      setKind(null);
      setText('');
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className={styles.body}>
        <Back href={href('ticket')} label="Ticket" />
        <h1 className={styles.title}>Updates &amp; Messages</h1>
        <p className={styles.muted}>{t.listingTitle}. Updates from the host come by e-mail. Nobody sees your number.</p>
        {feed.length === 0 && <p className={styles.note}>Nothing yet. Anything you send the host, and their reply, shows here.</p>}
        {feed.map((d) => (
          <article key={d.at} className={styles.card}>
            <span className={styles.tag}>You · {LABEL[d.kind]}</span>
            <span>{d.text || LABEL[d.kind]}</span>
            <span className={styles.muted}>{timeOf(d.at)}</span>
            {d.reply && (
              <>
                <span className={`${styles.tag} ${styles.tagReply}`}>Reply from the host</span>
                <span>{d.reply}</span>
                <span className={styles.muted}>{timeOf(d.repliedAt)}</span>
              </>
            )}
          </article>
        ))}
        {open && (
          <form className={styles.card} onSubmit={submit}>
            <strong>Message The Host</strong>
            <div className={styles.chips} role="group" aria-label="What it’s about">
              {DAY_OF.map(([k, label]) => (
                <button key={k} type="button" aria-pressed={kind === k} className={`${styles.chip} ${kind === k ? styles.chipOn : ''}`} onClick={() => { setKind(k); setSent(false); }}>
                  {label}
                </button>
              ))}
            </div>
            <label className={styles.field}>
              Add a note (optional)
              <textarea value={text} maxLength={500} rows={3} onChange={(e) => setText(e.target.value)} />
            </label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={busy || !kind}>{busy ? 'Sending…' : sent ? 'Sent ✓ · Replies Show Here' : 'Send To The Host'}</button>
          </form>
        )}
      </main>
      <PoweredBy />
    </>
  );
}
