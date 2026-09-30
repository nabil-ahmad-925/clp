'use client';

import { useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import { Container } from '@/components/ui/Section';
import type { FacilityCard } from '@/content/types';
import BioModal from './BioModal';
import TeamCard from './TeamCard';
import styles from './FacilityCards.module.css';

/** Four photo cards with alternate ones lowered (sport and service pages); clicking one opens its full-screen bio. */
export default function FacilityCards({ items }: { items: FacilityCard[] }) {
  const [open, setOpen] = useState<FacilityCard | null>(null);

  return (
    <section className={styles.section} data-header-tone="dark">
      <Container>
        <div className={styles.grid}>
          {items.map((card, i) => (
            <Reveal key={`${card.title}-${i}`} className={styles.column}>
              <TeamCard card={card} onOpen={() => setOpen(card)} />
            </Reveal>
          ))}
        </div>
      </Container>

      {open && <BioModal card={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
