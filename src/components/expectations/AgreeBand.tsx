'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SAFETY_EMAIL } from '@/content/expectations';
import type { Agreement } from '@/content/expectationsAgreement';
import { agreeCopy, roleCopy, type Audience } from '@/content/expectationsRoles';
import faq from '@/components/faq/FaqCenter.module.css';
import styles from './agree.module.css';

type Props = {
  role: Audience;
  agreement: Agreement | null;
  saving: boolean;
  error: string;
  onConfirm: (role: Audience) => Promise<boolean>;
  onPrint: () => void;
};

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "Got it?": the FAQ's gold band with the agreement (I Agree stays off until the box is ticked) and Download PDF. */
export default function AgreeBand({ role, agreement, saving, error, onConfirm, onPrint }: Props) {
  const [ticked, setTicked] = useState(false);
  const copy = agreeCopy(role);
  const agreed = agreement?.role === role ? agreement : null;
  const ready = ticked && !saving;

  return (
    <section id="agree" className={styles.wrap}>
      <div className={styles.band}>
        <h2 className={`${faq.askTitle} ${styles.title}`}>Got It?</h2>
        {agreed ? (
          <span className={styles.note} role="status">
            You agreed on {dateOf(agreed.agreedAt)} as a {roleCopy[role].label.toLowerCase()}, version {agreed.version}. We’ll only ask
            again when this page changes.
          </span>
        ) : (
          <>
            <span className={styles.note}>{copy.note}</span>
            <label className={styles.box}>
              <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
              <span className={styles.check} aria-hidden>
                {ticked ? '✓' : ''}
              </span>
              {copy.text}
            </label>
          </>
        )}
        <div className={styles.actions}>
          {!agreed && (
            <button type="button" className={styles.confirm} disabled={!ready} onClick={() => void onConfirm(role).then((ok) => ok && setTicked(false))}>
              {saving ? 'Saving…' : ticked ? 'I Agree' : 'Check the Box First'}
            </button>
          )}
          <button type="button" className={styles.pdf} onClick={onPrint}>
            Download PDF
          </button>
        </div>
        {error && (
          <span className={styles.error} role="alert">
            {error}
          </span>
        )}
        <span className={styles.more}>
          Still have a question? <Link href="/faq/">Visit the FAQ</Link> or <a href={`mailto:${SAFETY_EMAIL}`}>Ask Us</a>.
        </span>
      </div>
    </section>
  );
}
