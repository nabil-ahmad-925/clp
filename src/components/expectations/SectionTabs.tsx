'use client';

import { useEffect, useRef } from 'react';
import { SECTIONS, type SectionId } from '@/content/expectations';
import faq from '@/components/faq/FaqCenter.module.css';
import styles from './expectations.module.css';

/** Where Back and Next scroll to when the tabs are out of sight. */
export const TABS_ID = 'sections';

type Props = { tab: SectionId; seen: Set<SectionId>; onPick: (id: SectionId) => void };

/** The seven sections as the FAQ's topic tabs (gold underline), a ✓ on the ones already read. */
export default function SectionTabs({ tab, seen, onPick }: Props) {
  const row = useRef<HTMLElement>(null);
  // Phones: the tabs are one row that scrolls sideways, kept on the open one.
  useEffect(() => {
    const el = row.current;
    const on = el?.querySelector<HTMLElement>('[aria-current="true"]');
    if (el && on && el.scrollWidth > el.clientWidth) el.scrollTo({ left: on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2 });
  }, [tab]);

  return (
    <nav ref={row} id={TABS_ID} className={`${faq.tabs} ${styles.tabs}`} aria-label="Sections">
      {SECTIONS.map((s) => {
        const on = s.id === tab;
        return (
          <button
            key={s.id}
            type="button"
            className={`${faq.tab} ${styles.tab} ${on ? faq.tabOn : ''}`}
            aria-current={on ? 'true' : undefined}
            onClick={() => onPick(s.id)}
          >
            {s.title}
            {!on && seen.has(s.id) && (
              <span className={styles.tick} aria-label="read">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
