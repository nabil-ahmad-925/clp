'use client';

import { useState, type CSSProperties } from 'react';
import Reveal from '@/components/ui/Reveal';
import type { FacilityCard } from '@/content/types';
import BioModal from './BioModal';
import TeamCard from './TeamCard';
import styles from './TeamCardGrid.module.css';

/** A row of four theme team-member cards (fading in one after another); clicking one opens its full-screen bio. */
export default function TeamCardGrid({ items, gap = 0 }: { items: FacilityCard[]; gap?: number }) {
  const [open, setOpen] = useState<FacilityCard | null>(null);

  return (
    <div className={styles.grid} style={{ '--card-gap': `${gap}px` } as CSSProperties}>
      {items.map((card, i) => (
        <Reveal key={i} className={styles.column} delay={i * 50}>
          <TeamCard card={card} onOpen={() => setOpen(card)} />
        </Reveal>
      ))}
      {open && <BioModal card={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
