import type { Metadata } from 'next';
import PartnershipsView, { PartnershipsMeta } from '@/components/partners/PartnershipsView';
import { DirectorySearchProvider, DirectorySearchSlot } from '@/components/sections/DirectorySearch';
import { partnershipsHero, partnershipsMeta } from '@/content/partnerships';
import styles from '@/components/partners/partnerships.module.css';

export const metadata: Metadata = {
  title: { absolute: partnershipsMeta.title },
  description: partnershipsMeta.description,
  alternates: { canonical: '/partnerships/' },
};

/** The partners by category, CLP's featured partners, a search of every partner and the ways to partner with CLP. */
export default function PartnershipsPage() {
  return (
    <DirectorySearchProvider placeholder="Search partners, sports or services…" label="Partner name">
      <section className={styles.hero} data-header-tone="light" data-page-hero>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>{partnershipsHero.eyebrow}</span>
          <h1 className={styles.heroTitle}>{partnershipsHero.title}</h1>
          <p className={styles.heroBlurb}>{partnershipsHero.blurb}</p>
          <PartnershipsMeta className={styles.heroMeta} />
        </div>
      </section>
      <div className={styles.content} data-header-tone="dark" data-listing="">
        <DirectorySearchSlot />
        <PartnershipsView />
      </div>
    </DirectorySearchProvider>
  );
}
