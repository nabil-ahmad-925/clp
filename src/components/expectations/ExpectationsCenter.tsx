'use client';

import { useEffect, useState } from 'react';
import { EXPECTATIONS_VERSION, SECTIONS, type SectionId } from '@/content/expectations';
import { roleCopy, type Audience } from '@/content/expectationsRoles';
import AgreeBand from './AgreeBand';
import AudienceSwitch from './AudienceSwitch';
import ExpectationsPrint from './ExpectationsPrint';
import ReadNav from './ReadNav';
import SectionBody from './SectionBody';
import SectionTabs, { TABS_ID } from './SectionTabs';
import { useAgreement } from './useAgreement';
import { useReading } from './useReading';
import faq from '@/components/faq/FaqCenter.module.css';
import styles from './expectations.module.css';

/** Brings an element into view when it's above the screen's top (Back / Next from the bottom of a long section). */
const reveal = (id: string) => {
  const el = document.getElementById(id);
  if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * The Expectations & Commitment page's body (see ExpectationsView): "I'm a" on the heading's edge, the seven sections
 * read in order as tabs, and the agreement band. The role changes the short version, Your Side, the FAQ and the
 * agreement's wording.
 */
export default function ExpectationsCenter() {
  const { agreement, role: startRole, status, confirm } = useAgreement();
  const [picked, setPicked] = useState<Audience | null>(null);
  const role = picked ?? startRole;
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const reading = useReading();
  const { section, index } = reading;

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const go = (id: SectionId) => {
    reading.go(id);
    reveal(TABS_ID);
  };
  const pickRole = (a: Audience) => {
    setPicked(a);
    reading.resetRow();
  };
  const onNext = () => {
    if (reading.next) return go(reading.next.id);
    document.getElementById('agree')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setToast('Last step: confirm below');
  };
  const onConfirm = async (as: Audience) => {
    const ok = await confirm(as);
    if (ok) setToast(`Thanks! Saved · version ${EXPECTATIONS_VERSION}`);
    return ok;
  };

  return (
    <>
      <div className={faq.page}>
        <AudienceSwitch value={role} onChange={pickRole} />
        <SectionTabs tab={reading.tab} seen={reading.seen} onPick={go} />
        <section className={faq.body} aria-labelledby="exp-section-title">
          <div className={faq.head}>
            <span className={styles.step}>
              {index + 1} OF {SECTIONS.length}
            </span>
            <h2 id="exp-section-title" className={`${faq.title} ${styles.title}`}>
              {section.title}
            </h2>
            <span className={styles.sub}>{section.sub.replace('{who}', roleCopy[role].who)}</span>
          </div>
          <SectionBody
            tab={reading.tab}
            role={role}
            open={reading.openRow}
            onToggle={reading.toggleRow}
            query={query}
            onQuery={(q) => {
              setQuery(q);
              reading.resetRow();
            }}
          />
          <ReadNav
            prev={reading.prev}
            next={reading.next}
            progress={`${reading.readCount} of ${SECTIONS.length} read`}
            onPrev={() => reading.prev && go(reading.prev.id)}
            onNext={onNext}
          />
        </section>
        <AgreeBand
          key={role}
          role={role}
          agreement={agreement}
          saving={status.kind === 'saving'}
          error={status.kind === 'error' ? status.message : ''}
          onConfirm={onConfirm}
          onPrint={() => window.print()}
        />
        {toast && (
          <div className={styles.toast} role="status">
            {toast}
          </div>
        )}
      </div>
      <ExpectationsPrint role={role} />
    </>
  );
}
